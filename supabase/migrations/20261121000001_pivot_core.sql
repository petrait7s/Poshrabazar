-- PosraBazar pivot, migration 1/3: location, roles, stores, listings, price tiers, stock ledger, delivery.
-- ADDITIVE: nothing from earlier migrations is dropped. Rollback: rollbacks/20261121000001_pivot_core_down.sql
-- Money is integer paisa. Stock changes are only possible through stock_movements (append-only).

-- ───────────────────────── enums ─────────────────────────
create type app_role          as enum ('customer', 'reseller', 'producer', 'admin', 'agent');
create type store_type        as enum ('reseller', 'producer', 'wholesaler', 'retailer');
create type listing_kind      as enum ('supply', 'store_offer');   -- supply = producer's own goods; store_offer = what a store sells
create type stock_mode        as enum ('own', 'linked');           -- linked = stock lives on a producer's supply listing
create type store_member_role as enum ('owner', 'manager', 'staff');
create type stock_reason      as enum ('receive', 'adjust', 'reserve', 'release', 'commit', 'return');

-- ───────────────────────── location ─────────────────────────
create table upazilas (
  id          smallint generated always as identity primary key,
  district_id smallint not null references districts(id),
  name_bn     text not null,
  name_en     text,
  latitude    numeric(9,6),          -- left empty until verified data is loaded
  longitude   numeric(9,6),
  unique (district_id, name_bn)
);
create index upazilas_district_idx on upazilas(district_id);

-- ───────────────────────── roles ─────────────────────────
create table user_roles (
  user_id    uuid not null references profiles(id) on delete cascade,
  role       app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references profiles(id),
  primary key (user_id, role)
);

alter table profiles
  add column upazila_id smallint references upazilas(id),
  add column is_business_buyer boolean not null default false;

-- Backfill from the legacy single-value role.
insert into user_roles (user_id, role)
select id, case role when 'seller' then 'reseller'::app_role when 'admin' then 'admin'::app_role when 'agent' then 'agent'::app_role else 'customer'::app_role end
from profiles on conflict do nothing;
insert into user_roles (user_id, role) select id, 'customer' from profiles on conflict do nothing;

create or replace function is_staff() returns boolean   -- admin or regional agent (now role-table based)
language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role in ('admin', 'agent'))
      or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'agent'))
$$;
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
      or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

-- New accounts get the customer role (plus reseller when they asked to sell).
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, phone, full_name, role)
  values (new.id, nullif(new.phone, ''), new.raw_user_meta_data ->> 'full_name',
          case when new.raw_user_meta_data ->> 'role' = 'seller' then 'seller'::user_role else 'buyer'::user_role end);
  insert into user_roles (user_id, role) values (new.id, 'customer');
  if new.raw_user_meta_data ->> 'role' in ('seller', 'reseller') then insert into user_roles (user_id, role) values (new.id, 'reseller'); end if;
  return new;
end $$;

-- Only admins grant admin/agent.
create or replace function guard_user_roles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role in ('admin', 'agent') and auth.uid() is not null and not is_admin() then raise exception 'only admins can grant this role'; end if;
  return new;
end $$;
create trigger user_roles_guard before insert on user_roles for each row execute function guard_user_roles();

