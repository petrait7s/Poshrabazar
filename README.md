# PosraBazar · পসরাবাজার

Buy. Sell. Learn. Grow. — Next.js (App Router) + TypeScript + Tailwind. Fonts: Montserrat + Tiro Bangla (via `next/font`).

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
Everything is frontend-only. Prices, sellers, stock, reviews, orders, articles and dashboard numbers are **demo values**.
Cart, wishlist, language and demo login live in `localStorage`. Checkout, seller registration, price alerts and demo requests
validate input but **send nothing, place no order and take no payment**. Product imagery is vector illustration — swap in photography.
Source of truth: *PosraBazar Core Idea v1.0*.
