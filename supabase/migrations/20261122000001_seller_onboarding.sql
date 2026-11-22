-- PosraBazar open marketplace, migration 4/7: seller onboarding, publishing rules, store story.
-- ADDITIVE except where a rule is replaced (guards, policies). Rollback: rollbacks/20261122000001_seller_onboarding_down.sql

create type seller_type          as enum ('individual', 'farmer_producer', 'youth_entrepreneur', 'business');
create type store_operation_mode as enum ('founder_managed', 'independent');
create type delivery_arrangement as enum ('platform_managed', 'seller_managed', 'third_party');
create type application_status   as enum ('draft', 'submitted', 'in_review', 'needs_info', 'approved', 'rejected', 'withdrawn');
create type store_post_kind      as enum ('sourcing', 'production', 'new_stock', 'announcement');
create type store_source_type    as enum ('own_farm', 'local_farmers', 'other_district_supplier', 'wholesale_market', 'own_workshop');

-- ───────────────────────── stores: identity, mode, publishing ─────────────────────────
alter table stores
  add column district_id           smallint references districts(id),
  add column seller_type           seller_type,
  add column operation_mode        store_operation_mode not null default 'independent',
  add column delivery_arrangement  delivery_arrangement not null default 'platform_managed',
  add column tagline_bn            text,
  add column logo_url              text,
  add column cover_url             text,
  add column sourcing_note         text,
  add column published             boolean not null default false,
  add column featured              boolean not null default false,
  add column suspended_at          timestamptz,
  add column suspended_reason      text;

-- A store can be anywhere in Bangladesh (nationwide sourcing); the upazila table only covers Sylhet for now.
update stores s set district_id = u.district_id from upazilas u where u.id = s.upazila_id;
alter table stores alter column district_id set not null;
alter table stores alter column upazila_id drop not null;
create index stores_district_idx on stores(district_id);

create or replace function stores_fill_district() returns trigger
language plpgsql as $$
begin
  if new.district_id is null and new.upazila_id is not null then select district_id into new.district_id from upazilas where id = new.upazila_id; end if;
  return new;
end $$;
create trigger stores_fill_district_t before insert or update on stores for each row execute function stores_fill_district();

create or replace function store_is_public(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from stores where id = sid and published and suspended_at is null)
$$;

-- Approval, publishing, delivery arrangement and suspension belong to staff. An independent store can only be
-- published once it is verified; founder-operated stores are published by staff and make no verification claim.
create or replace function guard_store_verification() returns trigger
language plpgsql security definer set search_path = public as $$
declare staff boolean := (auth.uid() is null or is_staff());
begin
  if tg_op = 'INSERT' then
    if not staff then
      new.status := 'pending'; new.verification_tier := 0; new.published := false; new.featured := false;
      new.operation_mode := 'independent'; new.delivery_arrangement := 'platform_managed'; new.suspended_at := null; new.suspended_reason := null;
    end if;
  elsif not staff and (
       new.status is distinct from old.status or new.verification_tier is distinct from old.verification_tier
    or new.published is distinct from old.published or new.featured is distinct from old.featured
    or new.operation_mode is distinct from old.operation_mode or new.delivery_arrangement is distinct from old.delivery_arrangement
    or new.suspended_at is distinct from old.suspended_at or new.suspended_reason is distinct from old.suspended_reason
    or new.seller_type is distinct from old.seller_type) then
    raise exception 'only staff can change store approval, publishing or delivery settings';
  end if;
  if new.published and new.operation_mode = 'independent' and new.status <> 'verified' then
    raise exception 'an independent store must be verified before it is published';
  end if;
  return new;
end $$;

-- Opening a store goes through submit_seller_application(); direct inserts are for admins (founder stores).
drop policy stores_read on stores;
drop policy stores_insert on stores;
create policy stores_read   on stores for select using ((published and suspended_at is null) or is_store_member(id) or is_staff());
create policy stores_insert on stores for insert with check (is_admin());

-- Listings of unpublished or suspended stores are not public.
drop policy listings_read on listings;
create policy listings_read on listings for select using ((status = 'active' and store_is_public(store_id)) or is_store_member(store_id) or is_staff());
drop policy price_tiers_read on price_tiers;
create policy price_tiers_read on price_tiers for select using (exists (select 1 from listings l where l.id = listing_id and ((l.status = 'active' and store_is_public(l.store_id)) or is_store_member(l.store_id) or is_staff())));

