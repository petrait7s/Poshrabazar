-- SELLER ONBOARDING, PUBLISHING, STORE STORY
do $$
declare a uuid; s uuid; p jsonb; pid uuid; cnt int; lst uuid; src uuid;
begin
  p := jsonb_build_object('seller_type', 'farmer_producer', 'full_name', 'Rahim Uddin', 'phone', '01811111111', 'district_id', (select district_id from upazilas where id = t.num('u1')),
        'upazila_id', t.num('u1'), 'address', 'Village Road, Test', 'store_name_bn', 'রহিম', 'store_name_en', 'Rahim Farm', 'agree_terms', true, 'agree_delivery', true);

  -- validation
  perform t.as_user('buyer1');
  perform t.fails($q$select submit_seller_application('{}'::jsonb)$q$, '', 'an empty application is rejected');
  perform t.fails(format('select submit_seller_application(%L::jsonb)', (p || '{"phone":"123"}')::text), 'mobile', 'a bad phone number is rejected');
  perform t.fails(format('select submit_seller_application(%L::jsonb)', (p || '{"agree_terms":false}')::text), 'accept', 'terms must be accepted');

  -- submit: private pending store, owner membership, event logged
  a := submit_seller_application(p);
  select store_id into s from seller_applications where id = a;
  perform t.eq((select status from seller_applications where id = a)::text, 'submitted', 'application is submitted');
  perform t.eq((select published from stores where id = s), false, 'the store is not public yet');
  perform t.ok(is_store_member(s, true), 'applicant owns the store');
  perform t.fails(format('select submit_seller_application(%L::jsonb)', p::text), 'in progress', 'one open application at a time');
  perform t.as_user('buyer2');
  perform t.eq((select count(*) from stores where id = s)::int, 0, 'other users cannot see the pending store');
  perform t.eq((select count(*) from seller_applications where id = a)::int, 0, 'other users cannot see the application');
  perform t.as_user('buyer1');
  perform t.affects(format('update seller_applications set status = %L where id = %L', 'approved', a), 0, 'applicants cannot approve themselves');
  perform t.fails(format('select review_application(%L, %L)', a, 'approve'), 'admins only', 'applicants cannot review');

  -- cannot publish products or posts while pending
  perform t.as_service();
  insert into listings (store_id, product_id, kind, stock_mode) select s, id, 'store_offer', 'own' from products where slug = 'mango' returning id into lst;
  update listings set origin_district_id = (select district_id from upazilas where id = t.num('u1')) where id = lst;
  perform t.as_user('buyer1');
  perform t.fails(format('update listings set status = %L where id = %L', 'active', lst), 'approved', 'a pending store cannot publish products');
  perform t.fails(format('insert into store_posts (store_id, kind, title) values (%L, %L, %L)', s, 'announcement', 'Hello'), 'row-level security', 'a pending store cannot post');

  -- admin flow
  perform t.as_user('admin');
  perform t.fails(format('select review_application(%L, %L)', a, 'approve'), 'start the review', 'approval needs review first');
  perform review_application(a, 'start_review');
  perform t.fails(format('select review_application(%L, %L)', a, 'approve'), 'identity', 'approval needs an identity document');
  perform t.fails(format('select review_application(%L, %L)', a, 'request_info'), 'what information', 'a request needs a message');
  perform review_application(a, 'request_info', 'please send NID photo');
  perform t.as_user('buyer1');
  insert into application_documents (application_id, kind, storage_path) values (a, 'identity', 'private/a/nid.jpg');
  perform resubmit_application(a, '{"description":"fresh vegetables"}');
  perform t.eq((select status from seller_applications where id = a)::text, 'submitted', 'resubmitted to the queue');
  perform t.as_user('admin');
  perform review_application(a, 'start_review');
  perform review_application(a, 'approve', 'documents checked');
  perform t.eq((select status from stores where id = s)::text, 'verified', 'approval verifies the store');
  perform t.ok((select published from stores where id = s), 'approval publishes the store');
  perform t.eq((select count(*) from application_events where application_id = a)::int, 6, 'every transition is logged');
  perform t.fails(format('select withdraw_application(%L)', a), '', 'admin cannot withdraw for the applicant');

  -- public visibility and direct publishing
  perform t.as_user('buyer2');
  perform t.eq((select count(*) from stores where id = s)::int, 1, 'approved store is public');
  perform t.as_user('buyer1');
  update listings set status = 'active' where id = lst;
  perform t.as_user('buyer2');
  perform t.eq((select count(*) from listings where id = lst)::int, 1, 'published product is visible');

  -- store story
  perform t.as_user('buyer1');
  insert into store_sources (store_id, name, source_type, relationship, district_id) values (s, 'Our field', 'own_farm', 'we_grow', (select district_id from upazilas where id = t.num('u1'))) returning id into src;
  insert into store_posts (store_id, kind, title, listing_id, source_id) values (s, 'production', 'Harvest today', lst, src) returning id into pid;
  perform t.fails(format('insert into store_posts (store_id, kind, title, listing_id) values (%L, %L, %L, %L)', s, 'new_stock', 'Other', t.id('l_p1_rice')), 'must belong', 'cannot link another store''s product');
  perform t.fails(format('update store_posts set status = %L where id = %L', 'hidden', pid), 'staff', 'owner cannot hide via status');
  for cnt in 1..4 loop insert into store_posts (store_id, kind, title) values (s, 'announcement', 'Post ' || cnt); end loop;
  perform t.fails(format('insert into store_posts (store_id, kind, title) values (%L, %L, %L)', s, 'announcement', 'Sixth'), 'limit', 'five updates a day');
  perform t.as_user('buyer2');
  perform t.eq((select count(*) from store_posts where store_id = s)::int, 5, 'public sees published updates');
  insert into store_follows (user_id, store_id) values (t.id('buyer2'), s);
  perform t.fails(format('insert into store_follows (user_id, store_id) values (%L, %L)', t.id('buyer1'), s), 'row-level security', 'cannot follow on behalf of someone else');
  perform t.as_user('admin');
  perform hide_store_post(pid, 'misleading');
  perform t.as_user('buyer2');
  perform t.eq((select count(*) from store_posts where store_id = s)::int, 4, 'hidden update disappears');

  -- suspension hides the store and its products, reinstate restores
  perform t.as_user('admin');
  perform suspend_store(s, 'complaint');
  perform t.as_user('buyer2');
  perform t.eq((select count(*) from stores where id = s)::int, 0, 'suspended store is hidden');
  perform t.eq((select count(*) from listings where id = lst)::int, 0, 'suspended store products are hidden');
  perform t.as_user('admin');
  perform reinstate_store(s);

  -- founder store: published, makes no verification claim
  s := create_founder_store('founder-1', 'পসরা', 'Posra One', 'reseller', (select district_id from upazilas where id = t.num('u1')));
  perform t.eq((select status from stores where id = s)::text, 'pending', 'founder store is not marked verified');
  perform t.eq((select operation_mode from stores where id = s)::text, 'founder_managed', 'founder store is operated by the platform');
  perform t.as_user('buyer1');
  perform t.fails($q$select create_founder_store('x', 'x', 'x', 'reseller', 1::smallint)$q$, 'admins only', 'only admins create founder stores');

  -- rejection
  perform t.as_user('outsider');
  a := submit_seller_application(p);
  perform t.as_user('admin');
  perform t.fails(format('select review_application(%L, %L)', a, 'reject'), 'reason', 'rejection needs a reason');
  perform review_application(a, 'reject', 'incomplete');
  perform t.as_user('outsider');
  perform t.eq((select status from seller_applications where id = a)::text, 'rejected', 'rejected is visible to the applicant');
  perform t.as_service();
end $$;
