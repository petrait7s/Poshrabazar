# PosraBazar database (Supabase / PostgreSQL)

```
supabase/
  migrations/20261120000001_schema.sql          tables, enums, indexes
  migrations/20261120000002_security_logic.sql  triggers, place_order(), views, Row Level Security
  seed.sql                                      GENERATED demo data (8 divisions, 64 districts, products, sellers, offers, prices, articles)
```

## Set up
1. Create a project at supabase.com.
2. Apply migrations, either:
   - **SQL editor:** run the two migration files in order, then `seed.sql`; or
   - **CLI:** `supabase link --project-ref <ref>` then `supabase db push` (and run `seed.sql` in the SQL editor).
3. Copy `.env.example` to `.env.local` and fill in the URL and anon key (Settings → API).
4. Make yourself admin (SQL editor): `update profiles set role = 'admin' where phone = '01XXXXXXXXX';`
5. Auth → Providers: enable **Phone** and connect an SMS provider (Twilio etc.) for OTP login.

Regenerate the seed after editing `src/data`: `npm run db:seed:generate`.

## Model
| Area | Tables |
|---|---|
| Geography | `divisions`, `districts`, `seller_coverage` |
| People | `profiles` (1:1 `auth.users`), `sellers` |
| Catalog | `categories`, `products`, `offers` (one product × many sellers, retail + wholesale price, MOQ, stock, grade), `wishlists` |
| Orders | `orders`, `order_items` (per-seller status), `order_events` (tracking timeline), `reviews` |
| Intelligence | `markets`, `market_prices` (daily), `price_alerts` |
| Knowledge | `article_categories`, `articles` |
| Tools | `khata_entries` (Khata Lite), `demo_requests` (PetraPOS/PMS/DMS leads) |

Money is integer paisa. Frontend shows `paisa / 100`.

## Read views (use these from the app)
- `offer_listing`: one row per active offer with seller, district, division, verification and rating. Filter by `division_id` / `district_id` for area-based buying.
- `product_cards`: lowest retail/wholesale price and seller count per product.
- `market_price_daily`: per-product daily average, low, high for trend charts.
- `seller_product_ratings`, `seller_ratings`.

## Rules enforced in the database
- **Orders only via `place_order(...)`.** Prices, stock, MOQ and seller status are re-read server-side; the client cannot set a price. Only `cod` is enabled (bKash/Nagad are rejected until a licensed gateway is wired).
- `cancel_order_item(id)` lets a buyer cancel before shipping; stock is restored.
- Order lines move forward only: placed → ready → shipped → delivered (or cancelled early). The order status rolls up from its lines.
- **Reviews:** only the buyer, only after delivery, one per order line (product × seller).
- **Verification:** only admins/agents can verify sellers. New listings are forced to `pending` until moderated; sellers can pause/resume but not self-approve.
- **Roles:** users self-pick buyer/seller only; `admin`/`agent` need an admin to grant. Role changes by non-admins are blocked.
- RLS is on for every table. Public can read catalog, prices, published articles and reviews; personal data is owner-only.

## Not in this schema yet
Seed contains no users, orders or reviews (they need real `auth.users`). Payment gateway tables, delivery-zone pricing, SMS/WhatsApp notifications and image storage buckets are next.