-- ───────────────────────── stores & producers ─────────────────────────
create table stores (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  type              store_type not null,
  name_bn           text not null,
  name_en           text,
  description       text,
  upazila_id        smallint not null references upazilas(id),
  address           text,
  status            verification_status not null default 'pending',
  verification_tier smallint not null default 0 check (verification_tier between 0 and 3),  -- 1 phone, 2 identity/licence, 3 field-visited
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index stores_upazila_idx on stores(upazila_id);
create trigger stores_updated before update on stores for each row execute function set_updated_at();

create table store_members (
  store_id    uuid not null references stores(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  member_role store_member_role not null default 'owner',
  primary key (store_id, user_id)
);
create index store_members_user_idx on store_members(user_id);

create table producer_profiles (
  store_id         uuid primary key references stores(id) on delete cascade,
  producer_kind    text not null check (producer_kind in ('farmer', 'orchard', 'fisher', 'farm', 'manufacturer', 'cooperative', 'other')),
  area_description text,
  certifications   text
);

create or replace function is_store_member(sid uuid, owner_or_manager_only boolean default false) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from store_members m where m.store_id = sid and m.user_id = auth.uid()
                 and (not owner_or_manager_only or m.member_role in ('owner', 'manager')))
$$;

create or replace function stores_add_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    insert into store_members (store_id, user_id, member_role) values (new.id, auth.uid(), 'owner') on conflict do nothing;
    insert into user_roles (user_id, role) values (auth.uid(), case when new.type = 'producer' then 'producer'::app_role else 'reseller'::app_role end) on conflict do nothing;
  end if;
  return new;
end $$;
create trigger stores_owner after insert on stores for each row execute function stores_add_owner();

-- Only staff verify stores.
create or replace function guard_store_verification() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and not is_staff() then new.status := 'pending'; new.verification_tier := 0; end if;
  elsif (new.status is distinct from old.status or new.verification_tier is distinct from old.verification_tier) and auth.uid() is not null and not is_staff() then
    raise exception 'only staff can change store verification';
  end if;
  return new;
end $$;
create trigger stores_guard_verification before insert or update on stores for each row execute function guard_store_verification();

-- ───────────────────────── delivery ─────────────────────────
create table delivery_zones (
  id          smallint generated always as identity primary key,
  name_bn     text not null,
  district_id smallint references districts(id)
);
create table zone_upazilas (
  zone_id    smallint not null references delivery_zones(id) on delete cascade,
  upazila_id smallint not null references upazilas(id),
  primary key (zone_id, upazila_id)
);
-- Store-managed delivery: which zones a store serves and what it charges. No platform logistics yet;
-- fulfilments.method / provider (migration 2) keep room for a courier integration later.
create table store_delivery_zones (
  store_id         uuid not null references stores(id) on delete cascade,
  zone_id          smallint not null references delivery_zones(id) on delete cascade,
  fee_paisa        integer not null default 0 check (fee_paisa >= 0),
  primary key (store_id, zone_id)
);
create table pickup_points (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references stores(id) on delete cascade,
  name_bn    text not null,
  upazila_id smallint not null references upazilas(id),
  address    text,
  active     boolean not null default true
);
create index pickup_points_store_idx on pickup_points(store_id);

-- ───────────────────────── listings ─────────────────────────
create table listings (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references stores(id) on delete cascade,
  product_id        uuid not null references products(id),
  kind              listing_kind not null,
  stock_mode        stock_mode not null,
  source_listing_id uuid references listings(id),
  on_hand_qty       numeric(12,2) not null default 0 check (on_hand_qty >= 0),
  reserved_qty      numeric(12,2) not null default 0 check (reserved_qty >= 0),
  moq               numeric(12,2) not null default 1 check (moq > 0),
  harvest_date      date,
  season_from       smallint check (season_from between 1 and 12),
  season_to         smallint check (season_to between 1 and 12),
  origin_upazila_id smallint references upazilas(id),
  grade             text check (grade in ('A', 'B', 'C')),
  status            listing_status not null default 'pending',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (reserved_qty <= on_hand_qty),
  check (
       (kind = 'supply'      and stock_mode = 'own'    and source_listing_id is null)
    or (kind = 'store_offer' and stock_mode = 'own'    and source_listing_id is null)
    or (kind = 'store_offer' and stock_mode = 'linked' and source_listing_id is not null)
  ),
  check (stock_mode = 'own' or (on_hand_qty = 0 and reserved_qty = 0))   -- linked listings never hold stock themselves
);
create index listings_store_idx   on listings(store_id);
create index listings_product_idx on listings(product_id) where status = 'active';
create index listings_source_idx  on listings(source_listing_id) where source_listing_id is not null;
create trigger listings_updated before update on listings for each row execute function set_updated_at();

create table price_tiers (
  id               bigint generated always as identity primary key,
  listing_id       uuid not null references listings(id) on delete cascade,
  min_qty          numeric(12,2) not null check (min_qty > 0),
  unit_price_paisa integer not null check (unit_price_paisa > 0),
  is_wholesale     boolean not null default false,
  unique (listing_id, min_qty)
);

-- Pricing helper: price per unit for a quantity = the tier with the largest min_qty not above qty.
create or replace function listing_unit_price(p_listing uuid, p_qty numeric) returns integer
language plpgsql stable set search_path = public as $$
declare v integer;
begin
  select unit_price_paisa into v from price_tiers where listing_id = p_listing and min_qty <= p_qty order by min_qty desc limit 1;
  if v is null then raise exception 'quantity % is below the minimum for listing %', p_qty, p_listing; end if;
  return v;
end $$;

create or replace function listing_stock_holder(p_listing uuid) returns uuid   -- listing whose stock backs this one
language sql stable set search_path = public as $$ select coalesce(source_listing_id, id) from listings where id = p_listing $$;

create or replace function listing_available(p_listing uuid) returns numeric
language sql stable set search_path = public as $$
  select h.on_hand_qty - h.reserved_qty from listings h where h.id = listing_stock_holder(p_listing)
$$;

-- Structural rules for linked offers; also keeps tier prices at or above the supplier's price.
create or replace function listings_validate() returns trigger
language plpgsql set search_path = public as $$
declare src listings%rowtype;
begin
  if new.source_listing_id is not null then
    select * into src from listings where id = new.source_listing_id;
    if not found then raise exception 'source listing not found'; end if;
    if src.kind <> 'supply' then raise exception 'a linked offer must point to a producer supply listing'; end if;
    if src.store_id = new.store_id then raise exception 'cannot link to your own supply listing'; end if;
    if src.product_id <> new.product_id then raise exception 'linked offer must be for the same product as its source'; end if;
  end if;
  return new;
end $$;
create trigger listings_validate_t before insert or update on listings for each row execute function listings_validate();

create or replace function price_tiers_floor() returns trigger
language plpgsql set search_path = public as $$
declare src uuid; floor_price integer;
begin
  select source_listing_id into src from listings where id = new.listing_id;
  if src is not null then
    select unit_price_paisa into floor_price from price_tiers where listing_id = src and min_qty <= new.min_qty order by min_qty desc limit 1;
    if floor_price is not null and new.unit_price_paisa < floor_price then
      raise exception 'price % is below the supply price % for quantity %', new.unit_price_paisa, floor_price, new.min_qty;
    end if;
  end if;
  return new;
end $$;
create trigger price_tiers_floor_t before insert or update on price_tiers for each row execute function price_tiers_floor();

-- Listing approval stays with staff; owners may pause/resume approved listings.
create or replace function guard_listing_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_admin() then return new; end if;
  if tg_op = 'INSERT' then new.status := 'pending';
  elsif new.status is distinct from old.status and (old.status in ('pending', 'rejected') or new.status in ('pending', 'rejected')) then
    raise exception 'listing status is controlled by moderators';
  end if;
  return new;
end $$;
create trigger listings_guard_status before insert or update on listings for each row execute function guard_listing_status();

-- ───────────────────────── stock ledger ─────────────────────────
-- on_hand_qty / reserved_qty can only change through rows here. The log is append-only, so every
-- stock number can be rebuilt (and audited) by summing movements.
create table stock_movements (
  id             bigint generated always as identity primary key,
  listing_id     uuid not null references listings(id),
  on_hand_delta  numeric(12,2) not null default 0,
  reserved_delta numeric(12,2) not null default 0,
  reason         stock_reason not null,
  ref_type       text,
  ref_id         uuid,
  note           text,
  created_by     uuid,
  created_at     timestamptz not null default now(),
  check (on_hand_delta <> 0 or reserved_delta <> 0)
);
create index stock_movements_listing_idx on stock_movements(listing_id, id);

create or replace function stock_movements_apply() returns trigger
language plpgsql security definer set search_path = public as $$
declare l listings%rowtype;
begin
  select * into l from listings where id = new.listing_id for update;
  if not found then raise exception 'listing not found'; end if;
  if l.stock_mode <> 'own' then raise exception 'linked listings hold no stock; adjust the supply listing'; end if;
  if l.on_hand_qty + new.on_hand_delta < 0 then raise exception 'stock cannot go negative'; end if;
  if l.reserved_qty + new.reserved_delta < 0 then raise exception 'reservation cannot go negative'; end if;
  if l.reserved_qty + new.reserved_delta > l.on_hand_qty + new.on_hand_delta then raise exception 'not enough available stock'; end if;
  perform set_config('pivot.stock_writer', 'on', true);
  update listings set on_hand_qty = on_hand_qty + new.on_hand_delta, reserved_qty = reserved_qty + new.reserved_delta where id = new.listing_id;
  perform set_config('pivot.stock_writer', 'off', true);
  new.created_by := coalesce(new.created_by, auth.uid());
  return new;
end $$;
create trigger stock_movements_apply_t before insert on stock_movements for each row execute function stock_movements_apply();

create or replace function stock_movements_immutable() returns trigger
language plpgsql as $$ begin raise exception 'stock_movements is append-only'; end $$;
create trigger stock_movements_no_update before update or delete on stock_movements for each row execute function stock_movements_immutable();

create or replace function guard_listing_stock_columns() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if (new.on_hand_qty <> 0 or new.reserved_qty <> 0) and coalesce(current_setting('pivot.stock_writer', true), 'off') <> 'on' then
      raise exception 'create the listing with zero stock and receive stock through stock_receive()';
    end if;
  elsif (new.on_hand_qty <> old.on_hand_qty or new.reserved_qty <> old.reserved_qty) and coalesce(current_setting('pivot.stock_writer', true), 'off') <> 'on' then
    raise exception 'stock can only change through stock_movements';
  end if;
  return new;
end $$;
create trigger listings_guard_stock before insert or update on listings for each row execute function guard_listing_stock_columns();

-- Internal writer used by order functions (not granted to clients).
create or replace function stock_move(p_listing uuid, p_on_hand numeric, p_reserved numeric, p_reason stock_reason, p_ref_type text default null, p_ref_id uuid default null, p_note text default null)
returns void language sql security definer set search_path = public as $$
  insert into stock_movements (listing_id, on_hand_delta, reserved_delta, reason, ref_type, ref_id, note) values (p_listing, p_on_hand, p_reserved, p_reason, p_ref_type, p_ref_id, p_note)
$$;
revoke all on function stock_move(uuid, numeric, numeric, stock_reason, text, uuid, text) from public, anon, authenticated;

-- Public API for store members: receive stock, or correct it (never below what is reserved).
create or replace function stock_receive(p_listing uuid, p_qty numeric, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  select store_id into sid from listings where id = p_listing;
  if sid is null or not (is_store_member(sid) or is_admin()) then raise exception 'not allowed'; end if;
  if p_qty <= 0 then raise exception 'quantity must be positive'; end if;
  perform stock_move(p_listing, p_qty, 0, 'receive', null, null, p_note);
end $$;
create or replace function stock_adjust(p_listing uuid, p_delta numeric, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  select store_id into sid from listings where id = p_listing;
  if sid is null or not (is_store_member(sid) or is_admin()) then raise exception 'not allowed'; end if;
  if p_delta = 0 then raise exception 'delta must not be zero'; end if;
  if coalesce(trim(p_note), '') = '' then raise exception 'a reason note is required'; end if;
  perform stock_move(p_listing, p_delta, 0, 'adjust', null, null, p_note);
end $$;
grant execute on function stock_receive(uuid, numeric, text), stock_adjust(uuid, numeric, text) to authenticated;

-- ───────────────────────── RLS ─────────────────────────
alter table upazilas            enable row level security;
alter table user_roles          enable row level security;
alter table stores              enable row level security;
alter table store_members       enable row level security;
alter table producer_profiles   enable row level security;
alter table delivery_zones      enable row level security;
alter table zone_upazilas       enable row level security;
alter table store_delivery_zones enable row level security;
alter table pickup_points       enable row level security;
alter table listings            enable row level security;
alter table price_tiers         enable row level security;
alter table stock_movements     enable row level security;

create policy upazilas_read on upazilas for select using (true);
create policy upazilas_admin on upazilas for all using (is_admin()) with check (is_admin());
create policy zones_read on delivery_zones for select using (true);
create policy zones_admin on delivery_zones for all using (is_admin()) with check (is_admin());
create policy zone_upazilas_read on zone_upazilas for select using (true);
create policy zone_upazilas_admin on zone_upazilas for all using (is_admin()) with check (is_admin());

create policy user_roles_read   on user_roles for select using (user_id = auth.uid() or is_admin());
create policy user_roles_insert on user_roles for insert with check ((user_id = auth.uid() and role in ('customer', 'reseller', 'producer')) or is_admin());
create policy user_roles_delete on user_roles for delete using (is_admin());

create policy stores_read   on stores for select using (status <> 'rejected' or is_store_member(id) or is_staff());
create policy stores_insert on stores for insert with check (auth.uid() is not null);
create policy stores_update on stores for update using (is_store_member(id, true) or is_staff()) with check (is_store_member(id, true) or is_staff());
create policy stores_delete on stores for delete using (is_admin());

create policy store_members_read   on store_members for select using (user_id = auth.uid() or is_store_member(store_id) or is_admin());
create policy store_members_write  on store_members for all using (is_store_member(store_id, true) or is_admin()) with check (is_store_member(store_id, true) or is_admin());

create policy producer_profiles_read  on producer_profiles for select using (true);
create policy producer_profiles_write on producer_profiles for all using (is_store_member(store_id, true) or is_admin()) with check (is_store_member(store_id, true) or is_admin());

create policy store_delivery_read  on store_delivery_zones for select using (true);
create policy store_delivery_write on store_delivery_zones for all using (is_store_member(store_id, true) or is_admin()) with check (is_store_member(store_id, true) or is_admin());
create policy pickup_points_read   on pickup_points for select using (active or is_store_member(store_id));
create policy pickup_points_write  on pickup_points for all using (is_store_member(store_id, true) or is_admin()) with check (is_store_member(store_id, true) or is_admin());

create policy listings_read  on listings for select using (status = 'active' or is_store_member(store_id) or is_staff());
create policy listings_write on listings for all using (is_store_member(store_id, true) or is_admin()) with check (is_store_member(store_id, true) or is_admin());
create policy price_tiers_read  on price_tiers for select using (exists (select 1 from listings l where l.id = listing_id and (l.status = 'active' or is_store_member(l.store_id) or is_staff())));
create policy price_tiers_write on price_tiers for all using (exists (select 1 from listings l where l.id = listing_id and (is_store_member(l.store_id, true) or is_admin())))
                                                       with check (exists (select 1 from listings l where l.id = listing_id and (is_store_member(l.store_id, true) or is_admin())));
create policy stock_movements_read on stock_movements for select using (exists (select 1 from listings l where l.id = listing_id and (is_store_member(l.store_id) or is_admin())));
