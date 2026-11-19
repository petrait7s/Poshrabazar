-- PosraBazar core schema (Supabase / PostgreSQL 15+)
-- Money is stored as integer paisa (1 taka = 100 paisa). Never floats.

create extension if not exists pgcrypto;

-- ───────────────────────── enums ─────────────────────────
create type user_role           as enum ('buyer', 'seller', 'admin', 'agent');
create type seller_kind         as enum ('farmer', 'farm_owner', 'wholesaler', 'aratdar', 'shopkeeper');
create type verification_status as enum ('pending', 'verified', 'rejected');
create type listing_status      as enum ('pending', 'active', 'paused', 'rejected');
create type price_mode          as enum ('retail', 'wholesale');
create type payment_method      as enum ('cod', 'bkash', 'nagad');
create type payment_status      as enum ('unpaid', 'paid', 'refunded');
create type order_status        as enum ('placed', 'ready', 'shipped', 'delivered', 'cancelled');
create type article_status      as enum ('draft', 'published');
create type alert_direction     as enum ('below', 'above');
create type khata_type          as enum ('given', 'received');

-- ───────────────────────── helpers ─────────────────────────
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ───────────────────────── geography ─────────────────────────
create table divisions (
  id      smallint primary key,
  name_bn text not null unique,
  name_en text not null unique
);

create table districts (
  id          smallint primary key,
  division_id smallint not null references divisions(id),
  name_bn     text not null unique
);
create index districts_division_idx on districts(division_id);

