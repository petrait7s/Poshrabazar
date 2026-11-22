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
declare s uuid; l uuid;
begin
  -- a customer can open a store: it starts pending, they become its owner, and gain the reseller role
  perform t.as_user('buyer2');
  insert into stores (slug, type, name_bn, upazila_id, status, verification_tier) values ('b2-shop', 'reseller', 'B2', t.num('u1'), 'verified', 3) returning id into s;
  perform t.eq((select status from stores where id = s)::text, 'pending', 'a new store cannot self-verify');
  perform t.eq((select verification_tier from stores where id = s)::int, 0, 'a new store starts at tier 0');
  perform t.ok(is_store_member(s, true), 'the creator owns the store');
  perform t.ok(exists (select 1 from user_roles where user_id = t.id('buyer2') and role = 'reseller'), 'opening a reseller store grants the reseller role');
  perform t.fails(format('update stores set status = %L where id = %L', 'verified', s), 'only staff', 'owners cannot verify their own store');

  -- listings: new ones are forced to pending; owners cannot approve them
  insert into listings (store_id, product_id, kind, stock_mode, status) select s, id, 'store_offer', 'own', 'active' from products where slug = 'mango' returning id into l;
  perform t.eq((select status from listings where id = l)::text, 'pending', 'a new listing is forced to pending');
  perform t.fails(format('update listings set status = %L where id = %L', 'active', l), 'moderators', 'owners cannot approve their listing');
  perform t.as_user('admin');
  update listings set status = 'active' where id = l;
  perform t.eq((select status from listings where id = l)::text, 'active', 'an admin can approve it');
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
