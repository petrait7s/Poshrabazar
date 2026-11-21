# Pivot Strategy — Sylhet-first Community Marketplace

Status: **proposal, awaiting approval. No code has been changed.**
Scope of this document: audit of the current project, new product vision, roles, workflows, architecture, database changes, UI/UX structure, and a phased roadmap.

---

## 0. Executive summary

- The current project is a **polished frontend prototype**, not a working product. All 29 routes run on hard-coded demo data in `src/data/`. There is **no Supabase client in the app**, **no real authentication** (the "login" writes a fake user to `localStorage`), **no real orders, no payments, no uploads**. The Supabase schema and security rules exist and pass tests on PostgreSQL 16, but nothing connects to them yet.
- That is good news for a pivot: very little real business logic is locked in. About **3,300 lines of TypeScript** and **~1,800 lines of SQL** exist.
- Roughly **half of the code is reusable** (layout shell, UI primitives, filters, cart mechanics, dashboards shell, location picker, schema patterns, RLS patterns). The **brand, visual style, product taxonomy, fee logic, and several whole pillars** conflict with the new concept and should be replaced or removed.
- The biggest structural gap is the thing the new concept is built on: **sourcing**. Today a "seller" simply lists a product at a price. The new model needs a **supply chain**: producers list supply, student entrepreneurs (resellers) source it into their own stores, customers buy from stores, and the money and stock must flow correctly through all three. The existing schema has no concept of this.
- Recommendation: keep the Next.js + Supabase direction, create a **new long-lived branch** for the pivot, tag the current `main` as the old concept, and execute in four phases starting with real authentication, a store/producer split, upazila-level location, and COD orders with seller sub-orders.

### Assumptions I am making (please correct any that are wrong)
1. The product name and brand may change. The working brand name is **PosraBazar** (decision D6, now approved).
2. One person can hold several roles (a student can be a customer **and** a reseller; a producer can also sell retail).
3. Phase 1 uses **Cash on Delivery** only. Online payment comes after the platform is live with real users.
4. We are not holding warehouse stock. Every product belongs to a seller's own listing.
5. Bangla is the primary language; English is secondary.
6. Team is small (1–3 developers), so I prefer managed services (Supabase) over custom infrastructure.

---

## 0.1 Approved decisions (recorded before Phase 0)

The product owner approved the strategy and decided as follows. These are now the source of truth.

