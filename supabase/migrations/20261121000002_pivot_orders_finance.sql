-- PosraBazar pivot, migration 2/3: parent orders → store sub-orders → lines → fulfilments,
-- commission rules, per-line financial snapshots, and an append-only accounting ledger.
-- ADDITIVE. Rollback: rollbacks/20261121000002_pivot_orders_finance_down.sql
--
-- LEGAL NOTE: the ledger below is an ACCOUNTING RECORD of what each party is owed on delivered orders.
-- It is not a wallet or stored-value balance, it holds no customer money, and there are deliberately no
-- top-up, withdrawal or payout functions. Anything that moves or holds money needs legal review first.

create type txn_type            as enum ('direct', 'reseller', 'wholesale');
create type fulfilment_status   as enum ('pending', 'accepted', 'ready', 'handed_over', 'delivered', 'failed', 'cancelled');
create type delivery_method     as enum ('producer', 'store', 'pickup', 'courier');
create type commission_base     as enum ('gross', 'margin');
create type ledger_account_kind as enum ('store_payable', 'platform_commission', 'order_clearing');

-- v2 orders use the existing orders table as the parent.
alter table orders
  add column ship_upazila_id smallint references upazilas(id),
  add column model_version smallint not null default 1;   -- 1 = legacy seller model, 2 = sub-order model

create table sub_orders (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders(id) on delete cascade,
  store_id         uuid not null references stores(id),
  status           order_status not null default 'placed',
  subtotal_paisa   integer not null default 0 check (subtotal_paisa >= 0),
  delivery_paisa   integer not null default 0 check (delivery_paisa >= 0),
  delivery_method  delivery_method not null default 'store',
  pickup_point_id  uuid references pickup_points(id),
  settled_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (order_id, store_id)
);
create index sub_orders_store_idx on sub_orders(store_id, status);
create trigger sub_orders_updated before update on sub_orders for each row execute function set_updated_at();

