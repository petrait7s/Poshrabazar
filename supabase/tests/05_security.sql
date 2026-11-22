-- ROLES, VERIFICATION AND LISTING MODERATION
do $$
begin
  perform t.as_user('buyer1');
  perform t.fails($q$insert into user_roles (user_id, role) values (t.id('buyer1'), 'admin')$q$, 'only admins', 'users cannot grant themselves admin');
  perform t.fails($q$insert into user_roles (user_id, role) values (t.id('buyer1'), 'agent')$q$, 'only admins', 'users cannot grant themselves agent');
  perform t.as_user('admin');
  insert into user_roles (user_id, role) values (t.id('outsider'), 'agent');
  perform t.ok(exists (select 1 from user_roles where user_id = t.id('outsider') and role = 'agent'), 'an admin can grant agent');
  perform t.as_service();
  delete from user_roles where user_id = t.id('outsider') and role = 'agent';
end $$;

do $$
declare s uuid; l uuid; a uuid;
begin
  -- a customer opens a store through the application: it starts pending and private, they become its owner
  perform t.as_user('buyer2');
  a := submit_seller_application(jsonb_build_object('seller_type', 'individual', 'full_name', 'Buyer Two', 'phone', '01711111111',
        'district_id', (select district_id from upazilas where id = t.num('u1')), 'upazila_id', t.num('u1'), 'address', '12 Test Road', 'store_name_bn', 'B2', 'store_name_en', 'B2 shop',
        'agree_terms', true, 'agree_delivery', true));
  select store_id into s from seller_applications where id = a;
  perform t.eq((select status from stores where id = s)::text, 'pending', 'a new store cannot self-verify');
  perform t.eq((select verification_tier from stores where id = s)::int, 0, 'a new store starts at tier 0');
  perform t.ok(is_store_member(s, true), 'the creator owns the store');
  perform t.ok(exists (select 1 from user_roles where user_id = t.id('buyer2') and role = 'reseller'), 'opening a reseller store grants the reseller role');
  perform t.fails(format('update stores set status = %L where id = %L', 'verified', s), 'only staff', 'owners cannot verify their own store');
  perform t.fails(format('update stores set published = true where id = %L', s), 'only staff', 'owners cannot publish their own store');
  perform t.as_service();
  update stores set status = 'verified', published = true where id = s;   -- staff approval (the full flow is tested in 06)
  perform t.as_user('buyer2');

  -- listings: new ones are forced to pending; owners cannot approve them
  insert into listings (store_id, product_id, kind, stock_mode, status) select s, id, 'store_offer', 'own', 'active' from products where slug = 'mango' returning id into l;
  perform t.eq((select status from listings where id = l)::text, 'pending', 'a new listing is forced to pending');
  update listings set status = 'active' where id = l;
  perform t.eq((select status from listings where id = l)::text, 'active', 'an owner of an approved store publishes directly');
  perform t.as_user('admin');
  update listings set status = 'rejected' where id = l;
  perform t.as_user('buyer2');
  perform t.fails(format('update listings set status = %L where id = %L', 'active', l), 'moderators', 'owners cannot undo a moderator rejection');
  perform t.as_user('admin');
  update listings set status = 'active' where id = l;
  perform t.as_user('buyer2');
  update listings set status = 'paused' where id = l;
  perform t.eq((select status from listings where id = l)::text, 'paused', 'an owner can pause an approved listing');

  -- membership boundaries
  perform t.as_user('outsider');
  perform t.affects(format('update stores set name_bn = %L where id = %L', 'hacked', s), 0, 'a non-member cannot edit a store');
  perform t.fails(format('insert into price_tiers (listing_id, min_qty, unit_price_paisa) values (%L, 1, 100)', l), 'row-level security', 'a non-member cannot add prices');
  perform t.eq((select count(*) from listings where id = l)::int, 0, 'paused listings are hidden from non-members');
  perform t.as_service();
end $$;
