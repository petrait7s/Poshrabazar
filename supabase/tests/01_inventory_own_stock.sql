-- OWN-STOCK inventory: reservations, commits, releases, returns, and the stock-ledger invariants.
do $$
declare o uuid; f uuid; ln uuid;
begin
  perform t.as_service();
  perform t.eq(listing_available(t.id('l_r1_mango')), 20::numeric, 'own listing starts with 20 available');

  -- order 5: reserved, not yet removed from on-hand
  perform t.as_user('buyer1');
  o := place_order_v2(jsonb_build_array(t.item('l_r1_mango', 5)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'));
  perform t.as_service();
  perform t.eq((select on_hand_qty from listings where id = t.id('l_r1_mango')), 20::numeric, 'on_hand unchanged by reservation');
  perform t.eq((select reserved_qty from listings where id = t.id('l_r1_mango')), 5::numeric, 'reserved = 5');
  perform t.eq(listing_available(t.id('l_r1_mango')), 15::numeric, 'available = 15');
  select ol.id into ln from order_lines ol join sub_orders so on so.id = ol.sub_order_id where so.order_id = o;
  perform t.ok((select stock_listing_id = listing_id from order_lines where id = ln), 'own-stock line reserves its own listing');
  perform t.eq((select fulfiller_store_id from fulfilments where order_line_id = ln), t.id('s_r1'), 'own-stock offer is fulfilled by the same store');
  select id into f from fulfilments where order_line_id = ln;

  -- cannot oversell
  perform t.as_user('buyer2');
  perform t.fails(format($q$select place_order_v2(jsonb_build_array(t.item('l_r1_mango', 16)), 'করিম', '01722222222', '১২ মিরপুর রোড', t.num('u1'))$q$), 'not enough stock', 'ordering more than available is rejected');

  -- stock cannot be edited directly, even by the owner
  perform t.as_user('res1');
  perform t.fails($q$update listings set on_hand_qty = 999 where id = t.id('l_r1_mango')$q$, 'stock can only change', 'direct stock edit blocked');
  perform t.fails($q$insert into listings (store_id, product_id, kind, stock_mode, on_hand_qty) select t.id('s_r1'), id, 'store_offer', 'own', 5 from products where slug = 'rice'$q$, 'zero stock', 'cannot create a listing with stock');
  perform t.affects($q$delete from stock_movements$q$, 0, 'an owner cannot delete movements (no policy)');
  perform t.as_service();
  perform t.fails($q$delete from stock_movements$q$, 'append-only', 'movements cannot be deleted, even by operators');
  perform t.fails($q$update stock_movements set note = 'x'$q$, 'append-only', 'movements cannot be edited, even by operators');
  perform t.as_user('res1');

  -- receiving stock: members only
  perform stock_receive(t.id('l_r1_mango'), 10, 'new harvest');
  perform t.as_user('outsider');
  perform t.fails($q$select stock_receive(t.id('l_r1_mango'), 10)$q$, 'not allowed', 'non-member cannot receive stock');
  perform t.as_user('res1');
  perform t.fails($q$select stock_adjust(t.id('l_r1_mango'), -100, 'oops')$q$, 'stock cannot go negative', 'adjust cannot drive stock negative');
  perform t.fails($q$select stock_adjust(t.id('l_r1_mango'), -26, 'oops')$q$, 'not enough available', 'adjust cannot go below reserved');
  perform t.fails($q$select stock_adjust(t.id('l_r1_mango'), -1, '')$q$, 'reason note', 'adjust needs a note');
  perform t.as_service();
  perform t.eq(listing_available(t.id('l_r1_mango')), 25::numeric, 'available = 30 on hand − 5 reserved');

  -- fulfilment: handing over commits stock (on_hand and reserved both drop)
  perform t.as_user('res1');
  perform advance_fulfilment(f, 'accepted'); perform advance_fulfilment(f, 'ready');
  perform t.fails(format('select advance_fulfilment(%L, %L)', f, 'delivered'), 'confirmed by the buyer', 'seller cannot mark delivered');
  perform advance_fulfilment(f, 'handed_over');
  perform t.as_service();
  perform t.eq((select on_hand_qty from listings where id = t.id('l_r1_mango')), 25::numeric, 'handover removes 5 from on_hand');
  perform t.eq((select reserved_qty from listings where id = t.id('l_r1_mango')), 0::numeric, 'handover clears the reservation');

  -- delivery failure after handover returns the goods
  perform t.as_user('res1');
  perform advance_fulfilment(f, 'failed');
  perform t.as_service();
  perform t.eq((select on_hand_qty from listings where id = t.id('l_r1_mango')), 30::numeric, 'failed delivery returns stock');
  perform t.eq((select status from order_lines where id = ln)::text, 'cancelled', 'line cancelled after failure');

  -- buyer cancels before handover: reservation released
  perform t.as_user('buyer1');
  o := place_order_v2(jsonb_build_array(t.item('l_r1_mango', 4)), 'রহিম উদ্দিন', '01711111111', '১২ মিরপুর রোড', t.num('u1'));
  perform t.as_service();
  perform t.eq((select reserved_qty from listings where id = t.id('l_r1_mango')), 4::numeric, 'reserved 4');
  perform t.as_user('buyer1');
  perform cancel_sub_order((select id from sub_orders where order_id = o));
  perform t.as_service();
  perform t.eq((select reserved_qty from listings where id = t.id('l_r1_mango')), 0::numeric, 'cancel releases the reservation');
  perform t.eq((select status from orders where id = o)::text, 'cancelled', 'order cancelled when its only sub-order is cancelled');

  -- invariants: reserved <= on_hand, and the columns equal the sum of the movement log
  perform t.eq((select count(*) from listings where reserved_qty > on_hand_qty)::int, 0, 'reserved never exceeds on_hand');
  perform t.eq((select count(*) from listings l where stock_mode = 'own'
          and (l.on_hand_qty <> coalesce((select sum(on_hand_delta) from stock_movements m where m.listing_id = l.id), 0)
            or l.reserved_qty <> coalesce((select sum(reserved_delta) from stock_movements m where m.listing_id = l.id), 0)))::int, 0, 'stock columns equal the movement log');
end $$;
