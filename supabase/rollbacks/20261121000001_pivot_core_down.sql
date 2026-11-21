-- Reverts 20261121000001_pivot_core.sql and restores the earlier role helpers and signup trigger function.
drop function if exists stock_receive(uuid, numeric, text);
drop function if exists stock_adjust(uuid, numeric, text);
drop function if exists stock_move(uuid, numeric, numeric, stock_reason, text, uuid, text);

drop table if exists stock_movements;
drop table if exists price_tiers;
drop table if exists listings;
drop function if exists listing_available(uuid);
drop function if exists listing_stock_holder(uuid);
drop function if exists listing_unit_price(uuid, numeric);
drop function if exists listings_validate();
drop function if exists price_tiers_floor();
drop function if exists guard_listing_status();
drop function if exists guard_listing_stock_columns();
drop function if exists stock_movements_apply();
drop function if exists stock_movements_immutable();

drop table if exists pickup_points;
drop table if exists store_delivery_zones;
drop table if exists zone_upazilas;
drop table if exists delivery_zones;
drop table if exists producer_profiles;
drop table if exists store_members;
drop table if exists stores;
drop function if exists is_store_member(uuid, boolean);
drop function if exists stores_add_owner();
drop function if exists guard_store_verification();

-- restore the legacy single-role helpers and signup trigger body
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;
create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'agent'))
$$;
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, phone, full_name, role)
  values (
    new.id,
    nullif(new.phone, ''),
    new.raw_user_meta_data ->> 'full_name',
    -- users may only self-select buyer/seller; admin and agent are granted by staff
    case when new.raw_user_meta_data ->> 'role' = 'seller' then 'seller'::user_role else 'buyer'::user_role end
  );
  return new;
end $$;

drop table if exists user_roles;
drop function if exists guard_user_roles();
alter table profiles drop column if exists upazila_id, drop column if exists is_business_buyer;
drop table if exists upazilas;

drop type if exists stock_reason;
drop type if exists store_member_role;
drop type if exists stock_mode;
drop type if exists listing_kind;
drop type if exists store_type;
drop type if exists app_role;
