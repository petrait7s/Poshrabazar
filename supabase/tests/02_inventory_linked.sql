-- LINKED inventory: the producer holds the stock; resellers sell it at their own price.
do $$
declare o uuid; ln uuid; f uuid; v numeric;
begin
  perform t.as_service();
  perform t.eq((select on_hand_qty from listings where id = t.id('l_r1_rice')), 0::numeric, 'a linked listing holds no stock itself');
  perform t.eq(listing_available(t.id('l_r1_rice')), 100::numeric, 'availability of a linked listing = the producer''s available stock');
  perform t.eq(listing_stock_holder(t.id('l_r1_rice')), t.id('l_p1_rice'), 'stock holder is the producer listing');

  -- R1 sells 10 kg: producer stock is reserved, the sub-order belongs to the reseller
  perform t.as_user('buyer1');
  o := place_order_v3(jsonb_build_array(t.item('l_r1_rice', 10)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'));
  perform t.as_service();
  select ol.id into ln from order_lines ol join sub_orders so on so.id = ol.sub_order_id where so.order_id = o;
  perform t.eq((select reserved_qty from listings where id = t.id('l_p1_rice')), 10::numeric, 'producer stock reserved');
  perform t.eq((select reserved_qty from listings where id = t.id('l_r1_rice')), 0::numeric, 'reseller listing reserves nothing');
  perform t.eq((select stock_listing_id from order_lines where id = ln), t.id('l_p1_rice'), 'line reserves the producer listing');
  perform t.eq((select store_id from sub_orders where order_id = o), t.id('s_r1'), 'sub-order belongs to the reseller store');
  perform t.eq((select fulfiller_store_id from fulfilments where order_line_id = ln), t.id('s_p1'), 'producer fulfils');
  perform t.eq((select method from fulfilments where order_line_id = ln)::text, 'producer', 'fulfilment method is producer');
  perform t.eq((select supply_unit_price_paisa from order_lines where id = ln), 5000, 'supply price captured');
  perform t.eq((select unit_price_paisa from order_lines where id = ln), 6000, 'reseller price captured');
  select id into f from fulfilments where order_line_id = ln;

  -- responsibilities: only the producer moves the fulfilment; the reseller cannot touch stock
  perform t.as_user('res1');
  perform t.fails(format('select advance_fulfilment(%L, %L)', f, 'accepted'), 'not allowed', 'reseller cannot advance a producer-fulfilled line');
  perform t.fails($q$select stock_receive(t.id('l_r1_rice'), 5)$q$, 'hold no stock', 'reseller cannot add stock to a linked listing');
  perform t.as_user('prod1');
  perform advance_fulfilment(f, 'accepted'); perform advance_fulfilment(f, 'ready'); perform advance_fulfilment(f, 'handed_over');
  perform t.as_service();
  perform t.eq((select on_hand_qty from listings where id = t.id('l_p1_rice')), 90::numeric, 'handover commits producer stock');
  perform t.eq((select reserved_qty from listings where id = t.id('l_p1_rice')), 0::numeric, 'reservation cleared');

  -- two resellers draw on the SAME producer stock: no overselling across stores
  perform t.as_user('buyer2');
  perform t.fails($q$select place_order_v3(jsonb_build_array(t.item('l_r2_rice', 91)), 'করিম', '01722222222', '১২ মিরপুর রোড', t.num('u1'))$q$, 'not enough stock', 'cannot order more than the producer has');
  o := place_order_v3(jsonb_build_array(t.item('l_r2_rice', 90)), 'করিম', '01722222222', '১২ মিরপুর রোড', t.num('u1'));
  perform t.as_service();
  perform t.eq(listing_available(t.id('l_r1_rice')), 0::numeric, 'R1 sees the stock gone because R2 reserved it');
  perform t.as_user('buyer1');
  perform t.fails($q$select place_order_v3(jsonb_build_array(t.item('l_r1_rice', 1)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'))$q$, 'not enough stock', 'R1 cannot oversell what R2 reserved');
  perform t.as_service();
  -- release on cancel makes it available to both again
  perform t.as_user('buyer2');
  perform cancel_sub_order((select id from sub_orders where order_id = o));
  perform t.as_service();
  perform t.eq(listing_available(t.id('l_r1_rice')), 90::numeric, 'cancelled reservation returns to the shared pool');

  -- price floor: a reseller cannot price below the supplier
  perform t.as_user('res2');
  perform t.fails($q$insert into price_tiers (listing_id, min_qty, unit_price_paisa) values (t.id('l_r2_rice'), 5, 4000)$q$, 'below the supply price', 'tier below supply price rejected');
  perform t.as_service();
  update price_tiers set unit_price_paisa = 5800 where listing_id = t.id('l_p1_rice') and min_qty = 1;      -- supplier raises its price after R2 listed
  perform t.as_user('buyer2');
  perform t.fails($q$select place_order_v3(jsonb_build_array(t.item('l_r2_rice', 1)), 'করিম', '01722222222', '১২ মিরপুর রোড', t.num('u1'))$q$, 'below the supply price', 'order rejected when the reseller price fell below the new supply price');
  perform t.as_service();
  update price_tiers set unit_price_paisa = 5000 where listing_id = t.id('l_p1_rice') and min_qty = 1;

  -- structural link rules
  perform t.as_service();
  perform t.fails($q$insert into listings (store_id, product_id, kind, stock_mode, source_listing_id) select t.id('s_r2'), product_id, 'store_offer', 'linked', t.id('l_r1_mango') from listings where id = t.id('l_r1_mango')$q$, 'supply listing', 'cannot link to a reseller offer');
  perform t.fails($q$insert into listings (store_id, product_id, kind, stock_mode, source_listing_id) select t.id('s_p1'), product_id, 'store_offer', 'linked', t.id('l_p1_rice') from listings where id = t.id('l_p1_rice')$q$, 'own supply', 'cannot link to your own supply');
  perform t.fails($q$insert into listings (store_id, product_id, kind, stock_mode, source_listing_id) select t.id('s_r2'), id, 'store_offer', 'linked', t.id('l_p1_rice') from products where slug = 'mango'$q$, 'same product', 'linked offer must match product');
  perform t.fails($q$insert into listings (store_id, product_id, kind, stock_mode) select t.id('s_r2'), product_id, 'store_offer', 'linked' from listings where id = t.id('l_p1_rice')$q$, 'check', 'linked without a source is invalid');
end $$;
