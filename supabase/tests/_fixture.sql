-- Test world: 2 producers, 2 resellers, 2 buyers, an outsider and an admin.
--   rice  : P1 supply (stock 100; 1+ → ৳50.00, 50+ wholesale → ৳45.00)
--           R1 linked offer (1+ → ৳60.00, 50+ wholesale → ৳52.00), R2 linked offer (1+ → ৳55.00)
--   mango : R1 own-stock offer (stock 20, ৳100.00), P2 supply (stock 100, ৳80.00)
do $$
declare
  d smallint; u1 smallint; u2 smallint; u3 smallint; z smallint; c1 smallint; pk uuid;
  pr_rice uuid; pr_mango uuid; s_p1 uuid; s_p2 uuid; s_r1 uuid; s_r2 uuid;
  l_p1_rice uuid; l_r1_rice uuid; l_r2_rice uuid; l_r1_mango uuid; l_p2_mango uuid;
begin
  insert into divisions (id, name_bn, name_en) values (1, 'সিলেট', 'Sylhet');
  insert into districts (id, division_id, name_bn) values (1, 1, 'সিলেট') returning id into d;
  insert into upazilas (district_id, name_bn, name_en) values (d, 'U1', 'U1') returning id into u1;
  insert into upazilas (district_id, name_bn, name_en) values (d, 'U2', 'U2') returning id into u2;
  insert into upazilas (district_id, name_bn, name_en) values (d, 'U3', 'U3') returning id into u3;
  insert into t.nums values ('u1', u1), ('u2', u2), ('u3', u3);
  insert into categories (slug, name_bn, name_en) values ('rice-grains', 'চাল', 'Rice') returning id into c1;
  insert into t.nums values ('cat_rice', c1);
  insert into products (slug, category_id, name_bn, unit_bn) values ('rice', c1, 'চাল', 'কেজি') returning id into pr_rice;
  insert into products (slug, category_id, name_bn, unit_bn) values ('mango', c1, 'আম', 'কেজি') returning id into pr_mango;

  insert into auth.users (id, phone) values
    ('00000000-0000-0000-0000-00000000b001', '01700000001'), ('00000000-0000-0000-0000-00000000b002', '01700000002'),
    ('00000000-0000-0000-0000-00000000a001', '01700000011'), ('00000000-0000-0000-0000-00000000a002', '01700000012'),
    ('00000000-0000-0000-0000-00000000c001', '01700000021'), ('00000000-0000-0000-0000-00000000c002', '01700000022'),
    ('00000000-0000-0000-0000-00000000d001', '01700000031'), ('00000000-0000-0000-0000-00000000e001', '01700000099');
  insert into t.ids values ('buyer1', '00000000-0000-0000-0000-00000000b001'), ('buyer2', '00000000-0000-0000-0000-00000000b002'),
    ('prod1', '00000000-0000-0000-0000-00000000a001'), ('prod2', '00000000-0000-0000-0000-00000000a002'),
    ('res1', '00000000-0000-0000-0000-00000000c001'), ('res2', '00000000-0000-0000-0000-00000000c002'),
    ('outsider', '00000000-0000-0000-0000-00000000d001'), ('admin', '00000000-0000-0000-0000-00000000e001');
  insert into user_roles (user_id, role) values (t.id('admin'), 'admin');

  insert into stores (slug, type, name_bn, upazila_id, status) values ('p1', 'producer', 'P1', u1, 'verified') returning id into s_p1;
  insert into stores (slug, type, name_bn, upazila_id, status) values ('p2', 'producer', 'P2', u2, 'verified') returning id into s_p2;
  insert into stores (slug, type, name_bn, upazila_id, status) values ('r1', 'reseller', 'R1', u1, 'verified') returning id into s_r1;
  insert into stores (slug, type, name_bn, upazila_id, status) values ('r2', 'reseller', 'R2', u1, 'verified') returning id into s_r2;
  insert into store_members values (s_p1, t.id('prod1'), 'owner'), (s_p2, t.id('prod2'), 'owner'), (s_r1, t.id('res1'), 'owner'), (s_r2, t.id('res2'), 'owner');
  insert into t.ids values ('s_p1', s_p1), ('s_p2', s_p2), ('s_r1', s_r1), ('s_r2', s_r2);

  insert into delivery_zones (name_bn, district_id) values ('Z1', d) returning id into z;
  insert into zone_upazilas values (z, u1), (z, u2);
  insert into store_delivery_zones values (s_p1, z, 3000), (s_p2, z, 4000), (s_r1, z, 2000), (s_r2, z, 5000);
  insert into pickup_points (store_id, name_bn, upazila_id) values (s_r1, 'R1 pickup', u1) returning id into pk;
  insert into t.ids values ('pick_r1', pk);

  insert into listings (store_id, product_id, kind, stock_mode, status, moq) values (s_p1, pr_rice, 'supply', 'own', 'active', 1) returning id into l_p1_rice;
  insert into price_tiers (listing_id, min_qty, unit_price_paisa, is_wholesale) values (l_p1_rice, 1, 5000, false), (l_p1_rice, 50, 4500, true);
  perform stock_move(l_p1_rice, 100, 0, 'receive');
  insert into listings (store_id, product_id, kind, stock_mode, source_listing_id, status, moq) values (s_r1, pr_rice, 'store_offer', 'linked', l_p1_rice, 'active', 1) returning id into l_r1_rice;
  insert into price_tiers (listing_id, min_qty, unit_price_paisa, is_wholesale) values (l_r1_rice, 1, 6000, false), (l_r1_rice, 50, 5200, true);
  insert into listings (store_id, product_id, kind, stock_mode, source_listing_id, status, moq) values (s_r2, pr_rice, 'store_offer', 'linked', l_p1_rice, 'active', 1) returning id into l_r2_rice;
  insert into price_tiers (listing_id, min_qty, unit_price_paisa) values (l_r2_rice, 1, 5500);

  insert into listings (store_id, product_id, kind, stock_mode, status, moq) values (s_r1, pr_mango, 'store_offer', 'own', 'active', 1) returning id into l_r1_mango;
  insert into price_tiers (listing_id, min_qty, unit_price_paisa) values (l_r1_mango, 1, 10000);
  perform stock_move(l_r1_mango, 20, 0, 'receive');
  insert into listings (store_id, product_id, kind, stock_mode, status, moq) values (s_p2, pr_mango, 'supply', 'own', 'active', 1) returning id into l_p2_mango;
  insert into price_tiers (listing_id, min_qty, unit_price_paisa) values (l_p2_mango, 1, 8000);
  perform stock_move(l_p2_mango, 100, 0, 'receive');

  insert into t.ids values ('l_p1_rice', l_p1_rice), ('l_r1_rice', l_r1_rice), ('l_r2_rice', l_r2_rice), ('l_r1_mango', l_r1_mango), ('l_p2_mango', l_p2_mango);
end $$;