create table order_lines (
  id                      uuid primary key default gen_random_uuid(),
  sub_order_id            uuid not null references sub_orders(id) on delete cascade,
  listing_id              uuid not null references listings(id),
  product_id              uuid not null references products(id),
  qty                     numeric(12,2) not null check (qty > 0),
  unit_price_paisa        integer not null check (unit_price_paisa > 0),
  line_total_paisa        integer not null check (line_total_paisa > 0),
  stock_listing_id        uuid not null references listings(id),   -- whose stock was reserved (own listing, or the producer's for linked)
  supply_listing_id       uuid references listings(id),
  supply_unit_price_paisa integer check (supply_unit_price_paisa > 0),
  status                  order_status not null default 'placed'
);
create index order_lines_sub_idx on order_lines(sub_order_id);

create table fulfilments (
  id                uuid primary key default gen_random_uuid(),
  order_line_id     uuid not null unique references order_lines(id) on delete cascade,
  fulfiller_store_id uuid not null references stores(id),
  status            fulfilment_status not null default 'pending',
  method            delivery_method not null default 'store',
  provider          text,            -- reserved for a future courier integration
  tracking_ref      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index fulfilments_store_idx on fulfilments(fulfiller_store_id, status);
create trigger fulfilments_updated before update on fulfilments for each row execute function set_updated_at();

-- ───────────────────────── commission ─────────────────────────
-- Rates are data, not code. The pilot ships with 0% for every transaction type.
create table commission_rules (
  id          uuid primary key default gen_random_uuid(),
  txn_type    txn_type not null,
  category_id smallint references categories(id),          -- null = all categories
  rate_bps    integer not null check (rate_bps between 0 and 10000),   -- 100 bps = 1%
  base        commission_base not null default 'gross',
  active_from timestamptz not null default now(),
  active_to   timestamptz,
  label       text,
  created_by  uuid,
  created_at  timestamptz not null default now(),
  check (active_to is null or active_to > active_from)
);
create index commission_rules_lookup_idx on commission_rules(txn_type, active_from desc);

-- Most specific rule wins (category over all), then the most recently started.
create or replace function commission_rule_for(p_txn txn_type, p_category smallint, p_at timestamptz default now()) returns commission_rules
language sql stable set search_path = public as $$
  select r.* from commission_rules r
  where r.txn_type = p_txn and r.active_from <= p_at and (r.active_to is null or r.active_to > p_at)
    and (r.category_id is null or r.category_id = p_category)
  order by (r.category_id is not null) desc, r.active_from desc, r.created_at desc
  limit 1
$$;

-- ───────────────────────── financial arithmetic (pure, testable) ─────────────────────────
-- gross            what the customer pays for the line
-- supplier_payable what the producer is owed when the line is linked (supply price × qty); 0 otherwise
-- margin           gross − supplier_payable (the seller's revenue)
-- commission       rate on the base (gross or margin), capped at the margin so a seller can never owe more than they earn
-- seller_net       margin − commission
-- invariant: gross = supplier_payable + seller_net + commission
create or replace function compute_line_financials(p_gross integer, p_supplier_payable integer, p_bps integer, p_base commission_base)
returns table (margin_paisa integer, commission_paisa integer, seller_net_paisa integer)
language plpgsql immutable as $$
declare m integer; c integer;
begin
  if p_gross < 0 or p_supplier_payable < 0 or p_supplier_payable > p_gross then raise exception 'invalid amounts'; end if;
  m := p_gross - p_supplier_payable;
  c := round((case p_base when 'gross' then p_gross else m end)::numeric * p_bps / 10000)::integer;
  if c > m then c := m; end if;
  return query select m, c, m - c;
end $$;

-- Immutable snapshot taken when the order is placed, including which rule produced the rate.
create table line_financials (
  order_line_id          uuid primary key references order_lines(id) on delete cascade,
  txn_type               txn_type not null,
  seller_store_id        uuid not null references stores(id),
  supplier_store_id      uuid references stores(id),
  commission_rule_id     uuid references commission_rules(id),
  commission_bps         integer not null check (commission_bps between 0 and 10000),
  commission_base        commission_base not null,
  gross_paisa            integer not null check (gross_paisa > 0),
  supplier_payable_paisa integer not null default 0 check (supplier_payable_paisa >= 0),
  seller_margin_paisa    integer not null check (seller_margin_paisa >= 0),
  commission_paisa       integer not null check (commission_paisa >= 0),
  seller_net_paisa       integer not null check (seller_net_paisa >= 0),
  check (gross_paisa = supplier_payable_paisa + seller_net_paisa + commission_paisa)
);

-- ───────────────────────── accounting ledger (append-only) ─────────────────────────
create table ledger_accounts (
  id       uuid primary key default gen_random_uuid(),
  kind     ledger_account_kind not null,
  store_id uuid references stores(id),
  unique nulls not distinct (kind, store_id),
  check ((kind = 'store_payable') = (store_id is not null))
);

create table ledger_entries (
  id            bigint generated always as identity primary key,
  txn_id        uuid not null,                       -- one settlement = one txn; debits must equal credits within it
  sub_order_id  uuid references sub_orders(id),
  order_line_id uuid references order_lines(id),
  account_id    uuid not null references ledger_accounts(id),
  debit_paisa   integer not null default 0 check (debit_paisa >= 0),
  credit_paisa  integer not null default 0 check (credit_paisa >= 0),
  memo          text,
  created_at    timestamptz not null default now(),
  check ((debit_paisa > 0) <> (credit_paisa > 0))
);
create index ledger_entries_account_idx on ledger_entries(account_id, id);
create index ledger_entries_txn_idx on ledger_entries(txn_id);
create or replace function ledger_entries_immutable() returns trigger
language plpgsql as $$ begin raise exception 'ledger_entries is append-only'; end $$;
create trigger ledger_entries_no_change before update or delete on ledger_entries for each row execute function ledger_entries_immutable();

create or replace function ledger_account(p_kind ledger_account_kind, p_store uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  select id into v from ledger_accounts where kind = p_kind and store_id is not distinct from p_store;
  if v is null then insert into ledger_accounts (kind, store_id) values (p_kind, p_store) returning id into v; end if;
  return v;
end $$;
revoke all on function ledger_account(ledger_account_kind, uuid) from public, anon, authenticated;

-- ───────────────────────── order creation ─────────────────────────
-- p_items: [{"listing_id": "<uuid>", "qty": 2, "pickup_point_id": "<uuid>"|null}, ...]
-- The client never sends a price. Stock is reserved on the listing that really holds it
-- (the producer's supply listing for linked offers).
create or replace function place_order_v2(
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
  v_line uuid; v_total integer; v_sup_pay integer;
  v_grand_sub integer := 0; v_grand_del integer := 0;
  s record;
begin
  if v_uid is null then raise exception 'login required'; end if;
  if p_payment <> 'cod' then raise exception 'only cash on delivery is available'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'cart is empty'; end if;
  if length(trim(coalesce(p_name, ''))) < 3 or length(trim(coalesce(p_address, ''))) < 8 or p_phone !~ '^(\+?88)?01[3-9][0-9]{8}$' then raise exception 'invalid shipping details'; end if;
  select district_id into v_district from upazilas where id = p_upazila_id;
  if v_district is null then raise exception 'unknown upazila'; end if;

  insert into orders (buyer_id, payment_method, subtotal_paisa, delivery_paisa, total_paisa, ship_name, ship_phone, ship_address, ship_district_id, ship_upazila_id, note, model_version)
  values (v_uid, p_payment, 0, 0, 0, trim(p_name), p_phone, trim(p_address), v_district, p_upazila_id, p_note, 2) returning id into v_order;

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := (it ->> 'qty')::numeric;
    if v_qty is null or v_qty <= 0 then raise exception 'invalid quantity'; end if;
    select * into l from listings where id = (it ->> 'listing_id')::uuid;
    if not found or l.status <> 'active' then raise exception 'listing unavailable'; end if;
    select * into st from stores where id = l.store_id;
    if st.status = 'rejected' then raise exception 'store unavailable'; end if;
    if v_qty < l.moq then raise exception 'below minimum order quantity (%)', l.moq; end if;

    -- who holds the stock, and what does the supplier charge?
    if l.stock_mode = 'linked' then
      select * into h from listings where id = l.source_listing_id for update;
      if h.status <> 'active' then raise exception 'supplier listing unavailable'; end if;
      select * into hst from stores where id = h.store_id;
      if hst.status = 'rejected' then raise exception 'supplier unavailable'; end if;
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
    select * into v_fin from compute_line_financials(v_total, v_sup_pay, coalesce(v_rule.rate_bps, 0), coalesce(v_rule.base, 'gross'));

    -- sub-order per store (created on first line)
    select id into v_sub from sub_orders where order_id = v_order and store_id = l.store_id;
    v_pick := nullif(it ->> 'pickup_point_id', '')::uuid;
    if v_sub is null then
      if v_pick is not null then
        if not exists (select 1 from pickup_points where id = v_pick and store_id = l.store_id and active) then raise exception 'invalid pickup point'; end if;
        v_fee := 0; v_method := 'pickup';
      else
        select min(sdz.fee_paisa) into v_fee from store_delivery_zones sdz join zone_upazilas zu on zu.zone_id = sdz.zone_id where sdz.store_id = l.store_id and zu.upazila_id = p_upazila_id;
        if v_fee is null then raise exception 'this store does not deliver to the selected upazila'; end if;
        v_method := 'store';
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
                                 gross_paisa, supplier_payable_paisa, seller_margin_paisa, commission_paisa, seller_net_paisa)
    values (v_line, v_txn, l.store_id, case when l.stock_mode = 'linked' then h.store_id end, v_rule.id, coalesce(v_rule.rate_bps, 0), coalesce(v_rule.base, 'gross'),
            v_total, v_sup_pay, v_fin.margin_paisa, v_fin.commission_paisa, v_fin.seller_net_paisa);
  end loop;

  for s in select id from sub_orders where order_id = v_order loop
    update sub_orders set subtotal_paisa = (select coalesce(sum(line_total_paisa), 0) from order_lines where sub_order_id = s.id) where id = s.id;
  end loop;
  select coalesce(sum(subtotal_paisa), 0), coalesce(sum(delivery_paisa), 0) into v_grand_sub, v_grand_del from sub_orders where order_id = v_order;
  update orders set subtotal_paisa = v_grand_sub, delivery_paisa = v_grand_del, total_paisa = v_grand_sub + v_grand_del where id = v_order;
  return v_order;
end $$;
revoke all on function place_order_v2(jsonb, text, text, text, smallint, payment_method, text) from public, anon;
grant execute on function place_order_v2(jsonb, text, text, text, smallint, payment_method, text) to authenticated;

-- ───────────────────────── status roll-up ─────────────────────────
create or replace function recompute_statuses(p_sub uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_order uuid; n int; n_cancel int; n_deliv int; v_status order_status;
begin
  select count(*), count(*) filter (where status = 'cancelled'), count(*) filter (where status = 'delivered') into n, n_cancel, n_deliv from order_lines where sub_order_id = p_sub;
  v_status := case
    when n_cancel = n then 'cancelled'::order_status
    when n_deliv > 0 and n_deliv + n_cancel = n then 'delivered'::order_status
    when exists (select 1 from order_lines where sub_order_id = p_sub and status = 'shipped') then 'shipped'::order_status
    when exists (select 1 from order_lines where sub_order_id = p_sub and status = 'ready') then 'ready'::order_status
    else 'placed'::order_status end;
  update sub_orders set status = v_status, subtotal_paisa = (select coalesce(sum(line_total_paisa), 0) from order_lines where sub_order_id = p_sub and status <> 'cancelled') where id = p_sub returning order_id into v_order;

  select count(*), count(*) filter (where status = 'cancelled'), count(*) filter (where status = 'delivered') into n, n_cancel, n_deliv from sub_orders where order_id = v_order;
  update orders set status = case
    when n_cancel = n then 'cancelled'::order_status
    when n_deliv > 0 and n_deliv + n_cancel = n then 'delivered'::order_status
    when exists (select 1 from sub_orders where order_id = v_order and status = 'shipped') then 'shipped'::order_status
    when exists (select 1 from sub_orders where order_id = v_order and status = 'ready') then 'ready'::order_status
    else 'placed'::order_status end where id = v_order;
end $$;
revoke all on function recompute_statuses(uuid) from public, anon, authenticated;

-- ───────────────────────── fulfilment transitions ─────────────────────────
create or replace function set_fulfilment_status(p_f uuid, p_to fulfilment_status, p_internal boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare f fulfilments%rowtype; ln order_lines%rowtype; ok boolean;
begin
  select * into f from fulfilments where id = p_f for update;
  if not found then raise exception 'fulfilment not found'; end if;
  select * into ln from order_lines where id = f.order_line_id;
  if not p_internal and not (is_store_member(f.fulfiller_store_id) or is_admin() or auth.uid() is null) then raise exception 'not allowed'; end if;

  ok := (f.status = 'pending'     and p_to in ('accepted', 'cancelled', 'failed'))
     or (f.status = 'accepted'    and p_to in ('ready', 'cancelled', 'failed'))
     or (f.status = 'ready'       and p_to in ('handed_over', 'cancelled', 'failed'))
     or (f.status = 'handed_over' and p_to in ('delivered', 'failed'));
  if not ok then raise exception 'invalid fulfilment change % -> %', f.status, p_to; end if;

  -- stock effects on the listing that holds the stock
  if p_to = 'handed_over' then perform stock_move(ln.stock_listing_id, -ln.qty, -ln.qty, 'commit', 'order_line', ln.id);
  elsif p_to in ('cancelled', 'failed') then
    if f.status = 'handed_over' then perform stock_move(ln.stock_listing_id, ln.qty, 0, 'return', 'order_line', ln.id);
    else perform stock_move(ln.stock_listing_id, 0, -ln.qty, 'release', 'order_line', ln.id); end if;
  end if;

  update fulfilments set status = p_to where id = p_f;
  update order_lines set status = case p_to when 'pending' then 'placed' when 'accepted' then 'placed' when 'ready' then 'ready'
                                            when 'handed_over' then 'shipped' when 'delivered' then 'delivered' else 'cancelled' end::order_status
   where id = ln.id;
  perform recompute_statuses(ln.sub_order_id);
end $$;
revoke all on function set_fulfilment_status(uuid, fulfilment_status, boolean) from public, anon, authenticated;

create or replace function advance_fulfilment(p_f uuid, p_to fulfilment_status) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if p_to = 'delivered' then raise exception 'delivery is confirmed by the buyer (confirm_delivery)'; end if;
  perform set_fulfilment_status(p_f, p_to, false);
end $$;
revoke all on function advance_fulfilment(uuid, fulfilment_status) from public, anon;
grant execute on function advance_fulfilment(uuid, fulfilment_status) to authenticated;

-- ───────────────────────── cancellation, delivery confirmation, settlement ─────────────────────────
create or replace function cancel_sub_order(p_sub uuid) returns void
language plpgsql security definer set search_path = public as $$
declare so sub_orders%rowtype; f record;
begin
  select * into so from sub_orders where id = p_sub for update;
  if not found then raise exception 'not found'; end if;
  if not (is_store_member(so.store_id) or is_admin() or exists (select 1 from orders o where o.id = so.order_id and o.buyer_id = auth.uid())) then raise exception 'not allowed'; end if;
  if exists (select 1 from fulfilments fu join order_lines ol on ol.id = fu.order_line_id where ol.sub_order_id = p_sub and fu.status in ('handed_over', 'delivered')) then
    raise exception 'cannot cancel after handover';
  end if;
  for f in select fu.id from fulfilments fu join order_lines ol on ol.id = fu.order_line_id where ol.sub_order_id = p_sub and fu.status not in ('cancelled', 'failed') loop
    perform set_fulfilment_status(f.id, 'cancelled', true);
  end loop;
end $$;
revoke all on function cancel_sub_order(uuid) from public, anon;
grant execute on function cancel_sub_order(uuid) to authenticated;

-- Accounting only: records who is owed what for a delivered sub-order. Writes balanced entries; moves no money.
create or replace function settle_sub_order(p_sub uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare so sub_orders%rowtype; v_txn uuid := gen_random_uuid(); r record; v_deb integer; v_cred integer; v_clearing uuid := ledger_account('order_clearing');
begin
  select * into so from sub_orders where id = p_sub for update;
  if not found then raise exception 'not found'; end if;
  if so.status <> 'delivered' then raise exception 'only delivered sub-orders can be settled'; end if;
  if so.settled_at is not null then raise exception 'already settled'; end if;

  for r in select ol.id as line_id, lf.* from line_financials lf join order_lines ol on ol.id = lf.order_line_id where ol.sub_order_id = p_sub and ol.status = 'delivered' loop
    insert into ledger_entries (txn_id, sub_order_id, order_line_id, account_id, debit_paisa, memo) values (v_txn, p_sub, r.line_id, v_clearing, r.gross_paisa, 'customer payment for delivered line');
    if r.seller_net_paisa > 0 then insert into ledger_entries (txn_id, sub_order_id, order_line_id, account_id, credit_paisa, memo) values (v_txn, p_sub, r.line_id, ledger_account('store_payable', r.seller_store_id), r.seller_net_paisa, 'seller net'); end if;
    if r.supplier_payable_paisa > 0 then insert into ledger_entries (txn_id, sub_order_id, order_line_id, account_id, credit_paisa, memo) values (v_txn, p_sub, r.line_id, ledger_account('store_payable', r.supplier_store_id), r.supplier_payable_paisa, 'supplier payable'); end if;
    if r.commission_paisa > 0 then insert into ledger_entries (txn_id, sub_order_id, order_line_id, account_id, credit_paisa, memo) values (v_txn, p_sub, r.line_id, ledger_account('platform_commission'), r.commission_paisa, 'platform commission'); end if;
  end loop;
  if so.delivery_paisa > 0 then
    insert into ledger_entries (txn_id, sub_order_id, account_id, debit_paisa, memo) values (v_txn, p_sub, v_clearing, so.delivery_paisa, 'delivery fee paid by customer');
    insert into ledger_entries (txn_id, sub_order_id, account_id, credit_paisa, memo) values (v_txn, p_sub, ledger_account('store_payable', so.store_id), so.delivery_paisa, 'delivery fee owed to store');
  end if;

  select coalesce(sum(debit_paisa), 0), coalesce(sum(credit_paisa), 0) into v_deb, v_cred from ledger_entries where txn_id = v_txn;
  if v_deb <> v_cred then raise exception 'ledger out of balance (% vs %)', v_deb, v_cred; end if;
  update sub_orders set settled_at = now() where id = p_sub;
  return v_txn;
end $$;
revoke all on function settle_sub_order(uuid) from public, anon, authenticated;

-- Buyer confirms receipt: handed-over lines become delivered, then the sub-order is settled (accounting).
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
end $$;
revoke all on function confirm_delivery(uuid) from public, anon;
grant execute on function confirm_delivery(uuid) to authenticated;

-- ───────────────────────── RLS ─────────────────────────
alter table sub_orders       enable row level security;
alter table order_lines      enable row level security;
alter table fulfilments      enable row level security;
alter table commission_rules enable row level security;
alter table line_financials  enable row level security;
alter table ledger_accounts  enable row level security;
alter table ledger_entries   enable row level security;

create or replace function can_see_sub_order(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from sub_orders so join orders o on o.id = so.order_id
                 where so.id = sid and (o.buyer_id = auth.uid() or is_store_member(so.store_id) or is_admin()
                    or exists (select 1 from order_lines ol join fulfilments fu on fu.order_line_id = ol.id where ol.sub_order_id = so.id and is_store_member(fu.fulfiller_store_id))))
$$;

create policy sub_orders_read   on sub_orders  for select using (can_see_sub_order(id));
create policy order_lines_read  on order_lines for select using (can_see_sub_order(sub_order_id));
create policy fulfilments_read  on fulfilments for select using (is_store_member(fulfiller_store_id) or is_admin() or exists (select 1 from order_lines ol where ol.id = order_line_id and can_see_sub_order(ol.sub_order_id)));
create policy commission_rules_read  on commission_rules for select using (true);
create policy commission_rules_admin on commission_rules for all using (is_admin()) with check (is_admin());
create policy line_financials_read on line_financials for select using (is_store_member(seller_store_id) or (supplier_store_id is not null and is_store_member(supplier_store_id)) or is_admin());
create policy ledger_accounts_read on ledger_accounts for select using ((store_id is not null and is_store_member(store_id)) or is_admin());
create policy ledger_entries_read  on ledger_entries  for select using (exists (select 1 from ledger_accounts a where a.id = account_id and ((a.store_id is not null and is_store_member(a.store_id)) or is_admin())));

-- Commission starts at 0% for every transaction type (pilot). Edit or add rules without code changes.
insert into commission_rules (txn_type, rate_bps, base, label) values
  ('direct',    0, 'gross',  'Pilot promotion: 0%'),
  ('reseller',  0, 'margin', 'Pilot promotion: 0%'),
  ('wholesale', 0, 'gross',  'Pilot promotion: 0%');
