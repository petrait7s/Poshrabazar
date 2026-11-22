-- PosraBazar migration 5/7: ten-category taxonomy, product origin, inventory locations, service areas.
-- Product origin, store location, inventory location and delivery destination are four separate facts.
-- Rollback: rollbacks/20261122000002_geography_categories_down.sql

alter table categories add column active boolean not null default true;
insert into categories (slug, name_bn, name_en, blurb, sort) values
  ('vegetables',          'সবজি',                       'Vegetables',                     'তাজা মৌসুমি সবজি',                    10),
  ('fruits',              'ফল',                         'Fruits',                         'মৌসুমি ও আঞ্চলিক ফল',                 20),
  ('fish',                'মাছ',                        'Fish',                           'নদী, হাওর ও পুকুরের মাছ',              30),
  ('rice-grains',         'চাল ও শস্য',                 'Rice and grains',                'চাল, আটা, ডাল ছাড়া অন্য শস্য',         40),
  ('pulses',              'ডাল',                        'Pulses',                         'মসুর, মুগ, ছোলা ও অন্যান্য ডাল',        50),
  ('dairy',               'দুধ ও দুগ্ধজাত',              'Dairy',                          'দুধ, দই, ঘি, পনির',                    60),
  ('poultry-eggs',        'মুরগি ও ডিম',                'Poultry and eggs',               'দেশি মুরগি, হাঁস, ডিম',                70),
  ('spices-agri',         'মসলা ও কৃষিপণ্য',             'Spices and agricultural products','মসলা, তেল, মধু, চা ও অন্যান্য কৃষিপণ্য', 80),
  ('regional-food',       'আঞ্চলিক ও প্রক্রিয়াজাত খাবার', 'Regional and processed food',   'শুঁটকি, আচার, মিষ্টি, পিঠা, শীতলপাটি-ঘরানার হাতে তৈরি খাবার', 90),
  ('other-approved',      'অন্যান্য অনুমোদিত পণ্য',       'Other approved',                 'অ্যাডমিন অনুমোদিত অন্য পণ্য',           100)
on conflict (slug) do nothing;
-- Legacy demo categories stay (products may reference them) but leave the public taxonomy.
update categories set active = false where slug not in ('vegetables','fruits','fish','rice-grains','pulses','dairy','poultry-eggs','spices-agri','regional-food','other-approved');

alter table products add column form text not null default 'fresh' check (form in ('fresh', 'dried', 'processed', 'live'));

-- Where the store keeps stock (a farm gate, a warehouse, a shop). Separate from where the product was grown.
create table inventory_locations (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references stores(id) on delete cascade,
  name         text not null,
  district_id  smallint not null references districts(id),
  upazila_id   smallint references upazilas(id),
  address      text,
  created_at   timestamptz not null default now()
);
create index inventory_locations_store_idx on inventory_locations(store_id);

alter table listings
  add column origin_district_id     smallint references districts(id),
  add column inventory_location_id  uuid references inventory_locations(id);
-- (listings.origin_upazila_id already exists from migration 1)
create index listings_origin_idx on listings(origin_district_id);

create or replace function listings_validate_location() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.inventory_location_id is not null and not exists (select 1 from inventory_locations where id = new.inventory_location_id and store_id = new.store_id) then
    raise exception 'the inventory location must belong to the same store';
  end if;
  return new;
end $$;
create trigger listings_validate_location_t before insert or update on listings for each row execute function listings_validate_location();

-- Customers are served only in these districts. Sourcing is nationwide; delivery is not.
create table service_areas (
  district_id smallint primary key references districts(id),
  active      boolean not null default true,
  note        text,
  created_at  timestamptz not null default now()
);

-- Publishing now also needs a stated origin (district at least): buyers are shown where a product comes from.
create or replace function guard_listing_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_admin() then return new; end if;
  if tg_op = 'INSERT' then new.status := 'pending'; return new; end if;
  if new.status is distinct from old.status then
    if old.status = 'rejected' or new.status = 'rejected' then raise exception 'listing status is controlled by moderators'; end if;
    if new.status = 'active' then
      if not store_is_public(new.store_id) then raise exception 'your store must be approved before you can publish'; end if;
      if new.origin_district_id is null then raise exception 'say where this product comes from before publishing'; end if;
    end if;
  end if;
  return new;
end $$;

alter table inventory_locations enable row level security;
alter table service_areas       enable row level security;
create policy inventory_locations_read  on inventory_locations for select using (is_store_member(store_id) or is_staff());
create policy inventory_locations_write on inventory_locations for all using (is_store_member(store_id, true) or is_admin()) with check (is_store_member(store_id, true) or is_admin());
create policy service_areas_read  on service_areas for select using (true);
create policy service_areas_admin on service_areas for all using (is_admin()) with check (is_admin());
