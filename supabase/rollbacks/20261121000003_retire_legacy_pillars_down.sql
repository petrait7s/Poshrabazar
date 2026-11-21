-- Reverts 20261121000003_retire_legacy_pillars.sql (structures only; data is not restored).
create type khata_type as enum ('given', 'received');

create table khata_entries (
  id           uuid primary key default gen_random_uuid(),
  seller_id    uuid not null references sellers(id) on delete cascade,
  party_name   text not null,
  type         khata_type not null,
  amount_paisa integer not null check (amount_paisa > 0),
  note         text,
  entry_date   date not null default current_date,
  created_at   timestamptz not null default now()
);
create index khata_seller_idx on khata_entries(seller_id, entry_date desc);
alter table khata_entries enable row level security;
create policy khata_own on khata_entries for all using (owns_seller(seller_id)) with check (owns_seller(seller_id));

create table demo_requests (
  id         uuid primary key default gen_random_uuid(),
  product    text not null check (product in ('PetraPOS', 'PetraPMS', 'PetraDMS')),
  name       text not null,
  phone      text not null,
  business   text not null,
  size       text,
  created_at timestamptz not null default now()
);
alter table demo_requests enable row level security;
create policy demo_insert on demo_requests for insert with check (true);
create policy demo_admin_read on demo_requests for select using (is_admin());
