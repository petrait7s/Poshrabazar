drop table if exists service_areas, inventory_locations cascade;
drop function if exists listings_validate_location() cascade;
alter table listings drop column if exists inventory_location_id, drop column if exists origin_district_id;
alter table products drop column if exists form;
delete from categories where slug in ('vegetables','fruits','fish','rice-grains','pulses','dairy','poultry-eggs','spices-agri','regional-food','other-approved');
alter table categories drop column if exists active;
create or replace function guard_listing_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_admin() then return new; end if;
  if tg_op = 'INSERT' then new.status := 'pending'; return new; end if;
  if new.status is distinct from old.status then
    if old.status = 'rejected' or new.status = 'rejected' then raise exception 'listing status is controlled by moderators'; end if;
    if new.status = 'active' and not store_is_public(new.store_id) then raise exception 'your store must be approved before you can publish'; end if;
  end if;
  return new;
end $$;
