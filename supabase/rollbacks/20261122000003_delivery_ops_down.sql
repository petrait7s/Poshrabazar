-- Rollback for 20261122000003_delivery_ops.sql. Fails if delivery_revenue ledger rows exist (append-only accounting is never silently deleted).
drop view if exists seller_orders, ops_delivery_queue, store_profit_loss;
drop policy orders_read on orders;
create policy orders_read on orders for select using (buyer_id = auth.uid() or is_admin() or is_order_seller(id));

drop function if exists advance_order_delivery(uuid, delivery_status, text), finish_order_delivery(uuid);
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

drop function place_order_v3(jsonb, text, text, text, smallint, payment_method, text);
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

drop function stock_receive(uuid, numeric, text, integer);
drop function stock_move(uuid, numeric, numeric, stock_reason, text, uuid, text, integer);
create or replace function stock_move(p_listing uuid, p_on_hand numeric, p_reserved numeric, p_reason stock_reason, p_ref_type text default null, p_ref_id uuid default null, p_note text default null)
returns void language sql security definer set search_path = public as $$
  insert into stock_movements (listing_id, on_hand_delta, reserved_delta, reason, ref_type, ref_id, note) values (p_listing, p_on_hand, p_reserved, p_reason, p_ref_type, p_ref_id, p_note)
$$;
revoke all on function stock_move(uuid, numeric, numeric, stock_reason, text, uuid, text) from public, anon, authenticated;
create or replace function stock_receive(p_listing uuid, p_qty numeric, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  select store_id into sid from listings where id = p_listing;
  if sid is null or not (is_store_member(sid) or is_admin()) then raise exception 'not allowed'; end if;
  if p_qty <= 0 then raise exception 'quantity must be positive'; end if;
  perform stock_move(p_listing, p_qty, 0, 'receive', null, null, p_note);
end $$;
grant execute on function stock_receive(uuid, numeric, text) to authenticated;
create or replace function stock_movements_apply() returns trigger
language plpgsql security definer set search_path = public as $$
declare l listings%rowtype;
begin
  select * into l from listings where id = new.listing_id for update;
  if not found then raise exception 'listing not found'; end if;
  if l.stock_mode <> 'own' then raise exception 'linked listings hold no stock; adjust the supply listing'; end if;
  if l.on_hand_qty + new.on_hand_delta < 0 then raise exception 'stock cannot go negative'; end if;
  if l.reserved_qty + new.reserved_delta < 0 then raise exception 'reservation cannot go negative'; end if;
  if l.reserved_qty + new.reserved_delta > l.on_hand_qty + new.on_hand_delta then raise exception 'not enough available stock'; end if;
  perform set_config('pivot.stock_writer', 'on', true);
  update listings set on_hand_qty = on_hand_qty + new.on_hand_delta, reserved_qty = reserved_qty + new.reserved_delta where id = new.listing_id;
  perform set_config('pivot.stock_writer', 'off', true);
  new.created_by := coalesce(new.created_by, auth.uid());
  return new;
end $$;

create or replace function guard_listing_stock_columns() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if (new.on_hand_qty <> 0 or new.reserved_qty <> 0) and coalesce(current_setting('pivot.stock_writer', true), 'off') <> 'on' then
      raise exception 'create the listing with zero stock and receive stock through stock_receive()';
    end if;
  elsif (new.on_hand_qty <> old.on_hand_qty or new.reserved_qty <> old.reserved_qty) and coalesce(current_setting('pivot.stock_writer', true), 'off') <> 'on' then
    raise exception 'stock can only change through stock_movements';
  end if;
  return new;
end $$;

alter table line_financials drop column cost_paisa;
alter table listings drop column avg_cost_paisa;
alter table stock_movements drop column unit_cost_paisa;
drop table order_delivery_events, order_deliveries, delivery_zone_fees cascade;
drop type delivery_status;

-- remove the 'delivery_revenue' enum value: swap the type
drop function ledger_account(ledger_account_kind, uuid);
alter type ledger_account_kind rename to ledger_account_kind_old;
create type ledger_account_kind as enum ('store_payable', 'platform_commission', 'order_clearing');
alter table ledger_accounts drop constraint ledger_accounts_check;
alter table ledger_accounts alter column kind type ledger_account_kind using kind::text::ledger_account_kind;
alter table ledger_accounts add check ((kind = 'store_payable') = (store_id is not null));
drop type ledger_account_kind_old;
create or replace function ledger_account(p_kind ledger_account_kind, p_store uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  select id into v from ledger_accounts where kind = p_kind and store_id is not distinct from p_store;
  if v is null then insert into ledger_accounts (kind, store_id) values (p_kind, p_store) returning id into v; end if;
  return v;
end $$;
revoke all on function ledger_account(ledger_account_kind, uuid) from public, anon, authenticated;
