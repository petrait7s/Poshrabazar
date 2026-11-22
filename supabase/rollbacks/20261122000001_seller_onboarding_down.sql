-- Rollback for 20261122000001_seller_onboarding.sql. Fails if stores without an upazila exist (outside-Sylhet sellers): remove them first.
drop table if exists store_follows, store_post_media, store_posts cascade;
alter table listings drop column if exists source_id;
drop function if exists listings_validate_source() cascade;
drop table if exists store_sources cascade;
drop function if exists guard_store_post(), guard_store_post_media(), hide_store_post(uuid, text), restore_store_post(uuid) cascade;
drop function if exists create_founder_store(text, text, text, store_type, smallint, smallint, text, text);
drop function if exists suspend_store(uuid, text), reinstate_store(uuid), review_application(uuid, text, text), withdraw_application(uuid),
  resubmit_application(uuid, jsonb), submit_seller_application(jsonb), log_application_event(uuid, application_status, application_status, text);
drop table if exists application_documents, application_events, seller_applications cascade;

drop policy listings_read on listings;
drop policy price_tiers_read on price_tiers;
drop policy stores_read on stores;
drop policy stores_insert on stores;
drop trigger if exists stores_fill_district_t on stores;
drop function if exists stores_fill_district();
drop function if exists store_is_public(uuid) cascade;

create policy stores_read   on stores for select using (status <> 'rejected' or is_store_member(id) or is_staff());
create policy stores_insert on stores for insert with check (auth.uid() is not null);
create policy listings_read on listings for select using (status = 'active' or is_store_member(store_id) or is_staff());
create policy price_tiers_read on price_tiers for select using (exists (select 1 from listings l where l.id = listing_id and (l.status = 'active' or is_store_member(l.store_id) or is_staff())));

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

alter table stores alter column upazila_id set not null;
drop index if exists stores_district_idx;
alter table stores drop column district_id, drop column seller_type, drop column operation_mode, drop column delivery_arrangement,
  drop column tagline_bn, drop column logo_url, drop column cover_url, drop column sourcing_note, drop column published, drop column featured,
  drop column suspended_at, drop column suspended_reason;
drop type if exists seller_type, store_operation_mode, delivery_arrangement, application_status, store_post_kind, store_source_type;