| # | Decision | What it means in practice |
|---|---|---|
| D1 | **Both linked and own-stock reseller modes in the MVP** | In *linked* mode the producer stays responsible for stock and fulfilment and the student reseller sets their own selling price (never below the supplier's price). In *own-stock* mode the seller holds and manages stock. Stock is only ever changed through an append-only movement log, and a producer's stock is shared by every reseller linked to it, so nothing can be oversold. Responsibilities are separate: the fulfilling store moves the fulfilment; the selling store owns the customer relationship and price. |
| D2 | **Producer/store-managed delivery inside defined zones, plus pickup points** | No platform logistics. Each store declares the zones it serves and its fee. Fulfilments carry a `method` and a `provider` column so a courier integration can be added later without redesign. |
| D3 | **Commission configurable per transaction type; promotional 0% pilot** | `commission_rules` holds rates as data (basis points, per transaction type, optional per category, with start/end dates). The pilot ships with 0% for *direct*, *reseller* and *wholesale* sales. The financial model treats the three separately. **No wallet and no holding of customer money is implemented**; the ledger only records what each party is owed on delivered orders. Anything that holds or moves money needs legal review first. |
| D4 | **Fonts: Noto Sans Bengali (Bengali) + Inter (English)** | Readability on mobile and desktop first. |
| D5 | **Brand: PosraBazar remains the working name; former co-branding removed** | Removed from the interface and documentation, except where technically necessary (a rollback script must recreate a legacy table constraint exactly). |
| D6 | **Existing pages** | **Keep and redesign:** Market Prices, Regional Products, Follow Stores. **Defer:** Knowledge, Community Feed, Wallet (code kept under `src/_deferred/`, out of routing and navigation). **Remove:** Business Solutions, Khata Lite. |

Additional working rules: preserve the prototype and its history (tag `v0-posrabazar-concept`, `main` untouched); keep migrations reversible where practical; keep every financial calculation auditable (immutable per-line snapshots recording the rule used, append-only ledger, no deletes of referenced rules); test linked stock, own-stock, parent/sub-orders and per-seller financials; no fake payment integrations and nothing that implies demo features are production-ready; apply the Deep Orange palette with accessible contrast.

### Phase 0 status

| Item | State |
|---|---|
| Decisions documented | Done (this section) |
| Branch `pivot/sylhet-marketplace` cut from the old `main` commit | Done |
| Tag `v0-posrabazar-concept` on the old `main` commit | Created locally; **the remote refused the tag push (HTTP 403)**, see the Phase 0 report |
| Design tokens, fonts, flat UI primitives | Done (`docs/DESIGN_SYSTEM.md`) |
| Business Solutions, Khata Lite removed; old fee/wallet UI removed; Knowledge/Community/Wallet deferred | Done |
| Final category taxonomy (7) | Done in `src/data/catalog.ts`; also seeded |
| Sylhet-division upazilas (41) | Done: `src/data/locations.ts`, seeded |
| Migrations 1–3 with rollbacks and tests | Done: `npm run db:test` |
| Real authentication, Supabase project, error tracking, photography | **Not started (Phase 1 / needs owner input)** |

---

## 1. Existing project audit

### 1.1 What actually exists

| Area | Current state | Real or demo |
|---|---|---|
| Framework | Next.js 16 App Router, TypeScript, Tailwind 3, Lucide. Deployed from `main` to Vercel. | Real |
| Pages | 29 routes: home, marketplace, categories, product, seller, wholesale, search, famous, knowledge (3), market intelligence/prices (3), business solutions (2), community, profile, login, register, cart, checkout, account (3), seller register, seller dashboard, admin | UI real, data demo |
| Data | 8 files in `src/data` (30 products, 25 sellers, ~80 offers, 64 districts, prices, articles, posts, wallet, fee rule) | Hard-coded |
| Auth | Form validates a phone and password, then stores a fake user in `localStorage` | **Demo only** |
| Cart / checkout | Works in the browser. Checkout validates and ends with a banner "no order was placed" | **Demo only** |
| Wallet / payments | Sample ledger; top-up and withdraw disabled | **Demo only** |
| Community | Follow, posts, image/video preview, likes, comments, all in `localStorage` | **Demo only** |
| Dashboards | Seller and admin dashboards with working buttons that change local state only | **Demo only** |
| Database | `supabase/` has 3 migrations (20 tables, enums, triggers, `place_order()` RPC, read views, RLS) and a generated seed | Written and tested on Postgres 16; **not connected** and not run on a real Supabase project |
| Location | Division → district only (8 divisions, 64 districts) | Real structure |
| Product imagery | Vector illustrations drawn in code | Placeholder |
| Fonts / brand | Montserrat + Tiro Bangla; navy, teal, gold; glass-card style | Brand-specific |

### 1.2 Reuse / modify / replace

**Reuse as-is or nearly as-is**
- Project skeleton: App Router layout, `next/font`, Tailwind config structure, `cn()`, CVA button pattern, Vercel deployment, `.env.example`.
- UI primitives: `Button`, `Input/Select/Field`, `Tabs`, `Breadcrumb`, `EmptyState`, `Skeleton`, `Stars`, `SectionHead`, toast system, `QtyStepper`.
- `ProductExplorer` filtering logic (category, price, verified, retail/wholesale toggle, sort, mobile filter sheet). Needs new filters but the structure is right.
- `AreaPicker` (modal + selects). Extend from 2 levels to 3 (division → district → upazila).
- `DashboardShell` / `Stat` / `Panel` / `StatusPill`: reusable for reseller, producer and admin dashboards.
- Cart state shape and `cartUtil.totals()`: good base; must be extended to group by store and compute sub-orders.
- Seed generator pattern (`scripts/generate-seed.ts`) and the test approach (real Postgres + role switching).
- Database patterns: RLS helper functions, guard triggers, `place_order()` server-side pricing, order status roll-up trigger, money as integer paisa, read views with `security_invoker`.

**Modify**
- `sellers` → split into **stores** (customer-facing shop) and **producer profiles** (supply side).
- `offers` → becomes **listings** with an owner store, optional **source listing**, price tiers, quantity, harvest date and seasonality.
- `orders / order_items` → add a **sub-order** layer per store and a **fulfilment** layer for sourced items.
- `profiles.role` (single value) → multi-role membership.
- `seller_kind` enum → replaced by producer and store types.
- Cart, checkout, product page, seller page: extend to show origin upazila, harvest date, quantity tiers, "sold by store X, supplied by producer Y".
- Search and category taxonomy: rebuild around the new product categories (fruit, rice, vegetables, fresh fish, shutki, regional products).
- Admin dashboard: becomes a real desktop console (verification queue, disputes, settlements).

**Replace or remove**
- **Visual identity**: navy/teal/gold glass style, alpona/kantha/flower ornaments, Tiro Bangla headlines. Replace with the orange/cream system you specified.
- **Hero art, illustration set, line-art farmer**: replace with photography.
- **"Four pillars" structure** (Marketplace, Knowledge Hub, Market Intelligence, Business Solutions). The new product is one marketplace with a supply network; see 1.3.
- **Business Solutions pillar** (the old POS / property / distribution software pages), **Khata Lite**, and the software demo-request form: unrelated to the new concept. Removed from the interface in Phase 0; their database tables are dropped by migration 3 (with a rollback).
- **Platform fee rule** (1.5% above ৳999): replace with a commission model per transaction type (section 5).
- **Seed data and `src/data` catalogue**: replace with Sylhet-focused data.
- Hard-coded copy tied to the old concept: the former parent-company co-branding, the "Core Idea v1.0" wording and old demo notices.

### 1.3 Features that conflict with, or are outside, the new concept

| Existing feature | Verdict | Reason |
|---|---|---|
| Knowledge Hub (articles) | **Defer** | Not core to launch. Could return later as seller education ("how to source and price"). |
| Market prices / intelligence | **Keep, repurpose** | Useful for resellers deciding what to source and at what margin. Phase 3+. |
| Community feed (follow, posts) | **Defer** | Valuable later for store storytelling, but it adds moderation load. Not needed to prove the marketplace. Keep follow on stores as a light feature. |
| Wallet | **Replace** | Becomes the seller **earnings/settlement ledger**; a customer wallet is optional later. |
| "Famous products" page | **Keep, rename** | Maps well to "Regional & seasonal products". |
| Verified badge, retail/wholesale toggle, seller comparison table | **Keep** | Directly useful. |
| Seller registration | **Replace** | Needs three separate onboarding flows: reseller, producer, business buyer. |

### 1.4 What is missing for the new marketplace

1. Real authentication (phone OTP) and persistent accounts.
2. **Upazila-level location** and "near me" discovery.
3. **Producer onboarding** and producer-facing tools (listings, quantities, MOQ, seasons).
4. **Store creation** for students/resellers with their own storefront URL.
5. **Sourcing workflow**: discover producers, request/quote, link a producer's product into a store.
6. **Retail and wholesale price tiers by quantity** (the current model has exactly two prices).
7. **Stock ownership and synchronisation** between producer and reseller listings.
8. **Parent order → store sub-orders → fulfilment lines**, with separate status and settlement per store.
9. **Delivery model**: zones, fees, pickup points, perishable handling.
10. **Payments and settlements**: gateway, escrow/hold until delivery, payouts, commission, COD reconciliation.
11. **Verification workflow** with evidence, plus reviews tied to delivered orders.
12. **Disputes and refunds.**
13. **Real image storage** and product photography flow.
14. Notifications (SMS / WhatsApp / push).
15. Production-grade admin console.
16. Search that works for Bangla text.

---

## 2. New product vision and scope

### 2.1 Vision
A community-driven, multi-vendor marketplace for Bangladesh's agricultural and regional products, launching in **Sylhet**. It lets farmers and producers sell directly, and lets **students and local entrepreneurs run their own stores** by sourcing from producers in their own upazila, with almost no startup capital. Customers get fresher, more traceable products with transparent origin and price; producers get access to more buyers; students earn.

### 2.2 What it is, and is not
- It **is** a hybrid marketplace with three transaction types (producer→customer, producer→reseller→customer, supplier→wholesaler/retailer) and both retail and wholesale pricing.
- It **is not** a grocery-delivery app, and the platform **does not own warehouse inventory**.

### 2.3 Launch scope (MVP, Sylhet)
- Sylhet division, with focus on Sylhet district's 13 upazilas, plus Moulvibazar for tea/regional goods.
- Starter categories: seasonal fruit, rice and grains, vegetables, fresh fish, shutki, regional specialties.
- Roles live at launch: customer, reseller (store owner), producer, admin. Business buyers are customers with a wholesale flag.
- Payments at launch: COD. Online payment after Phase 2.
- Delivery at launch: producer- or store-arranged delivery inside defined zones plus pickup points. No platform-run logistics yet.

### 2.4 Non-goals for the MVP
- Platform-owned warehouses or fleet.
- Nationwide coverage.
- Knowledge Hub, Business Solutions software, social feed.
- Customer wallet and stored balances.
- Native mobile apps (a fast PWA first).

### 2.5 Success measures (suggested)
Number of active stores and producers per upazila, share of orders that are producer→reseller→customer, repeat-customer rate, on-time delivery rate, dispute rate, and gross order value per store.

---

## 3. Roles and permissions

One account can hold several **roles**. Roles grant capabilities; **store membership** grants access to a specific store.

| Role | Can do | Cannot do |
|---|---|---|
| **Customer** | Browse by location; buy retail; compare stores and origins; order, track, review delivered orders; save favourites | Sell; see wholesale tiers unless approved as business buyer |
| **Business buyer** (customer + flag) | Everything a customer can, plus see and buy wholesale tiers and MOQ; request quotes | Sell without a store |
| **Reseller** (student entrepreneur) | Create and run a store; find producers; send sourcing requests; list sourced products; set retail/wholesale prices above the supply price; manage orders, inventory, customers, earnings | See other stores' data; change producer's price or stock |
| **Producer / supplier** | Create a producer profile; list own products with quantity, MOQ, price tiers, harvest date, season; accept sourcing requests; sell direct; fulfil orders; see settlements | Edit a reseller's store listing or retail price |
| **Admin** | Verify users and stores; moderate products and stores; manage orders, payments, commissions, disputes, settlements; regional dashboards | Edit financial ledger entries directly (adjustments only through logged operations) |
| **Regional agent** (recommended, later) | Field-verify producers in an upazila; assist onboarding | Access financial settings |

**Verification tiers** (shown as badges): (1) phone verified, (2) identity or trade licence checked, (3) field-visited by an agent. Higher tiers unlock higher order limits and visibility ranking.

---

## 4. Business workflows

### 4.1 Producer → Customer (direct)
1. Producer lists product: category, origin upazila, quantity available, price tiers, MOQ, harvest date, season window.
2. Customer finds it by location or category, chooses quantity, orders.
3. Order creates a sub-order for the producer's store. Producer confirms, packs, hands to delivery or pickup point.
4. Customer receives, confirms (or auto-confirms after a window). Settlement released to the producer minus commission.

### 4.2 Producer → Reseller → Customer
1. **Discover**: reseller browses producers in their upazila (filters: product, quantity, season, verification level).
2. **Link a product into the store** in one of two modes:
   - **Linked mode (recommended for MVP).** The store listing references the producer's listing. Stock is the producer's stock (synchronised). The reseller sets only the **retail price** (must be ≥ the producer's supply price). When the customer orders, the producer fulfils; the reseller never holds stock. Good for students with no capital.
   - **Own-stock mode.** The reseller bought goods offline (or through a wholesale order), holds the stock and manages quantity themselves. Needed for resellers who aggregate and repack.
3. Customer orders from the **store**. The order contains a store sub-order and, for linked items, a **fulfilment line** assigned to the producer.
4. Money split per line: producer gets supply price; reseller gets margin; platform takes commission; each is a separate ledger entry released after delivery confirmation.
5. If the producer cannot fulfil (stock out), the line is flagged, the reseller is notified, and the customer is offered a substitute or refund. Stock sync should reduce these cases.

**Sourcing requests (optional path inside 4.2)**: when a reseller needs a custom quantity or a product the producer has not listed, they send a request (product, quantity, delivery date, target price). The producer replies with a quote. Accepted quotes become a purchase order that can feed own-stock listings.

### 4.3 Supplier → Retailer / Wholesaler
1. Business buyer filters by location, product and quantity; the product page shows **price tiers** (for example 1–9 kg retail, 10–49 kg, 50+ kg wholesale) and MOQ.
2. Larger orders can go straight to checkout, or be negotiated through a quote.
3. Fulfilment, delivery and settlement work as in 4.1, with higher-value delivery rules (scheduled pickup, partial payment later).

### 4.4 Order structure (applies to all three)
```
Parent order (customer, address, payment)
 └── Store sub-order (one per store; own status and settlement)
      └── Order items (price at time of order)
           └── Fulfilment line (who ships it: store itself or a linked producer)
```
Each level has its own status, so one customer checkout can contain items from several stores that ship separately, and one failed item does not cancel the whole order.

### 4.5 Money flow and settlement
- Customer pays COD or online. For online payment the platform's gateway account receives the full amount (or the platform holds funds until delivery).
- A **double-entry ledger** records: customer payment, producer payable, reseller payable, platform commission, refunds, payout.
- Funds become **payable after delivery confirmation** plus a short dispute window; payouts go to bKash/Nagad/bank on a fixed schedule (for example twice weekly).
- **COD risk**: courier or seller collects cash; the platform's commission must be recovered from later payouts or by collecting it from the store's balance. Plan a seller deposit/negative-balance rule.
- **Commission** (proposal, configurable per transaction type and category): lower on producer→customer, split model on reseller sales, lowest on large wholesale. I do not want to invent rates; see decision D3.

**Compliance warning.** Holding and splitting customer money on behalf of sellers may require a payment-service licence in Bangladesh. The safe route is a licensed gateway/aggregator that supports marketplace settlements, or manual settlement at the start. Legal advice is needed before Phase 3.

### 4.6 Delivery
- Geography drives delivery: **delivery zones** (by upazila groups) with fee tables; **pickup points** (a shop, hub or the reseller's location) to cut cost.
- Perishables (fresh fish, soft fruit) need **delivery windows** and same-day or next-day limits; dry goods (rice, shutki) can ship further.
- Every sub-order records fulfilment method: producer delivers, store delivers, pickup, or third-party courier (later).
- Split shipments: show the customer one order with several parcels and separate delivery fees if they come from different places.

### 4.7 Trust and quality
- **Verification** tiers (section 3) with an evidence queue for admins.
- **Product facts on every listing**: origin upazila, harvest or catch date, grade, season window, weight/unit, photos.
- **Reviews only from delivered orders**, shown for the store and the product, with a producer-quality score separate from the reseller-service score for linked items.
- **Disputes**: customer raises a case within a window; admin mediates; outcomes are refund, partial refund, replacement or rejection; ledger is adjusted through logged entries.
- **Freshness/expiry**: perishable listings auto-hide after a set time unless refreshed.

---

## 5. Updated application architecture

### 5.1 Principles
- One codebase, three **surfaces**: customer storefront (mobile-first), seller workspace (mobile-first: reseller and producer), admin console (desktop-first).
- Managed backend: **Supabase** (Postgres, Auth, Storage, Row Level Security). Keep NestJS out until there is a clear need (earlier decision "Option B" still holds).
- All money and stock changes happen in **database functions or server routes**, never in the browser.

### 5.2 Logical modules
1. **Identity**: phone OTP login, profiles, roles, verification requests.
2. **Stores and producers**: store profile, store members, producer profile, supplier relationships.
3. **Catalogue**: canonical products and categories; **listings** (producer supply and store offers).
4. **Sourcing**: supplier discovery, requests, quotes, product links and stock sync.
5. **Orders**: parent orders, sub-orders, items, fulfilment lines, events.
6. **Payments and ledger**: payments, commission rules, ledger, payouts, refunds.
7. **Delivery**: zones, fees, pickup points, fulfilment tracking.
8. **Trust**: reviews, disputes, verification evidence.
9. **Location and search**: upazila hierarchy, distance, Bangla full-text search.
10. **Admin**: queues, moderation, reporting.
11. **Notifications**: SMS/WhatsApp/in-app events.

### 5.3 Technical choices
| Concern | Recommendation |
|---|---|
| Frontend | Keep Next.js App Router; Server Components for catalogue pages (SEO, speed on low-end phones); client components for cart and dashboards |
| Auth | Supabase phone OTP (needs an SMS provider that sends to Bangladesh numbers); email optional |
| Data access | Supabase client with RLS for reads; **Postgres functions (RPC)** for place order, link listing, change status, settle |
| Payments | Server route handlers for gateway callbacks and webhooks (SSLCommerz / aamarPay / bKash PGW, to be chosen); signature verification; idempotent handlers |
| Images | Supabase Storage with resized variants; mobile upload from camera; moderation queue |
| Search | Start with Postgres full-text plus trigram for Bangla/English; move to a search service only if needed |
| Location | Upazila table with latitude/longitude; browser geolocation → nearest upazila; PostGIS optional later |
| Background jobs | Supabase scheduled functions: expire perishable listings, auto-confirm deliveries, payout batches |
| Performance | PWA, image optimisation, pagination, budget for 3G-class connections |
| Observability | Error tracking, audit log table for admin and ledger actions |
| Environments | Local → preview (Vercel + Supabase branch/project) → production |

### 5.4 Repository and branching strategy
- Tag current `main` as `v0-posrabazar-concept` so nothing is lost.
- Do the pivot on a long-lived `pivot/sylhet-marketplace` branch with Vercel preview deployments; merge to `main` only when Phase 1 is usable.
- Remove old-concept pages in a dedicated, clearly named change so history stays readable.

---

## 6. Database changes

### 6.1 Summary
Current schema: 20 tables. Roughly 8 tables are kept, 6 are modified, 6 are removed or deferred, and about 14 new tables are added. The security patterns carry over; the policies themselves must be rewritten for multi-role and store membership.

### 6.2 Keep
`divisions`, `districts`, `categories` (new rows), `markets`, `market_prices`, `price_alerts` (Phase 3+), `reviews` (re-pointed), `wishlists`, `order_events`.

### 6.3 Modify
| Table | Change |
|---|---|
| `profiles` | Remove single `role`; add `user_roles` (user, role) and `is_business_buyer`; add `upazila_id`, preferred language |
| `sellers` → `stores` | Type (`reseller`, `producer`, `wholesaler`, `retailer`), slug, description, logo/cover, `upazila_id`, status, verification tier; owner moved to `store_members` |
| (new) `producer_profiles` | Producer kind (farmer, fisher, orchard owner, manufacturer, cooperative), farm/area details, certifications, upazila |
| `products` | Becomes **canonical catalogue** (name, category, unit, variety/grade options, photos, perishable flag, shelf-life days). No price here |
| `offers` → `listings` | Owner store, `kind` (`supply` or `store_offer`), `source_listing_id` (nullable), `stock_mode` (`own` or `linked`), quantity, MOQ, harvest/catch date, season from/to, origin upazila, grade, status. Retail price on store offers; supply price on producer listings |
| (new) `price_tiers` | `listing_id`, `min_qty`, `unit_price_paisa` — replaces the fixed retail/wholesale pair |
| `orders` | Parent order only: customer, address, upazila, payment method and status, totals |
| `order_items` | Belongs to a sub-order; price at time of order; `fulfilment_id` |
| `reviews` | Add target (store, producer) and dimension (product quality vs service) |
| `seller_kind` enum | Drop; replaced by store and producer types |

### 6.4 New tables
- Location: `upazilas` (with coordinates; seed all 13 Sylhet district upazilas plus Moulvibazar, Habiganj, Sunamganj), `delivery_zones`, `zone_upazilas`, `delivery_fee_rules`, `pickup_points`.
- Stores and relationships: `store_members` (user, store, role), `store_suppliers` (store ↔ producer relationship and agreed terms).
- Sourcing: `sourcing_requests`, `sourcing_quotes`, `listing_links` (store listing ↔ producer listing, margin rules), `stock_movements`.
- Orders: `sub_orders` (per store: status, subtotal, fees), `fulfilments` (who ships each item: store or producer, status, tracking).
- Money: `payments` (gateway reference, status, raw callback), `commission_rules` (by transaction type and category), `ledger_accounts` and `ledger_entries` (double-entry), `payouts`, `refunds`.
- Trust: `verification_requests` (+ evidence files), `disputes`, `dispute_messages`.
- Platform: `notifications`, `audit_log`, `product_images`.

### 6.5 Remove or defer
`khata_entries`, `demo_requests` (old pillar); the 1.5%-above-৳999 fee logic in `place_order()`; community tables if/when they were added. Knowledge `articles` can stay dormant.

### 6.6 Functions and rules to (re)write
- `place_order()` v2: validate stock per listing, resolve linked listings, price tiers by quantity, create parent order, sub-orders and fulfilments atomically; reserve stock.
- `confirm_delivery()`, `cancel_sub_order()`, `raise_dispute()`, `settle_sub_order()` (writes ledger entries), `link_listing()` (checks supply price floor), `sync_linked_stock()`.
- Roll-up triggers: fulfilment → sub-order → parent order status.
- RLS: store members manage their store's data; producers see fulfilments assigned to them; customers see their own orders; admins see all through audited functions; ledger tables are read-only to everyone except security-definer functions.

### 6.7 Migration approach
Because the database has never been run with real users, the cleanest path is **new migrations that restructure** the schema before first production use (no data to preserve), keeping the migration files that created the old tables for history. The seed generator is rewritten for Sylhet.

---

## 7. UI/UX structure

### 7.1 Design system changes
**Palette (as specified)**

| Token | Hex | Use |
|---|---|---|
| Primary deep orange | `#C2410C` | Primary buttons, links, key emphasis |
| Secondary orange | `#EA580C` | Hover, large accents, charts |
| Accent amber | `#F59E0B` | Badges, highlights, ratings |
| Background cream | `#FFFBF5` | Page background |
| Surface white | `#FFFFFF` | Cards, inputs |
| Text primary | `#292524` | Body and headings |
| Text secondary | `#78716C` | Captions, metadata |
| Border | `#E7E0D8` | Dividers and card borders |

**Contrast check (WCAG, calculated):**
- White on `#C2410C` = 5.18:1 → passes for normal text. **Use this for buttons with white text.**
- White on `#EA580C` = 3.56:1 → **fails for small text**; use only for large text, icons, or hover backgrounds, or place dark text on it.
- `#292524` on `#F59E0B` = 7.06:1 → good; use dark text on amber.
- `#C2410C` on cream = 5.02:1 → fine for links.
- `#78716C` on cream = 4.65:1 → passes, but just barely; keep secondary text ≥ 14px.
- Border `#E7E0D8` on cream = 1.27:1 → fine for decoration, but do not rely on it alone to separate interactive controls; add a hover or focus state.

**Style direction:** flat, clean, minimal. Remove glass/blur, ornament patterns and tinted glows. Cards: white surface, 1px warm border, small radius, subtle shadow on hover. Real photography, large product images, clear retail/wholesale price blocks.

**Typography:** I recommend a UI-friendly Bangla font (Hind Siliguri or Noto Sans Bengali) for body and interface text; Tiro Bangla's serif forms are less legible at small sizes on cheap phones. Keep Montserrat (or Inter) for Latin text and numerals. This is a recommendation; see decision D5.

### 7.2 Surfaces and information architecture

**A. Customer app (mobile-first, with bottom navigation)**
- Home: location selector at top ("Sylhet Sadar ▾"), search, "near you" products, seasonal now, stores near you, producers near you.
- Explore: categories, filters (distance, upazila, price, retail/wholesale, organic/fresh/harvest date, verified).
- Product page: photo gallery, origin upazila and harvest date, **price tier table**, availability, list of **stores selling it** (compare price, distance, rating, delivery), producer card.
- Store page: banner, owner story, verification, rating, products, delivery area, follow.
- Producer page: farm story, products, sourcing availability.
- Cart (grouped by store), checkout (address by upazila, delivery option and window, payment), order tracking per sub-order, reviews, support/dispute.

**B. Reseller workspace (mobile-first)**
- Today: new orders, low stock, earnings snapshot.
- Sourcing: discover producers (map/list), product catalogue from producers, request/quote, "add to my store" with margin calculator.
- My store: listings, pricing (retail/wholesale tiers), store profile and branding, delivery areas, pickup point.
- Orders: sub-orders with status actions and customer contact.
- Earnings: balance, per-order breakdown (supply cost, margin, commission), payouts.

**C. Producer workspace (mobile-first, very simple)**
- Listings: quick add (photo, product, quantity, price tiers, harvest date, season).
- Requests: sourcing requests and quotes.
- Orders: fulfilment queue, packing list, mark handed over.
- Earnings and payouts.

**D. Admin console (desktop-first)**
- Verification queue, product and store moderation, orders and disputes, payments and settlements, commission rules, delivery zones, regional dashboard (orders, GMV, supply/demand per upazila), audit log, user management.

### 7.3 Key UX principles
- **Location first, everywhere**: current area always visible; results ordered by nearness; every card shows origin and distance.
- **One clear price per quantity**: show tiers on product pages instead of hiding wholesale behind a toggle.
- **Trust visible at a glance**: verification tier, harvest date, rating, producer name.
- **Low-bandwidth, low-end-phone friendly**: image sizes, skeletons, minimal client JavaScript on catalogue pages.
- **Bangla-first** copy and numerals, with a clean English switch.

### 7.4 Existing UI that carries over
Header/footer structure, filter sheet, comparison table (becomes "stores selling this"), dashboards shell, area picker, toasts, cards (restyled). Illustrations and glass styling go.

---

## 8. Phased implementation roadmap

Effort is expressed in relative size for a small team; exact dates depend on team size.

### Phase 0 — Decisions and foundation (size S)
- Resolve decisions D1–D6 below.
- Tag old concept, create pivot branch, set up Supabase project, environments, error tracking.
- New design tokens, typography, and photography plan; restyle UI primitives.
- Seed upazila data; finalise category taxonomy.

### Phase 1 — Real marketplace core, Sylhet (size L)
- Real phone-OTP authentication and profiles; roles and store membership.
- Upazila location picker and "near me".
- Producer onboarding and listings with price tiers, MOQ, harvest date, season, photos.
- Store creation for resellers; own-stock listings first, then linked listings.
- Customer browse, product page with stores-selling-this, cart, checkout.
- **COD orders** with parent order, sub-orders, fulfilments, status flow.
- Admin: verification queue, product/store moderation, order list.
- Remove old pillars from navigation and code.
- Exit criteria: a real producer, a real student store and a real customer can complete a COD order in Sylhet.

### Phase 2 — Sourcing and reseller economy (size L)
- Supplier discovery, sourcing requests and quotes, linked-listing stock sync, margin calculator.
- Earnings ledger and settlement reports (manual payouts by admin).
- Delivery zones, fee rules, pickup points, perishable windows.
- Reviews and basic disputes; notifications (SMS/in-app).

### Phase 3 — Online payments and settlements (size L)
- Gateway integration (bKash, Nagad, cards through a licensed aggregator), webhooks, reconciliation.
- Hold-until-delivery, automated payouts, refunds, commission rules by type/category.
- Legal and compliance review before launch of this phase.
- Admin finance console.

### Phase 4 — Scale and optimise (size M–L)
- Expand to more districts; district-level admin roles and field agents.
- Logistics partner integration, route/consolidation tools.
- Analytics, seasonal demand forecasting, recommendations.
- Optional: knowledge content, social features, native app.

### Risks to manage from day one
Cash handling and COD fraud; perishable quality and disputes; seller onboarding effort in rural areas; SMS delivery cost and reliability; regulatory requirements for holding funds; supply reliability (producers going out of stock); moderation workload.

---

## 9. Decisions needed from you

Defaults are my recommendation; reply "go with defaults" or change any.

| # | Decision | Recommended default |
|---|---|---|
| D1 | Reseller inventory model for the MVP | **Linked mode** (producer holds and ships stock) plus simple own-stock mode |
| D2 | Who delivers in the MVP | Producer or store delivers inside defined zones, plus pickup points; no platform logistics |
| D3 | Commission structure | Decide after a small pilot; build the system so rates are configurable per transaction type and category. I will not hard-code rates until you confirm. |
| D4 | Payment path | COD first; pick a licensed aggregator for online payments in Phase 3 and take legal advice on holding funds |
| D5 | Fonts | Hind Siliguri or Noto Sans Bengali for UI, Montserrat for Latin; drop Tiro Bangla for body text |
| D6 | Brand name and domain | Keep "PosraBazar / পসরাবাজার" if it still fits ("Posra" = a trader's display of wares); remove the former co-branding and software references |
| D7 | Existing features to keep | Keep: market prices, regional/famous products, follow on stores. Defer: knowledge hub, community feed, wallet for customers. Remove: Business Solutions, Khata Lite. |

---

## 10. What happens next
Nothing will be changed until you approve. After approval, my first move would be Phase 0: tag the current state, create the pivot branch, apply the new design tokens to the UI primitives, and write the new database migrations (upazilas, stores, listings with price tiers, sub-orders) with tests, so the rest of the build rests on the right foundations.
