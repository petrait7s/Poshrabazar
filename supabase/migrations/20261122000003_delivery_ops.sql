-- PosraBazar migration 6/7: platform-managed delivery, pickup separation, delivery zone fees, handover workflow,
-- delivery revenue (platform, never a seller's), unit cost for store profit and loss, seller-safe order privacy.
-- Rollback: rollbacks/20261122000003_delivery_ops_down.sql

alter type ledger_account_kind add value if not exists 'delivery_revenue';

create type delivery_status as enum ('pending', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'failed');

-- Platform-level fee per Sylhet zone (a zone is a set of upazilas, see zone_upazilas). free_over_paisa = free delivery above this subtotal.
create table delivery_zone_fees (
  zone_id         smallint primary key references delivery_zones(id) on delete cascade,
  fee_paisa       integer not null check (fee_paisa >= 0),
  free_over_paisa integer check (free_over_paisa is null or free_over_paisa > 0),
  active          boolean not null default true,
  updated_at      timestamptz not null default now()
);
create trigger delivery_zone_fees_updated before update on delivery_zone_fees for each row execute function set_updated_at();

-- One handover record per order that is delivered (pickup-only orders have none).
create table order_deliveries (
  order_id     uuid primary key references orders(id) on delete cascade,
  status       delivery_status not null default 'pending',
  fee_paisa    integer not null check (fee_paisa >= 0),
  handler_id   uuid references profiles(id),
  delivered_at timestamptz,
  settled_at   timestamptz,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index order_deliveries_status_idx on order_deliveries(status, created_at);
create trigger order_deliveries_updated before update on order_deliveries for each row execute function set_updated_at();
create table order_delivery_events (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references orders(id) on delete cascade,
  from_status delivery_status,
  to_status  delivery_status not null,
  actor_id   uuid,
  note       text,
  created_at timestamptz not null default now()
);
create index order_delivery_events_idx on order_delivery_events(order_id, id);

-- Unit cost: what the store paid for stock. Moving average per listing; snapshotted on every sold line.
alter table stock_movements add column unit_cost_paisa integer check (unit_cost_paisa is null or unit_cost_paisa >= 0);
alter table listings        add column avg_cost_paisa   integer check (avg_cost_paisa is null or avg_cost_paisa >= 0);
alter table line_financials add column cost_paisa       integer check (cost_paisa is null or cost_paisa >= 0);

create or replace function stock_movements_apply() returns trigger
language plpgsql security definer set search_path = public as $$
declare l listings%rowtype; v_avg integer;
begin
  select * into l from listings where id = new.listing_id for update;
  if not found then raise exception 'listing not found'; end if;
  if l.stock_mode <> 'own' then raise exception 'linked listings hold no stock; adjust the supply listing'; end if;
  if l.on_hand_qty + new.on_hand_delta < 0 then raise exception 'stock cannot go negative'; end if;
  if l.reserved_qty + new.reserved_delta < 0 then raise exception 'reservation cannot go negative'; end if;
  if l.reserved_qty + new.reserved_delta > l.on_hand_qty + new.on_hand_delta then raise exception 'not enough available stock'; end if;
  v_avg := l.avg_cost_paisa;
  if new.reason = 'receive' and new.unit_cost_paisa is not null and new.on_hand_delta > 0 then
    v_avg := case when l.on_hand_qty <= 0 or l.avg_cost_paisa is null then new.unit_cost_paisa
                  else round((l.on_hand_qty * l.avg_cost_paisa + new.on_hand_delta * new.unit_cost_paisa) / (l.on_hand_qty + new.on_hand_delta))::integer end;
  end if;
  perform set_config('pivot.stock_writer', 'on', true);
  update listings set on_hand_qty = on_hand_qty + new.on_hand_delta, reserved_qty = reserved_qty + new.reserved_delta, avg_cost_paisa = v_avg where id = new.listing_id;
  perform set_config('pivot.stock_writer', 'off', true);
  new.created_by := coalesce(new.created_by, auth.uid());
  return new;
end $$;

create or replace function guard_listing_stock_columns() returns trigger
language plpgsql as $$
declare w boolean := coalesce(current_setting('pivot.stock_writer', true), 'off') = 'on';
begin
  if tg_op = 'INSERT' then
    if (new.on_hand_qty <> 0 or new.reserved_qty <> 0 or new.avg_cost_paisa is not null) and not w then
      raise exception 'create the listing with zero stock and receive stock through stock_receive()';
    end if;
  elsif (new.on_hand_qty <> old.on_hand_qty or new.reserved_qty <> old.reserved_qty or new.avg_cost_paisa is distinct from old.avg_cost_paisa) and not w then
    raise exception 'stock can only change through stock_movements';
  end if;
  return new;
end $$;

create or replace function stock_move(p_listing uuid, p_on_hand numeric, p_reserved numeric, p_reason stock_reason, p_ref_type text default null, p_ref_id uuid default null, p_note text default null, p_unit_cost integer default null)
returns void language sql security definer set search_path = public as $$
  insert into stock_movements (listing_id, on_hand_delta, reserved_delta, reason, ref_type, ref_id, note, unit_cost_paisa) values (p_listing, p_on_hand, p_reserved, p_reason, p_ref_type, p_ref_id, p_note, p_unit_cost)
$$;
revoke all on function stock_move(uuid, numeric, numeric, stock_reason, text, uuid, text, integer) from public, anon, authenticated;
drop function stock_move(uuid, numeric, numeric, stock_reason, text, uuid, text);

drop function stock_receive(uuid, numeric, text);
create or replace function stock_receive(p_listing uuid, p_qty numeric, p_note text default null, p_unit_cost_paisa integer default null) returns void
language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  select store_id into sid from listings where id = p_listing;
  if sid is null or not (is_store_member(sid) or is_admin()) then raise exception 'not allowed'; end if;
  if p_qty <= 0 then raise exception 'quantity must be positive'; end if;
  perform stock_move(p_listing, p_qty, 0, 'receive', null, null, p_note, p_unit_cost_paisa);
end $$;
grant execute on function stock_receive(uuid, numeric, text, integer) to authenticated;

-- Order placement v3: service-area check, platform-managed delivery with ONE order-level zone fee, cost snapshot, public-store checks.
create or replace function place_order_v3(
  p_items jsonb, p_name text, p_phone text, p_address text, p_upazila_id smallint,
  p_payment payment_method default 'cod', p_note text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_order uuid; v_district smallint;
  it jsonb; l listings%rowtype; h listings%rowtype; st stores%rowtype; hst stores%rowtype;
  v_qty numeric; v_price integer; v_supply integer; v_tier price_tiers%rowtype; v_txn txn_type; v_cat smallint;
  v_rule commission_rules%rowtype; v_fin record; v_sub uuid; v_pick uuid; v_fee integer; v_method delivery_method;
  v_line uuid; v_total integer; v_sup_pay integer; v_cost integer; v_zone_fee integer; v_free_over integer; v_has_delivery boolean;
  v_grand_sub integer := 0; v_grand_del integer := 0;
  s record;
begin
  if v_uid is null then raise exception 'login required'; end if;
  if p_payment <> 'cod' then raise exception 'only cash on delivery is available'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'cart is empty'; end if;
  if length(trim(coalesce(p_name, ''))) < 3 or length(trim(coalesce(p_address, ''))) < 8 or p_phone !~ '^(\+?88)?01[3-9][0-9]{8}$' then raise exception 'invalid shipping details'; end if;
  select district_id into v_district from upazilas where id = p_upazila_id;
  if v_district is null then raise exception 'unknown upazila'; end if;
  if not exists (select 1 from service_areas where district_id = v_district and active) then raise exception 'we do not deliver to this area yet'; end if;

  insert into orders (buyer_id, payment_method, subtotal_paisa, delivery_paisa, total_paisa, ship_name, ship_phone, ship_address, ship_district_id, ship_upazila_id, note, model_version)
  values (v_uid, p_payment, 0, 0, 0, trim(p_name), p_phone, trim(p_address), v_district, p_upazila_id, p_note, 3) returning id into v_order;

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := (it ->> 'qty')::numeric;
    if v_qty is null or v_qty <= 0 then raise exception 'invalid quantity'; end if;
    select * into l from listings where id = (it ->> 'listing_id')::uuid;
    if not found or l.status <> 'active' then raise exception 'listing unavailable'; end if;
    select * into st from stores where id = l.store_id;
    if not store_is_public(l.store_id) then raise exception 'store unavailable'; end if;
    if v_qty < l.moq then raise exception 'below minimum order quantity (%)', l.moq; end if;

    -- who holds the stock, and what does the supplier charge?
    if l.stock_mode = 'linked' then
      select * into h from listings where id = l.source_listing_id for update;
      if h.status <> 'active' then raise exception 'supplier listing unavailable'; end if;
      select * into hst from stores where id = h.store_id;
      if not store_is_public(h.store_id) then raise exception 'supplier unavailable'; end if;
      v_supply := listing_unit_price(h.id, v_qty);
    else
      select * into h from listings where id = l.id for update;
      v_supply := null;
    end if;
    if h.on_hand_qty - h.reserved_qty < v_qty then raise exception 'not enough stock'; end if;

    select * into v_tier from price_tiers where listing_id = l.id and min_qty <= v_qty order by min_qty desc limit 1;
    if not found then raise exception 'quantity is below the minimum for this listing'; end if;
    v_price := v_tier.unit_price_paisa;
    if v_supply is not null and v_price < v_supply then raise exception 'selling price is below the supply price'; end if;

    v_txn := case when v_tier.is_wholesale then 'wholesale'::txn_type when l.kind = 'supply' then 'direct'::txn_type else 'reseller'::txn_type end;
    select category_id into v_cat from products where id = l.product_id;
    select * into v_rule from commission_rule_for(v_txn, v_cat, now());
    v_total := round(v_price * v_qty)::integer;
    v_sup_pay := case when v_supply is null then 0 else round(v_supply * v_qty)::integer end;
    v_cost := case when l.stock_mode = 'own' and h.avg_cost_paisa is not null then round(h.avg_cost_paisa * v_qty)::integer end;
    select * into v_fin from compute_line_financials(v_total, v_sup_pay, coalesce(v_rule.rate_bps, 0), coalesce(v_rule.base, 'gross'));

    -- sub-order per store (created on first line)
    select id into v_sub from sub_orders where order_id = v_order and store_id = l.store_id;
    v_pick := nullif(it ->> 'pickup_point_id', '')::uuid;
    if v_sub is null then
      if v_pick is not null then
        if not exists (select 1 from pickup_points where id = v_pick and store_id = l.store_id and active) then raise exception 'invalid pickup point'; end if;
        v_fee := 0; v_method := 'pickup';
      else
        -- the platform delivers: one order-level fee (below), nothing per store. Other arrangements are not enabled yet.
        if st.delivery_arrangement <> 'platform_managed' then raise exception 'this store''s delivery arrangement is not available yet'; end if;
        v_fee := 0; v_method := 'store';
      end if;
      insert into sub_orders (order_id, store_id, delivery_paisa, delivery_method, pickup_point_id) values (v_order, l.store_id, v_fee, v_method, v_pick) returning id into v_sub;
    else
      select pickup_point_id into v_pick from sub_orders where id = v_sub;
      if (v_pick is null) <> (nullif(it ->> 'pickup_point_id', '') is null) then raise exception 'use the same delivery choice for all items from one store'; end if;
    end if;

    insert into order_lines (sub_order_id, listing_id, product_id, qty, unit_price_paisa, line_total_paisa, stock_listing_id, supply_listing_id, supply_unit_price_paisa)
    values (v_sub, l.id, l.product_id, v_qty, v_price, v_total, h.id, case when l.stock_mode = 'linked' then h.id end, v_supply) returning id into v_line;

    insert into fulfilments (order_line_id, fulfiller_store_id, method) values (v_line, h.store_id, case when l.stock_mode = 'linked' then 'producer'::delivery_method else 'store'::delivery_method end);
    perform stock_move(h.id, 0, v_qty, 'reserve', 'order_line', v_line);

    insert into line_financials (order_line_id, txn_type, seller_store_id, supplier_store_id, commission_rule_id, commission_bps, commission_base,
                                 gross_paisa, supplier_payable_paisa, seller_margin_paisa, commission_paisa, seller_net_paisa, cost_paisa)
    values (v_line, v_txn, l.store_id, case when l.stock_mode = 'linked' then h.store_id end, v_rule.id, coalesce(v_rule.rate_bps, 0), coalesce(v_rule.base, 'gross'),
            v_total, v_sup_pay, v_fin.margin_paisa, v_fin.commission_paisa, v_fin.seller_net_paisa, v_cost);
  end loop;

  for s in select id from sub_orders where order_id = v_order loop
    update sub_orders set subtotal_paisa = (select coalesce(sum(line_total_paisa), 0) from order_lines where sub_order_id = s.id) where id = s.id;
  end loop;
  select coalesce(sum(subtotal_paisa), 0), coalesce(bool_or(delivery_method <> 'pickup'), false) into v_grand_sub, v_has_delivery from sub_orders where order_id = v_order;
  if v_has_delivery then
    select dzf.fee_paisa, dzf.free_over_paisa into v_zone_fee, v_free_over from delivery_zone_fees dzf join zone_upazilas zu on zu.zone_id = dzf.zone_id
     where zu.upazila_id = p_upazila_id and dzf.active order by dzf.fee_paisa limit 1;
    if v_zone_fee is null then raise exception 'delivery is not available to the selected upazila'; end if;
    v_grand_del := case when v_free_over is not null and v_grand_sub >= v_free_over then 0 else v_zone_fee end;
    insert into order_deliveries (order_id, fee_paisa) values (v_order, v_grand_del);
    insert into order_delivery_events (order_id, to_status, actor_id) values (v_order, 'pending', v_uid);
  end if;
  update orders set subtotal_paisa = v_grand_sub, delivery_paisa = v_grand_del, total_paisa = v_grand_sub + v_grand_del where id = v_order;
  return v_order;
end $$;
revoke all on function place_order_v3(jsonb, text, text, text, smallint, payment_method, text) from public, anon;
grant execute on function place_order_v3(jsonb, text, text, text, smallint, payment_method, text) to authenticated;
drop function place_order_v2(jsonb, text, text, text, smallint, payment_method, text);

-- Delivery fee revenue belongs to the platform. Posted once, when the whole order is delivered.
create or replace function finish_order_delivery(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare d order_deliveries%rowtype; v_txn uuid := gen_random_uuid();
begin
  select * into d from order_deliveries where order_id = p_order for update;
  if not found or d.status = 'delivered' then return; end if;
  if (select status from orders where id = p_order) <> 'delivered' then return; end if;
  update order_deliveries set status = 'delivered', delivered_at = now() where order_id = p_order;
  insert into order_delivery_events (order_id, from_status, to_status, actor_id) values (p_order, d.status, 'delivered', auth.uid());
  if d.fee_paisa > 0 and d.settled_at is null then
    insert into ledger_entries (txn_id, account_id, debit_paisa, memo) values (v_txn, ledger_account('order_clearing'), d.fee_paisa, 'delivery fee paid by customer');
    insert into ledger_entries (txn_id, account_id, credit_paisa, memo) values (v_txn, ledger_account('delivery_revenue'), d.fee_paisa, 'delivery fee: platform revenue');
    update order_deliveries set settled_at = now() where order_id = p_order;
  end if;
end $$;
revoke all on function finish_order_delivery(uuid) from public, anon, authenticated;

create or replace function confirm_delivery(p_sub uuid) returns void
language plpgsql security definer set search_path = public as $$
declare so sub_orders%rowtype; f record; v_live int;
begin
  select * into so from sub_orders where id = p_sub for update;
  if not found then raise exception 'not found'; end if;
  if not (is_admin() or exists (select 1 from orders o where o.id = so.order_id and o.buyer_id = auth.uid())) then raise exception 'only the buyer can confirm delivery'; end if;
  select count(*) into v_live from fulfilments fu join order_lines ol on ol.id = fu.order_line_id where ol.sub_order_id = p_sub and fu.status not in ('cancelled', 'failed');
  if v_live = 0 then raise exception 'nothing to confirm'; end if;
  if exists (select 1 from fulfilments fu join order_lines ol on ol.id = fu.order_line_id where ol.sub_order_id = p_sub and fu.status in ('pending', 'accepted', 'ready')) then
    raise exception 'items have not been handed over yet';
  end if;
  for f in select fu.id from fulfilments fu join order_lines ol on ol.id = fu.order_line_id where ol.sub_order_id = p_sub and fu.status = 'handed_over' loop
    perform set_fulfilment_status(f.id, 'delivered', true);
  end loop;
  perform settle_sub_order(p_sub);
  perform finish_order_delivery(so.order_id);
end $$;

-- Founder/ops workflow. Admins only. Each step has side effects on the underlying fulfilments, so there is one source of truth.
create or replace function advance_order_delivery(p_order uuid, p_to delivery_status, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare d order_deliveries%rowtype; f record; so record; ok boolean;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  select * into d from order_deliveries where order_id = p_order for update;
  if not found then raise exception 'this order has no delivery'; end if;
  ok := (d.status = 'pending' and p_to = 'preparing') or (d.status = 'preparing' and p_to = 'ready_for_delivery')
     or (d.status = 'ready_for_delivery' and p_to = 'out_for_delivery') or (d.status = 'out_for_delivery' and p_to in ('delivered', 'failed'));
  if not ok then raise exception 'invalid delivery change % -> %', d.status, p_to; end if;

  if p_to = 'ready_for_delivery' then
    if exists (select 1 from fulfilments fu join order_lines ol on ol.id = fu.order_line_id join sub_orders s on s.id = ol.sub_order_id
                where s.order_id = p_order and s.delivery_method <> 'pickup' and fu.status in ('pending', 'accepted')) then raise exception 'some items are not ready yet'; end if;
  elsif p_to = 'out_for_delivery' then
    for f in select fu.id from fulfilments fu join order_lines ol on ol.id = fu.order_line_id join sub_orders s on s.id = ol.sub_order_id
              where s.order_id = p_order and s.delivery_method <> 'pickup' and fu.status = 'ready' loop
      perform set_fulfilment_status(f.id, 'handed_over', true);
    end loop;
  elsif p_to = 'failed' then
    for f in select fu.id from fulfilments fu join order_lines ol on ol.id = fu.order_line_id join sub_orders s on s.id = ol.sub_order_id
              where s.order_id = p_order and s.delivery_method <> 'pickup' and fu.status = 'handed_over' loop
      perform set_fulfilment_status(f.id, 'failed', true);
    end loop;
  elsif p_to = 'delivered' then
    for so in select s.id from sub_orders s where s.order_id = p_order and s.delivery_method <> 'pickup' and s.status not in ('delivered', 'cancelled') loop
      perform confirm_delivery(so.id);
    end loop;
  end if;
  if p_to <> 'delivered' then   -- 'delivered' is stamped by finish_order_delivery once the whole order is delivered
    update order_deliveries set status = p_to, handler_id = coalesce(handler_id, auth.uid()), note = coalesce(p_note, note) where order_id = p_order;
    insert into order_delivery_events (order_id, from_status, to_status, actor_id, note) values (p_order, d.status, p_to, auth.uid(), p_note);
  else
    update order_deliveries set handler_id = coalesce(handler_id, auth.uid()), note = coalesce(p_note, note) where order_id = p_order;
  end if;
end $$;
revoke all on function advance_order_delivery(uuid, delivery_status, text) from public, anon;
grant execute on function advance_order_delivery(uuid, delivery_status, text) to authenticated;

-- ───────────────────────── privacy: sellers never read the customer's phone or address ─────────────────────────
drop policy orders_read on orders;
create policy orders_read on orders for select using (buyer_id = auth.uid() or is_admin());

create view seller_orders as
  select so.id as sub_order_id, so.order_id, o.code, so.store_id, so.status, so.subtotal_paisa, so.delivery_method, so.created_at,
         split_part(trim(o.ship_name), ' ', 1) as customer_first_name, o.ship_district_id, o.ship_upazila_id
    from sub_orders so join orders o on o.id = so.order_id
   where is_store_member(so.store_id) or is_staff();
grant select on seller_orders to authenticated;

create view ops_delivery_queue with (security_invoker = true) as
  select o.id as order_id, o.code, o.status as order_status, d.status as delivery_status, d.fee_paisa, o.total_paisa, o.ship_name, o.ship_phone, o.ship_address, o.ship_upazila_id, o.created_at,
         (select count(*) from sub_orders s where s.order_id = o.id) as stores
    from orders o join order_deliveries d on d.order_id = o.id;

-- Store profit and loss on delivered lines. cost_paisa is null when the store never recorded a unit cost (profit is then unknown, not zero).
create view store_profit_loss with (security_invoker = true) as
  select lf.seller_store_id as store_id, count(*) as lines, sum(lf.gross_paisa) as gross_paisa, sum(lf.commission_paisa) as commission_paisa, sum(lf.seller_net_paisa) as net_paisa,
         sum(lf.cost_paisa) as cost_paisa, count(*) filter (where lf.cost_paisa is null) as lines_without_cost,
         sum(lf.seller_net_paisa - coalesce(lf.cost_paisa, 0)) filter (where lf.cost_paisa is not null) as profit_paisa
    from line_financials lf join order_lines ol on ol.id = lf.order_line_id where ol.status = 'delivered' group by lf.seller_store_id;

alter table delivery_zone_fees    enable row level security;
alter table order_deliveries      enable row level security;
alter table order_delivery_events enable row level security;
create policy zone_fees_read  on delivery_zone_fees for select using (true);
create policy zone_fees_admin on delivery_zone_fees for all using (is_admin()) with check (is_admin());
create policy order_deliveries_read on order_deliveries for select using (is_staff() or exists (select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid()));
create policy order_delivery_events_read on order_delivery_events for select using (is_staff() or exists (select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid()));