-- Listing publishing: owners and managers of a PUBLIC (approved) store publish directly; nobody else can.
-- Admins can take any listing down ('rejected'); sellers cannot undo that.
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

-- ───────────────────────── seller applications ─────────────────────────
create table seller_applications (
  id              uuid primary key default gen_random_uuid(),
  applicant_id    uuid not null references profiles(id),
  store_id        uuid unique references stores(id),
  seller_type     seller_type not null,
  status          application_status not null default 'draft',
  full_name       text not null,
  phone           text not null,
  email           text,
  district_id     smallint not null references districts(id),
  upazila_id      smallint references upazilas(id),
  address         text not null,
  goods_location  text,
  store_name_bn   text not null,
  store_name_en   text,
  description     text,
  category_ids    smallint[] not null default '{}',
  origin_story    text,
  agreed_terms_at    timestamptz,
  agreed_delivery_at timestamptz,
  submitted_at    timestamptz,
  reviewed_by     uuid references profiles(id),
  reviewed_at     timestamptz,
  decision_note   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index seller_applications_applicant_idx on seller_applications(applicant_id);
create index seller_applications_status_idx on seller_applications(status, submitted_at);
create trigger seller_applications_updated before update on seller_applications for each row execute function set_updated_at();

create table application_events (
  id             bigint generated always as identity primary key,
  application_id uuid not null references seller_applications(id) on delete cascade,
  from_status    application_status,
  to_status      application_status not null,
  actor_id       uuid,
  note           text,
  created_at     timestamptz not null default now()
);
create index application_events_app_idx on application_events(application_id, id);

-- Identity documents and photos live in a PRIVATE storage bucket; this table only stores the path.
create table application_documents (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references seller_applications(id) on delete cascade,
  kind           text not null check (kind in ('identity', 'farm_photo', 'product_photo', 'shop_photo', 'trade_licence', 'institution_id', 'other')),
  storage_path   text not null,
  created_at     timestamptz not null default now()
);
create index application_documents_app_idx on application_documents(application_id);

create or replace function log_application_event(p_app uuid, p_from application_status, p_to application_status, p_note text) returns void
language sql security definer set search_path = public as $$
  insert into application_events (application_id, from_status, to_status, actor_id, note) values (p_app, p_from, p_to, auth.uid(), p_note)
$$;
revoke all on function log_application_event(uuid, application_status, application_status, text) from public, anon, authenticated;

create or replace function submit_seller_application(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_type seller_type; v_district smallint; v_upa smallint; v_store uuid; v_app uuid; v_slug text; v_cats smallint[];
begin
  if v_uid is null then raise exception 'login required'; end if;
  if exists (select 1 from seller_applications where applicant_id = v_uid and status in ('submitted', 'in_review', 'needs_info')) then
    raise exception 'you already have an application in progress';
  end if;
  v_type := (p ->> 'seller_type')::seller_type;
  v_district := (p ->> 'district_id')::smallint;
  v_upa := nullif(p ->> 'upazila_id', '')::smallint;
  if length(trim(coalesce(p ->> 'full_name', ''))) < 3 then raise exception 'full name is required'; end if;
  if coalesce(p ->> 'phone', '') !~ '^(\\+?88)?01[3-9][0-9]{8}$' then raise exception 'a valid mobile number is required'; end if;
  if length(trim(coalesce(p ->> 'store_name_bn', ''))) < 2 then raise exception 'store name is required'; end if;
  if length(trim(coalesce(p ->> 'address', ''))) < 6 then raise exception 'address is required'; end if;
  if not exists (select 1 from districts where id = v_district) then raise exception 'unknown district'; end if;
  if coalesce((p ->> 'agree_terms')::boolean, false) is not true or coalesce((p ->> 'agree_delivery')::boolean, false) is not true then raise exception 'you must accept the seller terms and the delivery arrangement'; end if;
  select coalesce(array_agg(x::smallint), '{}') into v_cats from jsonb_array_elements_text(coalesce(p -> 'category_ids', '[]'::jsonb)) x;

  v_slug := lower(regexp_replace(coalesce(nullif(trim(p ->> 'store_name_en'), ''), 'store'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  insert into stores (slug, type, seller_type, name_bn, name_en, description, district_id, upazila_id, address, sourcing_note)
  values (v_slug, case v_type when 'farmer_producer' then 'producer'::store_type else 'reseller'::store_type end, v_type,
          trim(p ->> 'store_name_bn'), nullif(trim(p ->> 'store_name_en'), ''), p ->> 'description', v_district, v_upa, trim(p ->> 'address'), p ->> 'origin_story')
  returning id into v_store;

  insert into seller_applications (applicant_id, store_id, seller_type, status, full_name, phone, email, district_id, upazila_id, address, goods_location,
                                   store_name_bn, store_name_en, description, category_ids, origin_story, agreed_terms_at, agreed_delivery_at, submitted_at)
  values (v_uid, v_store, v_type, 'submitted', trim(p ->> 'full_name'), p ->> 'phone', nullif(p ->> 'email', ''), v_district, v_upa, trim(p ->> 'address'), p ->> 'goods_location',
          trim(p ->> 'store_name_bn'), nullif(trim(p ->> 'store_name_en'), ''), p ->> 'description', v_cats, p ->> 'origin_story', now(), now(), now())
  returning id into v_app;
  perform log_application_event(v_app, null, 'submitted', null);
  return v_app;
end $$;
revoke all on function submit_seller_application(jsonb) from public, anon;
grant execute on function submit_seller_application(jsonb) to authenticated;

-- Applicant answers a "needs info" request: optional field updates, then back to the queue.
create or replace function resubmit_application(p_app uuid, p jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare a seller_applications%rowtype;
begin
  select * into a from seller_applications where id = p_app for update;
  if not found or a.applicant_id is distinct from auth.uid() then raise exception 'not allowed'; end if;
  if a.status <> 'needs_info' then raise exception 'only applications that need information can be resubmitted'; end if;
  update seller_applications set
    full_name = coalesce(nullif(trim(p ->> 'full_name'), ''), full_name), phone = coalesce(p ->> 'phone', phone), email = coalesce(p ->> 'email', email),
    address = coalesce(nullif(trim(p ->> 'address'), ''), address), goods_location = coalesce(p ->> 'goods_location', goods_location),
    description = coalesce(p ->> 'description', description), origin_story = coalesce(p ->> 'origin_story', origin_story),
    status = 'submitted', submitted_at = now() where id = p_app;
  update stores set description = coalesce(p ->> 'description', description), sourcing_note = coalesce(p ->> 'origin_story', sourcing_note) where id = a.store_id;
  perform log_application_event(p_app, 'needs_info', 'submitted', 'resubmitted by applicant');
end $$;
revoke all on function resubmit_application(uuid, jsonb) from public, anon;
grant execute on function resubmit_application(uuid, jsonb) to authenticated;

create or replace function withdraw_application(p_app uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a seller_applications%rowtype;
begin
  select * into a from seller_applications where id = p_app for update;
  if not found or a.applicant_id is distinct from auth.uid() then raise exception 'not allowed'; end if;
  if a.status not in ('draft', 'submitted', 'in_review', 'needs_info') then raise exception 'this application can no longer be withdrawn'; end if;
  update seller_applications set status = 'withdrawn' where id = p_app;
  perform log_application_event(p_app, a.status, 'withdrawn', null);
end $$;
revoke all on function withdraw_application(uuid) from public, anon;
grant execute on function withdraw_application(uuid) to authenticated;

-- Admin decisions. Approval needs real evidence (an identity document) and makes the store publishable.
create or replace function review_application(p_app uuid, p_action text, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare a seller_applications%rowtype; v_to application_status;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  select * into a from seller_applications where id = p_app for update;
  if not found then raise exception 'application not found'; end if;
  if p_action = 'start_review' then
    if a.status <> 'submitted' then raise exception 'only submitted applications can be taken into review'; end if;
    v_to := 'in_review';
  elsif p_action = 'request_info' then
    if a.status <> 'in_review' then raise exception 'start the review first'; end if;
    if coalesce(trim(p_note), '') = '' then raise exception 'say what information is needed'; end if;
    v_to := 'needs_info';
  elsif p_action = 'approve' then
    if a.status <> 'in_review' then raise exception 'start the review first'; end if;
    if not exists (select 1 from application_documents where application_id = p_app and kind = 'identity') then raise exception 'an identity document is required before approval'; end if;
    v_to := 'approved';
    update stores set status = 'verified', verification_tier = 2, published = true where id = a.store_id;
  elsif p_action = 'reject' then
    if a.status not in ('submitted', 'in_review', 'needs_info') then raise exception 'this application cannot be rejected now'; end if;
    if coalesce(trim(p_note), '') = '' then raise exception 'give a reason'; end if;
    v_to := 'rejected';
    update stores set status = 'rejected', published = false where id = a.store_id;
  else
    raise exception 'unknown action %', p_action;
  end if;
  update seller_applications set status = v_to, reviewed_by = auth.uid(), reviewed_at = now(), decision_note = coalesce(p_note, decision_note) where id = p_app;
  perform log_application_event(p_app, a.status, v_to, p_note);
end $$;
revoke all on function review_application(uuid, text, text) from public, anon;
grant execute on function review_application(uuid, text, text) to authenticated;

create or replace function suspend_store(p_store uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'give a reason'; end if;
  update stores set suspended_at = now(), suspended_reason = p_reason where id = p_store;
end $$;
create or replace function reinstate_store(p_store uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  update stores set suspended_at = null, suspended_reason = null where id = p_store;
end $$;
revoke all on function suspend_store(uuid, text), reinstate_store(uuid) from public, anon;
grant execute on function suspend_store(uuid, text), reinstate_store(uuid) to authenticated;

-- Founder-operated launch stores: created by an admin, published without any verification claim.
create or replace function create_founder_store(p_slug text, p_name_bn text, p_name_en text, p_type store_type, p_district smallint, p_upazila smallint default null, p_tagline text default null, p_sourcing_note text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  insert into stores (slug, type, name_bn, name_en, district_id, upazila_id, tagline_bn, sourcing_note, operation_mode, published)
  values (p_slug, p_type, p_name_bn, p_name_en, p_district, p_upazila, p_tagline, p_sourcing_note, 'founder_managed', true) returning id into v;
  return v;
end $$;
revoke all on function create_founder_store(text, text, text, store_type, smallint, smallint, text, text) from public, anon;
grant execute on function create_founder_store(text, text, text, store_type, smallint, smallint, text, text) to authenticated;

-- ───────────────────────── store story: sourcing, updates, follows ─────────────────────────
create table store_sources (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references stores(id) on delete cascade,
  name         text not null,
  source_type  store_source_type not null,
  district_id  smallint references districts(id),
  upazila_id   smallint references upazilas(id),
  relationship text not null check (relationship in ('we_grow', 'we_buy_from')),
  description  text,
  photo_url    text,
  created_at   timestamptz not null default now()
);
create index store_sources_store_idx on store_sources(store_id);

alter table listings add column source_id uuid references store_sources(id);
create or replace function listings_validate_source() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.source_id is not null and not exists (select 1 from store_sources where id = new.source_id and store_id = new.store_id) then
    raise exception 'the sourcing entry must belong to the same store';
  end if;
  return new;
end $$;
create trigger listings_validate_source_t before insert or update on listings for each row execute function listings_validate_source();

create table store_posts (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references stores(id) on delete cascade,
  kind          store_post_kind not null,
  title         text not null check (length(trim(title)) >= 3),
  body          text,
  listing_id    uuid references listings(id) on delete set null,
  source_id     uuid references store_sources(id) on delete set null,
  status        text not null default 'published' check (status in ('published', 'hidden')),
  hidden_reason text,
  hidden_by     uuid references profiles(id),
  published_at  timestamptz not null default now(),
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now()
);
create index store_posts_store_idx on store_posts(store_id, published_at desc);

create table store_post_media (
  id           bigint generated always as identity primary key,
  post_id      uuid not null references store_posts(id) on delete cascade,
  storage_path text not null,
  sort         smallint not null default 0
);
create index store_post_media_post_idx on store_post_media(post_id, sort);

create table store_follows (
  user_id    uuid not null references profiles(id) on delete cascade,
  store_id   uuid not null references stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

-- Updates are the seller's own words about their store: same-store links only, five a day at most, only staff hide or unhide.
create or replace function guard_store_post() returns trigger
language plpgsql security definer set search_path = public as $$
declare staff boolean := (auth.uid() is null or is_staff());
begin
  if new.listing_id is not null and not exists (select 1 from listings where id = new.listing_id and store_id = new.store_id) then raise exception 'the linked product must belong to this store'; end if;
  if new.source_id is not null and not exists (select 1 from store_sources where id = new.source_id and store_id = new.store_id) then raise exception 'the linked sourcing entry must belong to this store'; end if;
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
    if not staff then
      new.status := 'published'; new.hidden_reason := null; new.hidden_by := null; new.published_at := now();
      if (select count(*) from store_posts where store_id = new.store_id and created_at > now() - interval '24 hours') >= 5 then raise exception 'posting limit reached (5 updates per day)'; end if;
    end if;
  elsif not staff and (new.status is distinct from old.status or new.hidden_reason is distinct from old.hidden_reason or new.hidden_by is distinct from old.hidden_by) then
    raise exception 'only staff can hide or restore an update';
  end if;
  return new;
end $$;
create trigger store_posts_guard before insert or update on store_posts for each row execute function guard_store_post();

create or replace function guard_store_post_media() returns trigger
language plpgsql as $$
begin
  if (select count(*) from store_post_media where post_id = new.post_id) >= 6 then raise exception 'an update can have at most 6 photos'; end if;
  return new;
end $$;
create trigger store_post_media_guard before insert on store_post_media for each row execute function guard_store_post_media();

create or replace function hide_store_post(p_post uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'staff only'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'give a reason'; end if;
  update store_posts set status = 'hidden', hidden_reason = p_reason, hidden_by = auth.uid() where id = p_post;
end $$;
create or replace function restore_store_post(p_post uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'staff only'; end if;
  update store_posts set status = 'published', hidden_reason = null, hidden_by = null where id = p_post;
end $$;
revoke all on function hide_store_post(uuid, text), restore_store_post(uuid) from public, anon;
grant execute on function hide_store_post(uuid, text), restore_store_post(uuid) to authenticated;

-- ───────────────────────── RLS ─────────────────────────
alter table seller_applications  enable row level security;
alter table application_events   enable row level security;
alter table application_documents enable row level security;
alter table store_sources        enable row level security;
alter table store_posts          enable row level security;
alter table store_post_media     enable row level security;
alter table store_follows        enable row level security;

create policy applications_read on seller_applications for select using (applicant_id = auth.uid() or is_staff());   -- writes only through the RPCs above
create policy app_events_read   on application_events for select using (exists (select 1 from seller_applications a where a.id = application_id and (a.applicant_id = auth.uid() or is_staff())));
create policy app_docs_read     on application_documents for select using (exists (select 1 from seller_applications a where a.id = application_id and (a.applicant_id = auth.uid() or is_staff())));
create policy app_docs_insert   on application_documents for insert with check (exists (select 1 from seller_applications a where a.id = application_id and a.applicant_id = auth.uid() and a.status in ('draft', 'submitted', 'in_review', 'needs_info')));
create policy app_docs_delete   on application_documents for delete using (exists (select 1 from seller_applications a where a.id = application_id and a.applicant_id = auth.uid() and a.status in ('draft', 'needs_info')));

create policy store_sources_read  on store_sources for select using (store_is_public(store_id) or is_store_member(store_id) or is_staff());
create policy store_sources_write on store_sources for all using (is_store_member(store_id, true) or is_admin()) with check (is_store_member(store_id, true) or is_admin());

create policy store_posts_read   on store_posts for select using ((status = 'published' and store_is_public(store_id)) or is_store_member(store_id) or is_staff());
create policy store_posts_insert on store_posts for insert with check ((is_store_member(store_id, true) and store_is_public(store_id)) or is_admin());
create policy store_posts_update on store_posts for update using (is_store_member(store_id, true) or is_admin()) with check (is_store_member(store_id, true) or is_admin());
create policy store_posts_delete on store_posts for delete using (is_store_member(store_id, true) or is_admin());

create policy store_post_media_read  on store_post_media for select using (exists (select 1 from store_posts p where p.id = post_id and ((p.status = 'published' and store_is_public(p.store_id)) or is_store_member(p.store_id) or is_staff())));
create policy store_post_media_write on store_post_media for all using (exists (select 1 from store_posts p where p.id = post_id and (is_store_member(p.store_id, true) or is_admin())))
                                                              with check (exists (select 1 from store_posts p where p.id = post_id and (is_store_member(p.store_id, true) or is_admin())));
create policy store_follows_own on store_follows for all using (user_id = auth.uid()) with check (user_id = auth.uid());
