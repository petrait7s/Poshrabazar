-- SELLER-SPECIFIC FINANCIALS: arithmetic, rule selection, immutable snapshots, and a balanced per-store ledger.
do $$
declare
  o uuid; o2 uuid; sub_p1 uuid; sub_r1 uuid; sub_r2 uuid; f record; tx uuid; n int;
  subs uuid[]; a_line uuid; b_line uuid; c_line uuid; d_line uuid; clearing uuid; plat uuid; acc_p1 uuid; acc_r1 uuid; acc_r2 uuid;
begin
  perform t.as_service();
  perform stock_move(t.id('l_p1_rice'), 500, 0, 'receive', null, null, 'top-up for financial tests');

  -- 1. pure arithmetic: (gross, supplier payable, bps, base) → (margin, commission, seller net)
  perform t.eq((select commission_paisa from compute_line_financials(10000, 0, 0, 'gross')), 0, '0% pilot charges nothing');
  perform t.eq((select seller_net_paisa from compute_line_financials(10000, 0, 0, 'gross')), 10000, '0%: seller keeps everything');
  perform t.eq((select commission_paisa from compute_line_financials(10000, 0, 200, 'gross')), 200, '2% of 10000');
  perform t.eq((select commission_paisa from compute_line_financials(18000, 15000, 500, 'margin')), 150, '5% of the 3000 margin');
  perform t.eq((select seller_net_paisa from compute_line_financials(18000, 15000, 500, 'margin')), 2850, 'net = margin − commission');
  perform t.eq((select commission_paisa from compute_line_financials(18000, 15000, 500, 'gross')), 900, '5% of gross');
  perform t.eq((select commission_paisa from compute_line_financials(18000, 17900, 5000, 'gross')), 100, 'commission is capped at the margin');
  perform t.eq((select seller_net_paisa from compute_line_financials(18000, 17900, 5000, 'gross')), 0, 'a seller never owes money');
  perform t.eq((select commission_paisa from compute_line_financials(3333, 0, 150, 'gross')), 50, 'rounding: 49.995 → 50');
  perform t.fails($q$select * from compute_line_financials(100, 200, 0, 'gross')$q$, 'invalid amounts', 'supplier payable above gross is invalid');
  -- invariant over a grid of inputs: gross = supplier + seller net + commission
  perform t.eq((select count(*) from (values (10000,0,200,'gross'),(18000,15000,500,'margin'),(260000,225000,100,'gross'),(18000,17900,5000,'gross'),(7,3,9999,'margin'),(1,0,10000,'gross')) as x(g, s, b, m),
          lateral compute_line_financials(x.g, x.s, x.b, x.m::commission_base) c
         where x.g <> x.s + c.seller_net_paisa + c.commission_paisa)::int, 0, 'gross = supplier + seller net + commission for every case');

  -- 2. rule selection
  perform t.eq((select rate_bps from commission_rule_for('direct', t.num('cat_rice'))), 0, 'the pilot rule is 0%');
  insert into commission_rules (txn_type, category_id, rate_bps, label, active_from) values ('direct', t.num('cat_rice'), 300, 'tmp-rice', now() - interval '1 hour');
  perform t.eq((select rate_bps from commission_rule_for('direct', t.num('cat_rice'))), 300, 'a category-specific rule wins');
  insert into commission_rules (txn_type, rate_bps, label, active_from, active_to) values ('direct', 900, 'tmp-expired', now() - interval '2 days', now() - interval '1 day');
  insert into commission_rules (txn_type, rate_bps, label, active_from) values ('direct', 900, 'tmp-future', now() + interval '1 day');
  perform t.eq((select rate_bps from commission_rule_for('direct', t.num('cat_rice'))), 300, 'expired and future rules are ignored');
  perform t.eq((select rate_bps from commission_rule_for('direct', null)), 0, 'without a category only the general rule applies');
  delete from commission_rules where label like 'tmp-%';
  perform t.fails($q$insert into commission_rules (txn_type, rate_bps) values ('direct', 10001)$q$, 'check', 'a rate above 100% is rejected');

  -- 3. the pilot (0%) really charges nothing on a real order
  perform t.as_user('buyer1');
  o := place_order_v3(jsonb_build_array(t.item('l_p1_rice', 1)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'));
  perform t.as_service();
  perform t.eq((select lf.commission_paisa from line_financials lf join order_lines ol on ol.id = lf.order_line_id join sub_orders s on s.id = ol.sub_order_id where s.order_id = o), 0, 'pilot order has zero commission');
  perform t.as_user('buyer1'); perform cancel_sub_order((select id from sub_orders where order_id = o)); perform t.as_service();

  -- 4. one checkout covering all three transaction types, with different rules
  insert into commission_rules (txn_type, rate_bps, base, label, active_from) values
    ('direct', 200, 'gross', 'test direct 2% of gross', now()),
    ('reseller', 500, 'margin', 'test reseller 5% of margin', now()),
    ('wholesale', 100, 'gross', 'test wholesale 1% of gross', now());
  perform t.as_user('buyer1');
  o := place_order_v3(jsonb_build_array(t.item('l_p1_rice', 2), t.item('l_r1_rice', 3), t.item('l_r1_rice', 50), t.item('l_r1_mango', 1)),
                      'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'));
  perform t.as_service();
  select ol.id into a_line from order_lines ol join sub_orders s on s.id = ol.sub_order_id where s.order_id = o and ol.listing_id = t.id('l_p1_rice');
  select ol.id into b_line from order_lines ol join sub_orders s on s.id = ol.sub_order_id where s.order_id = o and ol.listing_id = t.id('l_r1_rice') and ol.qty = 3;
  select ol.id into c_line from order_lines ol join sub_orders s on s.id = ol.sub_order_id where s.order_id = o and ol.listing_id = t.id('l_r1_rice') and ol.qty = 50;
  select ol.id into d_line from order_lines ol join sub_orders s on s.id = ol.sub_order_id where s.order_id = o and ol.listing_id = t.id('l_r1_mango');
  select id into sub_p1 from sub_orders where order_id = o and store_id = t.id('s_p1');
  select id into sub_r1 from sub_orders where order_id = o and store_id = t.id('s_r1');

  perform t.eq((select count(*) from line_financials where order_line_id in (a_line, b_line, c_line, d_line))::int, 4, 'every line has a financial snapshot');
  -- A: direct
  select * into f from line_financials where order_line_id = a_line;
  perform t.eq(f.txn_type::text, 'direct', 'A is a direct sale'); perform t.eq(f.gross_paisa, 10000, 'A gross'); perform t.eq(f.commission_paisa, 200, 'A commission 2% of gross');
  perform t.eq(f.seller_net_paisa, 9800, 'A seller net'); perform t.eq(f.supplier_payable_paisa, 0, 'A has no supplier'); perform t.eq(f.seller_store_id, t.id('s_p1'), 'A seller is the producer');
  -- B: reseller, linked
  select * into f from line_financials where order_line_id = b_line;
  perform t.eq(f.txn_type::text, 'reseller', 'B is a reseller sale'); perform t.eq(f.gross_paisa, 18000, 'B gross'); perform t.eq(f.supplier_payable_paisa, 15000, 'B producer is owed the supply price');
  perform t.eq(f.seller_margin_paisa, 3000, 'B reseller margin'); perform t.eq(f.commission_paisa, 150, 'B commission 5% of margin'); perform t.eq(f.seller_net_paisa, 2850, 'B reseller net');
  perform t.eq(f.seller_store_id, t.id('s_r1'), 'B seller is the reseller'); perform t.eq(f.supplier_store_id, t.id('s_p1'), 'B supplier is the producer');
  -- C: wholesale, linked
  select * into f from line_financials where order_line_id = c_line;
  perform t.eq(f.txn_type::text, 'wholesale', 'C is wholesale'); perform t.eq(f.gross_paisa, 260000, 'C gross'); perform t.eq(f.supplier_payable_paisa, 225000, 'C supplier at the wholesale tier');
  perform t.eq(f.commission_paisa, 2600, 'C commission 1% of gross'); perform t.eq(f.seller_net_paisa, 32400, 'C reseller net');
  -- D: reseller, own stock
  select * into f from line_financials where order_line_id = d_line;
  perform t.eq(f.txn_type::text, 'reseller', 'D is a reseller sale'); perform t.eq(f.supplier_payable_paisa, 0, 'D has no supplier'); perform t.eq(f.commission_paisa, 500, 'D commission 5% of margin (= gross)'); perform t.eq(f.seller_net_paisa, 9500, 'D net');
  perform t.ok((select count(*) from line_financials lf where lf.commission_rule_id is not null and order_line_id in (a_line, b_line, c_line, d_line)) = 4, 'every snapshot records the rule that produced it');

  -- 5. snapshots are immutable facts: changing the rules later does not rewrite history
  update commission_rules set rate_bps = 999 where label like 'test %';
  perform t.eq((select commission_paisa from line_financials where order_line_id = c_line), 2600, 'rule changes do not alter existing snapshots');

  -- 6. settlement only after delivery; accounting only
  perform t.fails(format('select settle_sub_order(%L)', sub_r1), 'only delivered', 'cannot settle before delivery');
  for f in select fu.id from fulfilments fu join order_lines ol on ol.id = fu.order_line_id join sub_orders s on s.id = ol.sub_order_id where s.order_id = o loop
    perform set_fulfilment_status(f.id, 'accepted', true); perform set_fulfilment_status(f.id, 'ready', true); perform set_fulfilment_status(f.id, 'handed_over', true);
  end loop;
  perform t.as_user('buyer1'); perform confirm_delivery(sub_p1); perform confirm_delivery(sub_r1); perform t.as_service();
  perform t.ok((select settled_at from sub_orders where id = sub_p1) is not null and (select settled_at from sub_orders where id = sub_r1) is not null, 'both sub-orders are settled');
  perform t.fails(format('select settle_sub_order(%L)', sub_r1), 'already settled', 'cannot settle twice');

  -- 7. the ledger balances, per transaction and per store
  perform t.eq((select count(*) from (select txn_id from ledger_entries group by txn_id having sum(debit_paisa) <> sum(credit_paisa)) x)::int, 0, 'every settlement transaction balances');
  clearing := ledger_account('order_clearing'); plat := ledger_account('platform_commission');
  acc_p1 := ledger_account('store_payable', t.id('s_p1')); acc_r1 := ledger_account('store_payable', t.id('s_r1'));
  subs := array[sub_p1, sub_r1];
  perform t.eq((select coalesce(sum(debit_paisa), 0) from ledger_entries where account_id = clearing and sub_order_id = any(subs))::bigint, 298000::bigint, 'clearing debits for sub-orders = lines only (delivery is order-level)');
  perform t.eq((select coalesce(sum(credit_paisa), 0) from ledger_entries where account_id = plat and sub_order_id = any(subs))::bigint, 3450::bigint, 'platform commission = 200 + 150 + 2600 + 500');
  perform t.eq((select coalesce(sum(credit_paisa), 0) from ledger_entries where account_id = acc_p1 and sub_order_id = any(subs))::bigint, 249800::bigint, 'producer payable = direct net 9800 + supplier 15000 + 225000');
  perform t.eq((select coalesce(sum(credit_paisa), 0) from ledger_entries where account_id = acc_r1 and sub_order_id = any(subs))::bigint, 44750::bigint, 'reseller payable = nets 2850 + 32400 + 9500');
  perform t.eq((select sum(credit_paisa) from ledger_entries)::bigint, (select sum(debit_paisa) from ledger_entries)::bigint, 'total credits = total debits');

  -- 8. another reseller's sale is kept on that store's own account
  perform t.as_user('buyer2');
  o2 := place_order_v3(jsonb_build_array(t.item('l_r2_rice', 2)), 'করিম', '01722222222', '১২ মিরপুর রোড', t.num('u1'));
  perform t.as_service();
  select id into sub_r2 from sub_orders where order_id = o2;
  for f in select fu.id from fulfilments fu join order_lines ol on ol.id = fu.order_line_id where ol.sub_order_id = sub_r2 loop
    perform set_fulfilment_status(f.id, 'accepted', true); perform set_fulfilment_status(f.id, 'ready', true); perform set_fulfilment_status(f.id, 'handed_over', true);
  end loop;
  perform t.as_user('buyer2'); perform confirm_delivery(sub_r2); perform t.as_service();
  acc_r2 := ledger_account('store_payable', t.id('s_r2'));
  perform t.eq((select coalesce(sum(credit_paisa), 0) from ledger_entries where account_id = ledger_account('delivery_revenue'))::bigint, 18000::bigint, 'delivery fees (3 delivered orders x 6000) are platform revenue');
  -- R2: gross 11000, supplier 10000, margin 1000, 5% (999 test rule) is capped by margin... recompute with the live rule for this order
  perform t.eq((select seller_net_paisa + commission_paisa from line_financials lf join order_lines ol on ol.id = lf.order_line_id where ol.sub_order_id = sub_r2), 1000, 'R2 margin = net + commission');
  perform t.eq((select coalesce(sum(credit_paisa), 0) from ledger_entries where account_id = acc_r2 and sub_order_id = sub_r2)::bigint,
       (select seller_net_paisa::bigint from line_financials lf join order_lines ol on ol.id = lf.order_line_id where ol.sub_order_id = sub_r2), 'R2 payable = its own net (delivery fees are never a seller''s revenue)');
  perform t.eq((select coalesce(sum(credit_paisa), 0) from ledger_entries where account_id = acc_r1 and sub_order_id = any(subs || sub_r2))::bigint, 44750::bigint, 'R1 account is untouched by R2''s sale');
  perform t.eq((select coalesce(sum(credit_paisa), 0) from ledger_entries where account_id = acc_p1 and sub_order_id = any(subs || sub_r2))::bigint, 249800::bigint + 10000, 'the shared producer is credited its supply price for R2''s sale');

  -- 9. the ledger cannot be edited, and users cannot write to it
  perform t.fails($q$update ledger_entries set credit_paisa = credit_paisa + 1 where id = (select min(id) from ledger_entries where credit_paisa > 0)$q$, 'append-only', 'ledger entries cannot be edited');
  perform t.fails($q$delete from ledger_entries$q$, 'append-only', 'ledger entries cannot be deleted');
  perform t.as_user('res1');
  perform t.fails(format('insert into ledger_entries (txn_id, account_id, credit_paisa) values (gen_random_uuid(), %L, 1)', acc_r1), 'row-level security', 'users cannot write ledger entries');
  perform t.ok((select count(*) from ledger_entries) > 0, 'a store member can read its own ledger');
  perform t.eq((select count(*) from ledger_entries e where e.account_id = acc_p1)::int, 0, 'a store cannot read another store''s ledger');
  perform t.as_user('outsider');
  perform t.eq((select count(*) from ledger_entries)::int, 0, 'outsiders see no ledger');
  perform t.as_service();
  -- audit trail: a rule that produced a snapshot can never be deleted (retire it with active_to instead)
  perform t.fails($q$delete from commission_rules where label like 'test %'$q$, 'foreign key', 'rules referenced by snapshots cannot be deleted');
end $$;
