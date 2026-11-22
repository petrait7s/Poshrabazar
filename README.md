# PosraBazar · পসরাবাজার

> **Pivot in progress (branch `pivot/sylhet-marketplace`).** A community marketplace for Sylhet's farmers, producers, student entrepreneurs and buyers. See `docs/PIVOT_STRATEGY.md`. The previous concept is preserved on `main` and in tag `v0-posrabazar-concept`.

Next.js (App Router) + TypeScript + Tailwind. Fonts: Inter + Tiro Bangla (via `next/font`).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Structure
- `src/data/` — all demo data (catalog, sellers, prices, knowledge, software). Replace with API calls later.
- `src/components/` — Header, Footer, SearchBar, ProductCard, Price, VerifiedBadge, ProductExplorer (filters), dashboard shell, charts.
- `src/app/` — routes: marketplace, category, product, seller, wholesale, search, knowledge, market-intelligence, market-prices, business-solutions, login/register, cart, checkout, account, seller/register, seller/dashboard, admin.

## Database
Supabase schema, RLS and seed live in `supabase/` — see `supabase/README.md`. The frontend still reads `src/data` until it is wired to Supabase.

## Demo vs production
The website is still a **frontend prototype**: all products, stores, prices and orders come from `src/data` (demo values), and the cart, wishlist, language choice and demo login live in `localStorage`. Checkout, store registration and the seller/admin dashboards validate input but **send nothing, place no order and take no payment**; only cash on delivery is planned for launch. Product imagery is illustration and a placeholder for real photography. Real accounts, orders and money handling arrive with the Supabase integration (Phase 1).

Deferred pages (Knowledge, Community, Wallet, Market Intelligence tools) are kept in `src/_deferred/` and are not routed.

## Tests
```bash
npm run db:test   # database logic: linked/own stock, parent/sub-orders, financials, rollbacks (needs PostgreSQL)
npm run build
```
