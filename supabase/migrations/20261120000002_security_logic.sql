-- Helpers, business rules (triggers + RPC), read views and Row Level Security.

-- ───────────────────────── role helpers ─────────────────────────
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function is_staff() returns boolean            -- admin or Sathi agent
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'agent'))
$$;

create or replace function owns_seller(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from sellers where id = sid and owner_id = auth.uid())
$$;

-- Used by order policies; security definer avoids orders <-> order_items policy recursion.
create or replace function is_order_buyer(oid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from orders where id = oid and buyer_id = auth.uid())
$$;

create or replace function is_order_seller(oid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from order_items i join sellers s on s.id = i.seller_id where i.order_id = oid and s.owner_id = auth.uid())
$$;

-- ───────────────────────── new auth user → profile ─────────────────────────
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, phone, full_name, role)
  values (
    new.id,
    nullif(new.phone, ''),
    new.raw_user_meta_data ->> 'full_name',
    -- users may only self-select buyer/seller; admin and agent are granted by staff
    case when new.raw_user_meta_data ->> 'role' = 'seller' then 'seller'::user_role else 'buyer'::user_role end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Block privilege escalation: only staff (or the service role, auth.uid() is null) may change roles.
create or replace function guard_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not is_admin() then
    raise exception 'only admins can change roles';
  end if;
  return new;
end $$;
create trigger profiles_guard_role before update on profiles for each row execute function guard_profile_role();

-- Creating a seller shop upgrades a buyer to seller.
create or replace function promote_owner_to_seller() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles set role = 'seller' where id = new.owner_id and role = 'buyer';
  return new;
end $$;
create trigger sellers_promote_owner after insert on sellers for each row when (new.owner_id is not null) execute function promote_owner_to_seller();

-- Only staff may verify a seller.
create or replace function guard_seller_verification() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and not is_staff() then new.verification := 'pending'; new.verified_at := null; new.verified_by := null; end if;
  elsif new.verification is distinct from old.verification and auth.uid() is not null and not is_staff() then
    raise exception 'only staff can change seller verification';
  end if;
  if new.verification = 'verified' and (tg_op = 'INSERT' or old.verification <> 'verified') then
    new.verified_at := now(); new.verified_by := coalesce(auth.uid(), new.verified_by);
  end if;
  return new;
end $$;
create trigger sellers_guard_verification before insert or update on sellers for each row execute function guard_seller_verification();

-- New listings wait for moderation; sellers can pause/resume approved ones but never self-approve.
create or replace function guard_offer_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'pending';
  elsif new.status is distinct from old.status then
    if old.status in ('pending', 'rejected') or new.status in ('pending', 'rejected') then
      raise exception 'listing status is controlled by moderators';
    end if;
  end if;
  return new;
end $$;
create trigger offers_guard_status before insert or update on offers for each row execute function guard_offer_status();

-- ───────────────────────── orders ─────────────────────────
-- Prices are always re-read from offers here; the client never supplies a price.
-- p_items: [{"offer_id": "<uuid>", "mode": "retail"|"wholesale", "qty": 2}, ...]
create or replace function place_order(
  p_items jsonb, p_name text, p_phone text, p_address text, p_district_id smallint,
  p_payment payment_method default 'cod', p_note text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_order uuid;
  v_sub integer := 0;
  v_delivery constant integer := 6000;                 -- ৳60 flat, replace with zone pricing later
  it jsonb; o offers%rowtype; v_mode price_mode; v_qty numeric; v_unit integer; v_line integer;
begin
  if v_uid is null then raise exception 'login required'; end if;
  if p_payment <> 'cod' then raise exception 'payment gateway not enabled yet; use cod'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'cart is empty'; end if;
  if length(trim(coalesce(p_name, ''))) < 3 or length(trim(coalesce(p_address, ''))) < 8 or p_phone !~ '^(\+?88)?01[3-9][0-9]{8}$' then
    raise exception 'invalid shipping details';
  end if;

  insert into orders (buyer_id, payment_method, subtotal_paisa, delivery_paisa, total_paisa, ship_name, ship_phone, ship_address, ship_district_id, note)
  values (v_uid, p_payment, 0, v_delivery, v_delivery, trim(p_name), p_phone, trim(p_address), p_district_id, p_note)
  returning id into v_order;

  for it in select * from jsonb_array_elements(p_items) loop
    v_mode := (it ->> 'mode')::price_mode;
    v_qty  := (it ->> 'qty')::numeric;
    if v_qty is null or v_qty <= 0 then raise exception 'invalid quantity'; end if;

    select * into o from offers where id = (it ->> 'offer_id')::uuid for update;
    if not found or o.status <> 'active' then raise exception 'offer unavailable'; end if;
    if exists (select 1 from sellers where id = o.seller_id and verification = 'rejected') then raise exception 'seller unavailable'; end if;
    if o.stock_qty < v_qty then raise exception 'not enough stock'; end if;
    if v_mode = 'wholesale' and v_qty < o.moq then raise exception 'below wholesale minimum order (%)', o.moq; end if;

    v_unit := case v_mode when 'retail' then o.retail_paisa else o.wholesale_paisa end;
    v_line := round(v_unit * v_qty);
    v_sub  := v_sub + v_line;

    update offers set stock_qty = stock_qty - v_qty where id = o.id;
    insert into order_items (order_id, offer_id, product_id, seller_id, mode, qty, unit_price_paisa, line_total_paisa)
    values (v_order, o.id, o.product_id, o.seller_id, v_mode, v_qty, v_unit, v_line);
  end loop;

  update orders set subtotal_paisa = v_sub, total_paisa = v_sub + v_delivery where id = v_order;
  return v_order;
end $$;
revoke all on function place_order(jsonb, text, text, text, smallint, payment_method, text) from public, anon;
grant execute on function place_order(jsonb, text, text, text, smallint, payment_method, text) to authenticated;

-- Buyer cancels a line that has not shipped yet; stock goes back.
create or replace function cancel_order_item(p_item uuid) returns void
language plpgsql security definer set search_path = public as $$
declare i order_items%rowtype;
begin
  select oi.* into i from order_items oi join orders o on o.id = oi.order_id
   where oi.id = p_item and o.buyer_id = auth.uid() for update of oi;
  if not found then raise exception 'not found'; end if;
  if i.status not in ('placed', 'ready') then raise exception 'cannot cancel after shipping'; end if;
  update order_items set status = 'cancelled' where id = p_item;
end $$;
revoke all on function cancel_order_item(uuid) from public, anon;
grant execute on function cancel_order_item(uuid) to authenticated;

-- Allowed line transitions; sellers/admin only move forward.
create or replace function guard_item_transition() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = old.status then return new; end if;
  if auth.uid() is null or is_admin() then return new; end if;
  if not (
       (old.status = 'placed'  and new.status in ('ready', 'cancelled'))
    or (old.status = 'ready'   and new.status in ('shipped', 'cancelled'))
    or (old.status = 'shipped' and new.status = 'delivered')
  ) then
    raise exception 'invalid status change % -> %', old.status, new.status;
  end if;
  return new;
end $$;
create trigger order_items_guard_transition before update of status on order_items for each row execute function guard_item_transition();

-- Timeline, order rollup and stock restore.
create or replace function after_item_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_total int; v_deliv int; v_cancel int;
begin
  if tg_op = 'INSERT' then
    insert into order_events (order_item_id, status) values (new.id, new.status);
    return new;
  end if;
  if new.status = old.status then return new; end if;
  insert into order_events (order_item_id, status) values (new.id, new.status);
  if new.status = 'cancelled' and new.offer_id is not null then
    update offers set stock_qty = stock_qty + new.qty where id = new.offer_id;
  end if;
  select count(*), count(*) filter (where status = 'delivered'), count(*) filter (where status = 'cancelled')
    into v_total, v_deliv, v_cancel from order_items where order_id = new.order_id;
  update orders set status = case
      when v_cancel = v_total then 'cancelled'::order_status
      when v_deliv + v_cancel = v_total then 'delivered'::order_status
      when exists (select 1 from order_items where order_id = new.order_id and status = 'shipped') then 'shipped'::order_status
      when exists (select 1 from order_items where order_id = new.order_id and status = 'ready') then 'ready'::order_status
      else 'placed'::order_status end
    where id = new.order_id;
  return new;
end $$;
create trigger order_items_after_insert after insert on order_items for each row execute function after_item_status();
create trigger order_items_after_update after update of status on order_items for each row execute function after_item_status();

-- Reviews: only the buyer, only after delivery, and product/seller are copied from the order line.
create or replace function guard_review() returns trigger
language plpgsql security definer set search_path = public as $$
declare i order_items%rowtype; b uuid;
begin
  select * into i from order_items where id = new.order_item_id;
  if not found then raise exception 'order item not found'; end if;
  select buyer_id into b from orders where id = i.order_id;
  if i.status <> 'delivered' then raise exception 'you can only review delivered orders'; end if;
  if auth.uid() is not null and b <> auth.uid() then raise exception 'not your order'; end if;
  new.product_id := i.product_id; new.seller_id := i.seller_id; new.buyer_id := b;
  return new;
end $$;
create trigger reviews_guard before insert on reviews for each row execute function guard_review();

-- ───────────────────────── read views (RLS of the caller applies) ─────────────────────────
create view seller_product_ratings with (security_invoker = on) as
  select product_id, seller_id, round(avg(rating)::numeric, 1) as rating, count(*)::int as review_count
  from reviews group by product_id, seller_id;

create view seller_ratings with (security_invoker = on) as
  select seller_id, round(avg(rating)::numeric, 1) as rating, count(*)::int as review_count
  from reviews group by seller_id;

-- Everything the product page comparison table needs, one row per active offer.
create view offer_listing with (security_invoker = on) as
  select o.id as offer_id, o.product_id, o.seller_id,
         o.retail_paisa, o.wholesale_paisa, o.moq, o.stock_qty, o.grade, coalesce(o.origin, p.origin) as origin,
         s.slug as seller_slug, s.name_bn as seller_name_bn, s.kind as seller_kind,
         s.verification = 'verified' as seller_verified,
         d.id as district_id, d.name_bn as district_bn, dv.id as division_id, dv.name_bn as division_bn,
         spr.rating, coalesce(spr.review_count, 0) as review_count
  from offers o
  join products p on p.id = o.product_id
  join sellers s on s.id = o.seller_id
  join districts d on d.id = s.district_id
  join divisions dv on dv.id = d.division_id
  left join seller_product_ratings spr on spr.product_id = o.product_id and spr.seller_id = o.seller_id
  where o.status = 'active' and p.active and s.verification <> 'rejected';

-- Card data for grids: lowest prices and seller count. Filter by area via offer_listing when needed.
create view product_cards with (security_invoker = on) as
  select p.id as product_id, p.slug, p.name_bn, p.name_en, p.unit_bn, c.slug as category_slug, p.image_url,
         min(l.retail_paisa) as min_retail_paisa, min(l.wholesale_paisa) as min_wholesale_paisa,
         count(l.offer_id)::int as seller_count, coalesce(bool_or(l.seller_verified), false) as any_verified
  from products p
  join categories c on c.id = p.category_id
  left join offer_listing l on l.product_id = p.id
  where p.active
  group by p.id, c.slug;

-- Daily market summary per product (all markets averaged) for trend charts.
create view market_price_daily with (security_invoker = on) as
  select product_id, price_date,
         round(avg(retail_paisa))::int as avg_retail_paisa, round(avg(wholesale_paisa))::int as avg_wholesale_paisa,
         min(retail_paisa) as low_paisa, max(retail_paisa) as high_paisa
  from market_prices group by product_id, price_date;

-- ───────────────────────── Row Level Security ─────────────────────────
alter table divisions          enable row level security;
alter table districts          enable row level security;
alter table profiles           enable row level security;
alter table sellers            enable row level security;
alter table seller_coverage    enable row level security;
alter table categories         enable row level security;
alter table products           enable row level security;
alter table offers             enable row level security;
alter table wishlists          enable row level security;
alter table orders             enable row level security;
alter table order_items        enable row level security;
alter table order_events       enable row level security;
alter table reviews            enable row level security;
alter table markets            enable row level security;
alter table market_prices      enable row level security;
alter table price_alerts       enable row level security;
alter table article_categories enable row level security;
alter table articles           enable row level security;
alter table khata_entries      enable row level security;
alter table demo_requests      enable row level security;

-- public reference data (admin-managed)
create policy divisions_read          on divisions          for select using (true);
create policy districts_read          on districts          for select using (true);
create policy categories_read         on categories         for select using (true);
create policy markets_read            on markets            for select using (true);
create policy article_categories_read on article_categories for select using (true);
create policy divisions_admin          on divisions          for all using (is_admin()) with check (is_admin());
create policy districts_admin          on districts          for all using (is_admin()) with check (is_admin());
create policy categories_admin         on categories         for all using (is_admin()) with check (is_admin());
create policy markets_admin            on markets            for all using (is_admin()) with check (is_admin());
create policy article_categories_admin on article_categories for all using (is_admin()) with check (is_admin());

-- profiles
create policy profiles_self_read   on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_self_update on profiles for update using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());

-- sellers
create policy sellers_read   on sellers for select using (verification <> 'rejected' or owner_id = auth.uid() or is_staff());
create policy sellers_insert on sellers for insert with check (owner_id = auth.uid() or is_admin());
create policy sellers_update on sellers for update using (owner_id = auth.uid() or is_staff()) with check (owner_id = auth.uid() or is_staff());
create policy sellers_delete on sellers for delete using (is_admin());
create policy coverage_read  on seller_coverage for select using (true);
create policy coverage_write on seller_coverage for all using (owns_seller(seller_id) or is_staff()) with check (owns_seller(seller_id) or is_staff());

-- catalog
create policy products_read  on products for select using (active or is_admin());
create policy products_admin on products for all using (is_admin()) with check (is_admin());
create policy offers_read    on offers for select using (status = 'active' or owns_seller(seller_id) or is_admin());
create policy offers_write   on offers for all using (owns_seller(seller_id) or is_admin()) with check (owns_seller(seller_id) or is_admin());

-- personal lists
create policy wishlists_own on wishlists   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy alerts_own    on price_alerts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- orders: created only through place_order(); buyer, involved sellers and admin can read.
create policy orders_read on orders for select using (
  buyer_id = auth.uid() or is_admin() or is_order_seller(id)
);
create policy orders_admin_update on orders for update using (is_admin()) with check (is_admin());

create policy order_items_read on order_items for select using (
  owns_seller(seller_id) or is_admin() or is_order_buyer(order_id)
);
create policy order_items_seller_update on order_items for update
  using (owns_seller(seller_id) or is_admin()) with check (owns_seller(seller_id) or is_admin());

create policy order_events_read on order_events for select using (
  exists (select 1 from order_items i where i.id = order_events.order_item_id
          and (owns_seller(i.seller_id) or is_admin() or is_order_buyer(i.order_id)))
);

-- reviews
create policy reviews_read   on reviews for select using (true);
create policy reviews_insert on reviews for insert with check (buyer_id = auth.uid());
create policy reviews_update on reviews for update using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());
create policy reviews_delete on reviews for delete using (buyer_id = auth.uid() or is_admin());

-- market prices: public read, staff (admin / Sathi agents) write
create policy market_prices_read  on market_prices for select using (true);
create policy market_prices_write on market_prices for all using (is_staff()) with check (is_staff());

-- knowledge
create policy articles_read  on articles for select using (status = 'published' or is_admin());
create policy articles_admin on articles for all using (is_admin()) with check (is_admin());

-- Khata Lite: private to the seller
create policy khata_own on khata_entries for all using (owns_seller(seller_id)) with check (owns_seller(seller_id));

-- software demo requests: anyone can submit, only admin reads
create policy demo_insert on demo_requests for insert with check (true);
create policy demo_admin_read on demo_requests for select using (is_admin());
