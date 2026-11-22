-- FOUNDER DELIVERY WORKFLOW, SELLER PRIVACY, UNIT COST
do $$
declare o uuid; so uuid; f record; sp int; lst uuid := t.id('l_r1_mango');
begin
  -- cost: moving average on receive
  perform t.as_user('res1');
  perform stock_receive(lst, 10, 'batch A', 4000);
  perform stock_receive(lst, 10, 'batch B', 6000);
  perform t.as_service();
  perform t.ok((select avg_cost_paisa from listings where id = lst) between 4300 and 4500, 'average cost blends the batches (existing stock takes the first recorded cost)');
  perform t.as_user('res1');
  perform t.fails(format('update listings set avg_cost_paisa = 1 where id = %L', lst), 'stock', 'cost cannot be edited directly');

  -- order, delivery workflow, privacy
  perform t.as_user('buyer1');
  o := place_order_v3(jsonb_build_array(t.item('l_r1_mango', 2)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'));
  perform t.as_service();
  select id into so from sub_orders where order_id = o;
  perform t.ok((select cost_paisa from line_financials lf join order_lines ol on ol.id = lf.order_line_id where ol.sub_order_id = so) between 8600 and 9000, 'cost is snapshotted on the line');

  perform t.as_user('res1');
  perform t.eq((select count(*) from orders where id = o)::int, 0, 'a seller cannot read the order row (phone, address)');
  perform t.eq((select count(*) from seller_orders where order_id = o)::int, 1, 'a seller sees the order in the safe view');
  perform t.eq((select customer_first_name from seller_orders where order_id = o), 'রহিম', 'the safe view shows only the first name');
  perform t.as_user('buyer1');
  perform t.eq((select count(*) from orders where id = o)::int, 1, 'the buyer reads their order');
  perform t.fails(format('select advance_order_delivery(%L, %L)', o, 'preparing'), 'admins only', 'a buyer cannot run delivery');
  perform t.as_user('res1');
  perform t.fails(format('select advance_order_delivery(%L, %L)', o, 'preparing'), 'admins only', 'a seller cannot run delivery');

  perform t.as_user('admin');
  perform t.fails(format('select advance_order_delivery(%L, %L)', o, 'out_for_delivery'), 'invalid', 'steps cannot be skipped');
  perform advance_order_delivery(o, 'preparing');
  perform t.fails(format('select advance_order_delivery(%L, %L)', o, 'ready_for_delivery'), 'not ready', 'cannot be ready before the items are');
  for f in select fu.id from fulfilments fu join order_lines ol on ol.id = fu.order_line_id where ol.sub_order_id = so loop
    perform advance_fulfilment(f.id, 'accepted'); perform advance_fulfilment(f.id, 'ready');
  end loop;
  perform advance_order_delivery(o, 'ready_for_delivery');
  perform advance_order_delivery(o, 'out_for_delivery');
  perform t.eq((select fu.status from fulfilments fu join order_lines ol on ol.id = fu.order_line_id where ol.sub_order_id = so)::text, 'handed_over', 'out for delivery hands the goods over');
  perform t.eq((select count(*) from ops_delivery_queue where order_id = o)::int, 1, 'ops queue shows the order with contact details');
  perform advance_order_delivery(o, 'delivered');
  perform t.eq((select status from order_deliveries where order_id = o)::text, 'delivered', 'delivery is delivered');
  perform t.eq((select status from orders where id = o)::text, 'delivered', 'the order is delivered');
  perform t.ok((select settled_at from order_deliveries where order_id = o) is not null, 'delivery fee revenue is posted');
  perform t.eq((select count(*) from order_delivery_events where order_id = o)::int, 5, 'every step is logged');

  -- profit and loss
  perform t.as_user('res1');
  perform t.ok((select profit_paisa from store_profit_loss where store_id = t.id('s_r1')) is not null, 'profit is known for lines with a cost');
  perform t.as_user('res2');
  perform t.eq((select count(*) from store_profit_loss where store_id = t.id('s_r1'))::int, 0, 'another store cannot read the profit and loss');

  -- failed delivery returns the goods
  perform t.as_user('buyer1');
  o := place_order_v3(jsonb_build_array(t.item('l_r1_mango', 1)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'));
  perform t.as_service();
  select id into so from sub_orders where order_id = o;
  sp := (select on_hand_qty from listings where id = lst)::int;
  perform t.as_user('admin');
  perform advance_order_delivery(o, 'preparing');
  for f in select fu.id from fulfilments fu join order_lines ol on ol.id = fu.order_line_id where ol.sub_order_id = so loop
    perform advance_fulfilment(f.id, 'accepted'); perform advance_fulfilment(f.id, 'ready');
  end loop;
  perform advance_order_delivery(o, 'ready_for_delivery'); perform advance_order_delivery(o, 'out_for_delivery'); perform advance_order_delivery(o, 'failed');
  perform t.as_service();
  perform t.eq((select on_hand_qty from listings where id = lst)::int, sp, 'failed delivery returns the stock');
  perform t.eq((select status from order_deliveries where order_id = o)::text, 'failed', 'delivery marked failed');
  perform t.eq((select settled_at from order_deliveries where order_id = o), null::timestamptz, 'no revenue for a failed delivery');
end $$;
