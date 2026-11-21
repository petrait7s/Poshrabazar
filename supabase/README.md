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
| Retired | `khata_entries`, `demo_requests` (dropped by migration `20261121000003`) |

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


## Pivot schema (Phase 0)

Added next to the legacy tables by `20261121000001`–`3`; the legacy seller model stays until a Phase 1 cleanup. Every migration has a matching file in `rollbacks/`.

| Migration | Adds |
|---|---|
| `20261121000001_pivot_core` | `upazilas`, `user_roles`, `stores`, `store_members`, `producer_profiles`, delivery zones and pickup points, `listings` (supply / store offer, own / linked stock), `price_tiers`, append-only `stock_movements`, `stock_receive()` / `stock_adjust()` |
| `20261121000002_pivot_orders_finance` | `sub_orders`, `order_lines`, `fulfilments`, `commission_rules` (0% pilot), `line_financials` (immutable snapshot per line), append-only `ledger_entries`, `place_order_v2()`, `advance_fulfilment()`, `cancel_sub_order()`, `confirm_delivery()` |
| `20261121000003_retire_legacy_pillars` | drops `khata_entries`, `demo_requests` |

**Money safety.** The ledger records amounts owed per store on delivered orders. It is not a wallet: there are no balances for customers, and deliberately no top-up, withdrawal or payout functions. Payments other than cash on delivery are rejected by `place_order_v2()`.

**Audit trail.** `line_financials` stores gross, supplier payable, seller margin, commission, seller net, the rate and base used, and the rule id. Rules that produced a snapshot cannot be deleted. Stock numbers always equal the sum of `stock_movements`.

### Tests
```bash
npm run db:test        # needs PostgreSQL 15+ and rights to create databases (PGHOST/PGPORT/PGUSER)
```
Runs migrations on a scratch database, executes `tests/01`–`05`, verifies that rolling back migrations 3→1 restores the pre-pivot schema exactly (and that they re-apply), and loads `seed.sql`.