-- ───────────────────────── users ─────────────────────────
-- One profile per auth.users row (created by trigger in the next migration).
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text unique,
  role        user_role not null default 'buyer',
  district_id smallint references districts(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();

create table sellers (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references profiles(id) on delete set null,   -- null for seeded demo sellers
  slug            text not null unique,
  name_bn         text not null,
  name_en         text,
  kind            seller_kind not null,
  description     text,
  district_id     smallint not null references districts(id),
  address         text,
  serves_nationwide boolean not null default false,
  verification    verification_status not null default 'pending',
  verified_at     timestamptz,
  verified_by     uuid references profiles(id),                      -- Sathi agent or admin
  since_year      smallint,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index sellers_district_idx on sellers(district_id);
create index sellers_owner_idx on sellers(owner_id);
create trigger sellers_updated before update on sellers for each row execute function set_updated_at();

-- Which divisions a seller delivers to (in addition to their own district).
create table seller_coverage (
  seller_id   uuid not null references sellers(id) on delete cascade,
  division_id smallint not null references divisions(id),
  primary key (seller_id, division_id)
);

-- ───────────────────────── catalog ─────────────────────────
create table categories (
  id      smallint generated always as identity primary key,
  slug    text not null unique,
  name_bn text not null,
  name_en text not null,
  blurb   text,
  sort    smallint not null default 0
);

create table products (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  category_id   smallint not null references categories(id),
  name_bn       text not null,
  name_en       text,
  unit_bn       text not null,                 -- কেজি, পিস, ডজন ...
  description   text,
  origin        text,
  season        text,
  moq_wholesale numeric(12,2) not null default 1 check (moq_wholesale > 0),
  image_url     text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index products_category_idx on products(category_id) where active;
create trigger products_updated before update on products for each row execute function set_updated_at();

-- One product, many sellers: this table is the heart of the marketplace.
create table offers (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  seller_id       uuid not null references sellers(id) on delete cascade,
  retail_paisa    integer not null check (retail_paisa > 0),
  wholesale_paisa integer not null check (wholesale_paisa > 0),
  moq             numeric(12,2) not null default 1 check (moq > 0),
  stock_qty       numeric(12,2) not null default 0 check (stock_qty >= 0),
  grade           text check (grade in ('A', 'B', 'C')),
  origin          text,
  status          listing_status not null default 'pending',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (product_id, seller_id),
  check (wholesale_paisa <= retail_paisa)
);
create index offers_product_idx on offers(product_id) where status = 'active';
create index offers_seller_idx on offers(seller_id);
create trigger offers_updated before update on offers for each row execute function set_updated_at();

create table wishlists (
  user_id    uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ───────────────────────── orders ─────────────────────────
create table orders (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique default ('PB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  buyer_id        uuid not null references profiles(id),
  status          order_status not null default 'placed',
  payment_method  payment_method not null default 'cod',
  payment_status  payment_status not null default 'unpaid',
  subtotal_paisa  integer not null check (subtotal_paisa >= 0),
  delivery_paisa  integer not null default 0 check (delivery_paisa >= 0),
  total_paisa     integer not null check (total_paisa >= 0),
  ship_name       text not null,
  ship_phone      text not null,
  ship_address    text not null,
  ship_district_id smallint not null references districts(id),
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index orders_buyer_idx on orders(buyer_id, created_at desc);
create trigger orders_updated before update on orders for each row execute function set_updated_at();

-- Each line is fulfilled by one seller and has its own status.
create table order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders(id) on delete cascade,
  offer_id         uuid references offers(id) on delete set null,
  product_id       uuid not null references products(id),
  seller_id        uuid not null references sellers(id),
  mode             price_mode not null,
  qty              numeric(12,2) not null check (qty > 0),
  unit_price_paisa integer not null check (unit_price_paisa > 0),
  line_total_paisa integer not null check (line_total_paisa > 0),
  status           order_status not null default 'placed',
  updated_at       timestamptz not null default now()
);
create index order_items_order_idx on order_items(order_id);
create index order_items_seller_idx on order_items(seller_id, status);
create trigger order_items_updated before update on order_items for each row execute function set_updated_at();

create table order_events (
  id            bigint generated always as identity primary key,
  order_item_id uuid not null references order_items(id) on delete cascade,
  status        order_status not null,
  note          text,
  created_at    timestamptz not null default now()
);
create index order_events_item_idx on order_events(order_item_id, created_at);

-- Reviews belong to one delivered order line = one product × one seller.
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references order_items(id) on delete cascade,
  product_id    uuid not null references products(id),
  seller_id     uuid not null references sellers(id),
  buyer_id      uuid not null references profiles(id),
  rating        smallint not null check (rating between 1 and 5),
  body          text,
  created_at    timestamptz not null default now()
);
create index reviews_pair_idx on reviews(product_id, seller_id);

-- ───────────────────────── market intelligence ─────────────────────────
create table markets (
  id          smallint generated always as identity primary key,
  slug        text not null unique,
  name_bn     text not null,
  district_id smallint not null references districts(id)
);

create table market_prices (
  id              bigint generated always as identity primary key,
  product_id      uuid not null references products(id) on delete cascade,
  market_id       smallint not null references markets(id) on delete cascade,
  price_date      date not null,
  retail_paisa    integer not null check (retail_paisa > 0),
  wholesale_paisa integer not null check (wholesale_paisa > 0),
  reported_by     uuid references profiles(id),                    -- agent/admin who entered it
  unique (product_id, market_id, price_date)
);
create index market_prices_lookup_idx on market_prices(product_id, price_date desc);

create table price_alerts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  product_id    uuid not null references products(id) on delete cascade,
  direction     alert_direction not null,
  target_paisa  integer not null check (target_paisa > 0),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index price_alerts_user_idx on price_alerts(user_id);

-- ───────────────────────── knowledge hub ─────────────────────────
create table article_categories (
  id      smallint generated always as identity primary key,
  slug    text not null unique,
  name_bn text not null,
  name_en text not null
);

create table articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  category_id  smallint not null references article_categories(id),
  title_bn     text not null,
  title_en     text,
  excerpt      text,
  body         jsonb not null default '[]'::jsonb,                 -- array of paragraphs
  author       text,
  read_minutes smallint,
  sponsored    boolean not null default false,                     -- must be labelled in the UI
  status       article_status not null default 'draft',
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index articles_published_idx on articles(published_at desc) where status = 'published';
create trigger articles_updated before update on articles for each row execute function set_updated_at();

-- ───────────────────────── Khata Lite (free seller ledger) ─────────────────────────
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

-- ───────────────────────── software leads ─────────────────────────
create table demo_requests (
  id         uuid primary key default gen_random_uuid(),
  product    text not null check (product in ('PetraPOS', 'PetraPMS', 'PetraDMS')),
  name       text not null,
  phone      text not null,
  business   text not null,
  size       text,
  created_at timestamptz not null default now()
);
