-- PARENT ORDER → STORE SUB-ORDERS → LINES → FULFILMENTS
do $$
declare o uuid; o2 uuid; sub_p1 uuid; sub_r1 uuid; sub_p2 uuid; n int;
begin
  perform t.as_user('buyer1');
  -- one checkout, three stores: P1 supply rice, R1 linked rice + R1 own mango (same store), P2 supply mango
  o := place_order_v3(jsonb_build_array(t.item('l_p1_rice', 2), t.item('l_r1_rice', 3), t.item('l_r1_mango', 1), t.item('l_p2_mango', 1)),
                      'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'));
  perform t.as_service();
  perform t.eq((select count(*) from orders where id = o)::int, 1, 'one parent order');
  perform t.eq((select model_version from orders where id = o)::int, 3, 'v3 order');
  perform t.eq((select count(*) from sub_orders where order_id = o)::int, 3, 'three store sub-orders');
  select id into sub_p1 from sub_orders where order_id = o and store_id = t.id('s_p1');
  select id into sub_r1 from sub_orders where order_id = o and store_id = t.id('s_r1');
  select id into sub_p2 from sub_orders where order_id = o and store_id = t.id('s_p2');
  perform t.eq((select count(*) from order_lines where sub_order_id = sub_r1)::int, 2, 'R1 sub-order carries both of its lines');
  perform t.eq((select count(*) from fulfilments f join order_lines l on l.id = f.order_line_id where l.sub_order_id = sub_r1 and f.fulfiller_store_id = t.id('s_p1'))::int, 1, 'the linked line is fulfilled by the producer');
  perform t.eq((select count(*) from fulfilments f join order_lines l on l.id = f.order_line_id where l.sub_order_id = sub_r1 and f.fulfiller_store_id = t.id('s_r1'))::int, 1, 'the own-stock line is fulfilled by R1');
  perform t.eq((select subtotal_paisa from sub_orders where id = sub_p1), 10000, 'P1 subtotal 2 × ৳50');
  perform t.eq((select subtotal_paisa from sub_orders where id = sub_r1), 3 * 6000 + 10000, 'R1 subtotal = linked 3 × ৳60 + mango ৳100');
  perform t.eq((select subtotal_paisa from sub_orders where id = sub_p2), 8000, 'P2 subtotal');
  perform t.eq((select coalesce(sum(delivery_paisa), 0) from sub_orders where order_id = o)::int, 0, 'stores carry no delivery fee: the platform delivers');
  perform t.eq((select fee_paisa from order_deliveries where order_id = o), 6000, 'one delivery fee for the whole order');
  perform t.eq((select status from order_deliveries where order_id = o)::text, 'pending', 'delivery starts pending');
  perform t.eq((select subtotal_paisa from orders where id = o)::bigint, (select sum(subtotal_paisa) from sub_orders where order_id = o)::bigint, 'order subtotal = sum of sub-order subtotals');
  perform t.eq((select delivery_paisa from orders where id = o), 6000, 'order delivery = the zone fee, once, however many stores');
  perform t.eq((select total_paisa from orders where id = o), (select subtotal_paisa + delivery_paisa from orders where id = o), 'order total');
  perform t.eq((select sum(line_total_paisa) from order_lines l join sub_orders s on s.id = l.sub_order_id where s.order_id = o)::bigint, (select subtotal_paisa from orders where id = o)::bigint, 'lines add up to the order');

  -- roll-up: deliver P2 only → parent is not delivered; then everyone → delivered
  perform t.as_user('prod2');
  perform advance_fulfilment((select f.id from fulfilments f join order_lines l on l.id = f.order_line_id where l.sub_order_id = sub_p2), 'accepted');
  perform advance_fulfilment((select f.id from fulfilments f join order_lines l on l.id = f.order_line_id where l.sub_order_id = sub_p2), 'ready');
  perform advance_fulfilment((select f.id from fulfilments f join order_lines l on l.id = f.order_line_id where l.sub_order_id = sub_p2), 'handed_over');
  perform t.as_service();
  perform t.eq((select status from sub_orders where id = sub_p2)::text, 'shipped', 'sub-order shipped');
  perform t.eq((select status from orders where id = o)::text, 'shipped', 'parent shows the furthest in-flight state');
  perform t.as_user('outsider');
  perform t.fails(format('select confirm_delivery(%L)', sub_p2), 'only the buyer', 'only the buyer confirms delivery');
  perform t.as_user('buyer1');
  perform t.fails(format('select confirm_delivery(%L)', sub_p1), 'not been handed over', 'cannot confirm before handover');
  perform confirm_delivery(sub_p2);
  perform t.as_service();
  perform t.eq((select status from sub_orders where id = sub_p2)::text, 'delivered', 'P2 delivered');
  perform t.ok((select status from orders where id = o)::text <> 'delivered', 'parent not delivered while other stores are pending');

  -- cancelling one store's sub-order releases only that store's stock
  perform t.as_user('buyer1');
  perform cancel_sub_order(sub_p1);
  perform t.as_service();
  perform t.eq((select status from sub_orders where id = sub_p1)::text, 'cancelled', 'P1 sub-order cancelled');
  perform t.eq((select status from sub_orders where id = sub_r1)::text, 'placed', 'other sub-orders unaffected');
  -- finish R1 (producer + reseller each fulfil their own line), then the parent resolves
  perform t.as_user('prod1');
  perform advance_fulfilment((select f.id from fulfilments f join order_lines l on l.id = f.order_line_id where l.sub_order_id = sub_r1 and f.fulfiller_store_id = t.id('s_p1')), 'accepted');
  perform advance_fulfilment((select f.id from fulfilments f join order_lines l on l.id = f.order_line_id where l.sub_order_id = sub_r1 and f.fulfiller_store_id = t.id('s_p1')), 'ready');
  perform advance_fulfilment((select f.id from fulfilments f join order_lines l on l.id = f.order_line_id where l.sub_order_id = sub_r1 and f.fulfiller_store_id = t.id('s_p1')), 'handed_over');
  perform t.as_user('res1');
  perform advance_fulfilment((select f.id from fulfilments f join order_lines l on l.id = f.order_line_id where l.sub_order_id = sub_r1 and f.fulfiller_store_id = t.id('s_r1')), 'accepted');
  perform advance_fulfilment((select f.id from fulfilments f join order_lines l on l.id = f.order_line_id where l.sub_order_id = sub_r1 and f.fulfiller_store_id = t.id('s_r1')), 'ready');
  perform advance_fulfilment((select f.id from fulfilments f join order_lines l on l.id = f.order_line_id where l.sub_order_id = sub_r1 and f.fulfiller_store_id = t.id('s_r1')), 'handed_over');
  perform t.as_user('buyer1');
  perform confirm_delivery(sub_r1);
  perform t.as_service();
  perform t.eq((select status from orders where id = o)::text, 'delivered', 'parent delivered once every sub-order is delivered or cancelled');
  perform t.as_user('buyer1');
  perform t.fails(format('select cancel_sub_order(%L)', sub_r1), 'handover', 'cannot cancel after handover');

  -- pickup: no delivery fee; must be consistent within a store; must belong to the store
  perform t.as_user('buyer1');
  o2 := place_order_v3(jsonb_build_array(t.item('l_r1_mango', 1, 'pick_r1'), t.item('l_r1_rice', 1, 'pick_r1')), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'));
  perform t.as_service();
  perform t.eq((select delivery_paisa from sub_orders where order_id = o2), 0, 'pickup has no delivery fee');
  perform t.eq((select delivery_method from sub_orders where order_id = o2)::text, 'pickup', 'pickup method');
  perform t.eq((select count(*) from order_deliveries where order_id = o2)::int, 0, 'pickup-only order has no delivery record');
  perform t.eq((select delivery_paisa from orders where id = o2), 0, 'pickup-only order has no delivery fee');
  perform t.as_user('buyer1');
  perform t.fails($q$select place_order_v3(jsonb_build_array(t.item('l_r1_mango', 1, 'pick_r1'), t.item('l_r1_rice', 1)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'))$q$, 'same delivery choice', 'mixed delivery choices within one store rejected');
  perform t.fails($q$select place_order_v3(jsonb_build_array(t.item('l_p2_mango', 1, 'pick_r1')), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'))$q$, 'invalid pickup point', 'pickup point of another store rejected');

  -- delivery coverage, validation, access
  perform t.fails($q$select place_order_v3(jsonb_build_array(t.item('l_p1_rice', 1)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u3'))$q$, 'not available to the selected upazila', 'an upazila outside every fee zone is rejected');
  o2 := place_order_v3(jsonb_build_array(t.item('l_r1_mango', 1, 'pick_r1')), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u3'));
  perform t.ok(o2 is not null, 'pickup works for an upazila the store does not deliver to');
  perform t.fails($q$select place_order_v3(jsonb_build_array(t.item('l_p1_rice', 1)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'), 'bkash')$q$, 'cash on delivery', 'online payment methods are not available');
  perform t.fails($q$select place_order_v3(jsonb_build_array(t.item('l_p1_rice', 0)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'))$q$, 'invalid quantity', 'zero quantity rejected');
  perform t.fails($q$select place_order_v3('[]'::jsonb, 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'))$q$, 'empty', 'empty cart rejected');
  perform t.fails($q$select place_order_v3(jsonb_build_array(t.item('l_p1_rice', 1)), 'রহিম উদ্দিন', '12345', '১২ মিরপুর রোড', t.num('u1'))$q$, 'invalid shipping', 'bad phone rejected');
  perform t.as_anon();
  perform t.fails($q$select place_order_v3(jsonb_build_array(t.item('l_p1_rice', 1)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'))$q$, 'permission denied', 'anonymous users cannot order');

  -- minimum order quantity (wholesale tier needs 50)
  perform t.as_service();
  update listings set moq = 5 where id = t.id('l_p2_mango');
  perform t.as_user('buyer1');
  perform t.fails($q$select place_order_v3(jsonb_build_array(t.item('l_p2_mango', 2)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'))$q$, 'minimum order quantity', 'MOQ enforced');
  perform t.as_service();
  update listings set moq = 1 where id = t.id('l_p2_mango');

  -- who can see what
  perform t.as_user('buyer2');
  perform t.eq((select count(*) from orders where buyer_id = t.id('buyer1'))::int, 0, 'another buyer sees none of buyer1''s orders');
  perform t.as_user('outsider');
  perform t.eq((select count(*) from sub_orders)::int, 0, 'outsider sees no sub-orders');
  perform t.as_user('prod1');
  perform t.ok((select count(*) from sub_orders where store_id = t.id('s_r1')) > 0, 'a producer sees reseller sub-orders containing lines it fulfils');
  perform t.as_user('prod2');
  perform t.eq((select count(*) from sub_orders where store_id = t.id('s_p1'))::int, 0, 'an unrelated producer cannot see P1 sub-orders');
  perform t.as_service();

  -- platform delivery rules
  perform t.as_service();
  update stores set delivery_arrangement = 'seller_managed' where id = t.id('s_p1');
  perform t.as_user('buyer1');
  perform t.fails($q$select place_order_v3(jsonb_build_array(t.item('l_p1_rice', 1)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'))$q$, 'not available yet', 'seller-managed delivery is not enabled yet');
  perform t.as_service();
  update stores set delivery_arrangement = 'platform_managed' where id = t.id('s_p1');
  update service_areas set active = false;
  perform t.as_user('buyer1');
  perform t.fails($q$select place_order_v3(jsonb_build_array(t.item('l_p1_rice', 1)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'))$q$, 'do not deliver to this area', 'orders outside the service area are rejected');
  perform t.as_service();
  update service_areas set active = true;
  update delivery_zone_fees set free_over_paisa = 1000;
  perform t.as_user('buyer1');
  o2 := place_order_v3(jsonb_build_array(t.item('l_p1_rice', 1)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'));
  perform t.as_service();
  perform t.eq((select delivery_paisa from orders where id = o2), 0, 'free delivery above the threshold');
  update delivery_zone_fees set free_over_paisa = 500000;
end $$;
