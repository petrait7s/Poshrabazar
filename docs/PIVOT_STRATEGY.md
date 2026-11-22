# Pivot Strategy — Sylhet-first Community Marketplace

Status: **proposal, awaiting approval. No code has been changed.**
Scope of this document: audit of the current project, new product vision, roles, workflows, architecture, database changes, UI/UX structure, and a phased roadmap.

---

## 0. Executive summary

- The current project is a **polished frontend prototype**, not a working product. All 29 routes run on hard-coded demo data in `src/data/`. There is **no Supabase client in the app**, **no real authentication** (the "login" writes a fake user to `localStorage`), **no real orders, no payments, no uploads**. The Supabase schema and security rules exist and pass tests on PostgreSQL 16, but nothing connects to them yet.
- That is good news for a pivot: very little real business logic is locked in. About **3,300 lines of TypeScript** and **~1,800 lines of SQL** exist.
- Roughly **half of the code is reusable** (layout shell, UI primitives, filters, cart mechanics, dashboards shell, location picker, schema patterns, RLS patterns). The **brand, visual style, product taxonomy, fee logic, and several whole pillars** conflict with the new concept and should be replaced or removed.
- The biggest structural gap is the thing the new concept is built on: **sourcing**. Today a "seller" simply lists a product at a price. The new model needs a **supply chain**: producers list supply, youth entrepreneurs (resellers) source it into their own stores, customers buy from stores, and the money and stock must flow correctly through all three. The existing schema has no concept of this.
- Recommendation: keep the Next.js + Supabase direction, create a **new long-lived branch** for the pivot, tag the current `main` as the old concept, and execute in four phases starting with real authentication, a store/producer split, upazila-level location, and COD orders with seller sub-orders.

### Assumptions I am making (please correct any that are wrong)
1. The product name and brand may change. The working brand name is **PosraBazar** (decision D6, now approved).
2. One person can hold several roles (a young person can be a customer **and** a reseller; a producer can also sell retail).
3. Phase 1 uses **Cash on Delivery** only. Online payment comes after the platform is live with real users.
4. We are not holding warehouse stock. Every product belongs to a seller's own listing.
5. Bangla is the primary language; English is secondary.
6. Team is small (1–3 developers), so I prefer managed services (Supabase) over custom infrastructure.

---

## 0.1 Approved decisions (recorded before Phase 0)

The product owner approved the strategy and decided as follows. These are now the source of truth.

| # | Decision | What it means in practice |
|---|---|---|
| D1 | **Both linked and own-stock reseller modes in the MVP** | In *linked* mode the producer stays responsible for stock and fulfilment and the youth reseller sets their own selling price (never below the supplier's price). In *own-stock* mode the seller holds and manages stock. Stock is only ever changed through an append-only movement log, and a producer's stock is shared by every reseller linked to it, so nothing can be oversold. Responsibilities are separate: the fulfilling store moves the fulfilment; the selling store owns the customer relationship and price. |
| D2 | **Producer/store-managed delivery inside defined zones, plus pickup points** | No platform logistics. Each store declares the zones it serves and its fee. Fulfilments carry a `method` and a `provider` column so a courier integration can be added later without redesign. |
| D3 | **Commission configurable per transaction type; promotional 0% pilot** | `commission_rules` holds rates as data (basis points, per transaction type, optional per category, with start/end dates). The pilot ships with 0% for *direct*, *reseller* and *wholesale* sales. The financial model treats the three separately. **No wallet and no holding of customer money is implemented**; the ledger only records what each party is owed on delivered orders. Anything that holds or moves money needs legal review first. |
| D4 | **Fonts: Tiro Bangla (Bengali) + Inter (English)** (revised) | First approved as Noto Sans Bengali; the product owner then chose **Tiro Bangla** for Bengali when the new homepage was built. Tiro Bangla has a single weight (400), so Bengali hierarchy comes from size, colour and spacing (browser faux-bold is disabled); Inter supplies real bold for English text and numerals. Re-check small-text legibility on low-end phones. |
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

### 0.2 Updated MVP direction (supersedes conflicting text below)

The product owner then clarified the MVP: PosraBazar is an **open multi-vendor marketplace from day one** with **10 founder-operated launch stores**, **founder-managed delivery**, **seller registration open to everyone** (with admin approval before publishing) and **structured discovery by seller and category**. The full plan, gap analysis, workflows, permissions, database changes and roadmap are in **section 11**. Where sections 2.3, 2.4, 3, 4.6 or the Phase 1 roadmap differ, section 11 wins.

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
4. **Store creation** for youth entrepreneurs and other resellers with their own storefront URL.
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
A community-driven, multi-vendor marketplace for Bangladesh's agricultural and regional products, launching in **Sylhet**. It lets farmers and producers sell directly, and lets **youth entrepreneurs and other independent sellers run their own stores** by sourcing from producers in their own upazila, with almost no startup capital. Customers get fresher, more traceable products with transparent origin and price; producers get access to more buyers; young people earn.

### 2.2 What it is, and is not
- It **is** a hybrid marketplace with three transaction types (producer→customer, producer→reseller→customer, supplier→wholesaler/retailer) and both retail and wholesale pricing.
- It **is not** a grocery-delivery app, and the platform **does not own warehouse inventory**.

### 2.3 Launch scope (MVP, Sylhet)
*Updated; see section 11.*
- Open marketplace: anyone can register as a customer and apply to become a seller; approved sellers get a storefront and a seller dashboard.
- Ten founder-operated launch stores run alongside external sellers.
- Nationwide sourcing, Sylhet-only customers and sales (supported service area enforced at checkout).
- Structured discovery by category and by store; 10 categories.
- Payments: cash on delivery. Delivery: founder-managed for all stores, with pickup as a separate option.

### 2.4 Non-goals for the MVP
- Platform-owned warehouses or fleet; third-party courier integration; advanced logistics optimisation.
- Customers outside the Sylhet service area.
- A marketplace-wide social feed (mixed timeline, likes, comments), automated seller recruitment, Knowledge Hub, Business Solutions software. Per-store updates on the store's own page are in scope (section 11.6a).
- Online payments, customer wallet and stored balances, automated payouts.
- Native mobile apps (a fast PWA first).

### 2.5 Success measures (suggested)
Number of active stores and producers per upazila, share of orders that are producer→reseller→customer, repeat-customer rate, on-time delivery rate, dispute rate, and gross order value per store.

---

## 3. Roles and permissions

*Superseded by section 11.4, which has the full permission matrix. Summary:* **Customer** (browse, order, apply to sell); **Seller applicant** (customer with an application under review; may draft but not publish); **Seller** (owner, manager, staff within a store, only for approved stores; types: Individual, Farmer/Producer, Youth Entrepreneur, Business); **Admin / founder** (reviews applications, manages every store, delivery, finance and settings; also operates the 10 launch stores); later: **delivery helper** and **regional agent**. One account can hold several roles; store membership grants access to one store.

**Verification:** a store is shown as verified only after an admin has reviewed real evidence. Founder-operated stores carry the label "PosraBazar পরিচালিত" instead and make no verification claim.

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
   - **Linked mode (recommended for MVP).** The store listing references the producer's listing. Stock is the producer's stock (synchronised). The reseller sets only the **retail price** (must be ≥ the producer's supply price). When the customer orders, the producer fulfils; the reseller never holds stock. Good for young people with no capital.
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
*Superseded for the launch by section 11.5: delivery is platform-managed (founder-delivered) for every store, priced per zone at order level. The text below describes the later seller-managed and zone-fee options, which the design keeps available.*

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

Effort is expressed in relative size for a small team; exact dates depend on team size. **Phase 1 below is replaced by sections 11.13 (1A to 1E); read Phases 2 to 4 together with 11.13.**

### Phase 0 — Decisions and foundation (size S)
- Resolve decisions D1–D6 below.
- Tag old concept, create pivot branch, set up Supabase project, environments, error tracking.
- New design tokens, typography, and photography plan; restyle UI primitives.
- Seed upazila data; finalise category taxonomy.

### Phase 1 — Open marketplace MVP, Sylhet (size L)
*Replaced: see section 11.13 (1A Foundations, 1B Structured storefront, 1C Seller onboarding and seller dashboard, 1D Orders, delivery and operations, 1E Pilot launch readiness).*

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
Nothing will be changed until you approve. Section 11 is the plan to review. After approval, work starts with Phase 1A. The one thing I cannot proceed without is the identity of the 10 launch stores (question Q1 in section 11.14).

---

## 11. Updated MVP plan: an open marketplace with founder-operated launch stores

Status: **proposal for review. No code has been changed for this plan.** It overrides any conflicting assumption elsewhere in this document (sections 2.3, 2.4, 3, 4.6 and the Phase 1 roadmap are superseded where they differ).

### 11.1 The principle

PosraBazar is an **open multi-vendor marketplace from day one**. The founder operates 10 launch stores to test and start the marketplace, and handles customer deliveries personally at first. Those 10 stores are ordinary stores marked as founder-operated. They are not a limit: anyone can register as a customer, apply to become a seller, be verified by an admin, and start selling. Nothing in the data model, permissions or screens may assume a fixed number of sellers.

Decisions recorded:

| # | Decision |
|---|---|
| U1 | Wording is **Youth Entrepreneurs / Young Entrepreneurs**, never "student entrepreneurs". Participation is not restricted to students or to any age group: students, young entrepreneurs, farmers and producers, local businesses, independent suppliers and resellers can all apply. |
| U2 | The founder operates **10 launch stores**: separate identities, categories, listings, prices and inventory records, managed centrally. No invented independent users, no fabricated verification claims, no artificial reviews. |
| U3 | **Open seller registration**: any customer can apply to become a seller through a clear "Become a Seller" entry; approved sellers get their own storefront and seller dashboard. |
| U4 | **Admin verification and approval** is required before a seller can publish products. |
| U5 | Seller types: **Individual, Farmer/Producer, Youth Entrepreneur, Business**. |
| U6 | **Delivery is founder-managed** at launch for **all** stores, including external sellers, unless a different arrangement is explicitly approved for a store. No third-party courier integration. The design stays ready for seller-managed delivery and third-party logistics. |
| U7 | **Structured discovery**: by seller and by category, never a random feed. Navigation: Home, Categories, Stores, Cart, Orders, Profile. |
| U8 | **Geography unchanged**: nationwide sourcing, Sylhet-only customers and sales. Product origin, store location, inventory location and delivery destination are four separate facts. |
| U10 | **Store story and updates.** Each seller's profile shows what they sell, where the products are collected from, and how they are grown or made, and the seller can post updates about this (text, photos, later short video) on **their own store page**. This is a per-store journal for buyers, not a marketplace-wide social feed. |
| U9 | The founder gets one **operational dashboard** over every store, with a store switcher; each seller gets a dashboard limited to their own store. |

Not in the MVP: automated seller recruitment, third-party courier integration, advanced logistics optimisation, and a marketplace-wide social feed (no mixed timeline, likes, comments or algorithmic ranking). Store updates on each store's own page are in (U10).

### 11.2 What Phase 0 already gives us, and what is missing

| Need | Phase 0 state | Verdict |
|---|---|---|
| Many stores with separate listings, prices, stock | `stores`, `listings`, `price_tiers`, `stock_movements`, per-store ledger accounts | **Supports it**; no change |
| One person managing several stores | `store_members` allows one user in many stores; `admin` role sees everything | **Supports it** |
| Anyone can open a store, nobody self-verifies | A signed-in user can create a store; it starts `pending`; only staff can verify (`guard_store_verification`) | **Good base**; needs the application record, review workflow and a separate "published" switch |
| Publishing gated by approval | Listing guard forces every new listing to `pending` for non-admins and blocks self-approval. That would make **every** seller wait for per-listing approval | **Change**: once a store is approved, its owner publishes directly; admin can take listings down |
| Seller types | `store_type` (reseller, producer, wholesaler, retailer) describes a sales model, not who the seller is | **Add** `seller_type` (individual, farmer_producer, youth_entrepreneur, business) |
| Seller onboarding | A demo form that sends nothing | **Missing**: applications, evidence uploads, review queue, status page |
| Store story: what is sold, where it comes from, how it is made | Nothing for storefronts. The earlier community posts are a demo (browser storage, global feed, likes) kept in `src/_deferred/` | **Add** structured sourcing entries and per-store updates, see 11.6a; the old demo is not reused as a global feed |
| Store identity | name, description, upazila only | **Add** tagline, logo, cover, sourcing note, operation mode |
| Product must have category, seller, origin, valid inventory | Category and seller are enforced; stock holder exists; origin is optional and limited to Sylhet upazilas | **Change**: origin must be a district anywhere in Bangladesh and required before publishing; add inventory location |
| Four-way geography split | Origin partial, store location Sylhet-only, inventory location absent, delivery destination not restricted to a service area | **Add** origin district, inventory location, service-area allow-list enforced at checkout |
| Founder-managed delivery | Delivery is per store and per sub-order, priced from each store's own zones. The settlement credits the delivery fee to the store's payable account | **Change**: delivery becomes an order-level, platform-priced workflow; the fee is platform revenue, never a seller's revenue |
| Delivery statuses | Order and fulfilment statuses exist, but not Pending, Preparing, Ready for Delivery, Out for Delivery, Delivered at order level | **Add** order-level delivery record and status flow; pickup handled separately |
| Collecting goods from external sellers | `handed_over` exists on fulfilments | **Reuse**, add a handover method (seller drops at hub / founder collects) |
| Zone-based fees | `delivery_zones` and `zone_upazilas` exist; fees live per store | **Add** a platform-level fee per zone; keep per-store fees for a future seller-managed mode |
| Pickup orders | Pickup points per store, pickup per sub-order | **Change**: pickup becomes an order-level choice with its own statuses |
| Operations dashboard | Demo screens with local state; database functions exist | **Missing**: real dashboards over aggregated views |
| Store-wise revenue and costs | Revenue snapshots and ledger exist; no costs | **Add** unit cost on stock receipts and a cost snapshot per order line |
| No fake trust signals | The frontend demo data contains 25 invented sellers with ratings, order counts and "verified" flags, and the UI shows them | **Remove**. Reviews stay empty until real delivered orders produce them |
| Search | Basic client-side name search | **Replace** with catalogue search across product, category, store, origin and retail/wholesale |
| Navigation and categories | Bottom nav is Home/Explore/Cart/Orders/Profile; 7 categories | **Change** to the required nav and the 10 categories |
| Homepage | Built for the earlier design | **Restructure** to the 11-section structure in 11.6 |
| Wording | UI already says "তরুণ উদ্যোক্তা"; this document said "student" | **Fixed** in this update |

### 11.3 Seller onboarding workflow

**Entry points.** "Become a Seller" in the header menu, the profile page, the Stores page and the homepage. Anyone can first register as a customer, then apply. A seller is a customer with a store.

**Application (one form, a few short steps).**
1. *Who you are:* seller type (Individual, Farmer/Producer, Youth Entrepreneur, Business), full name, phone, optional email.
2. *Where you are:* district, upazila, address, plus where your goods are kept.
3. *What you sell:* store name, short description, categories, product origin and sourcing story (own farm, local producers, other districts).
4. *Evidence:* by type (see 11.14, question 2): identity document, photos of the farm, shop or products, trade licence for businesses, and for youth entrepreneurs an optional student or institution ID.
5. *Agreements:* seller terms, product policy, and the delivery arrangement (PosraBazar delivers; goods are handed over to PosraBazar).

**Review states.** `draft` → `submitted` → `in_review` → `needs_info` (applicant fixes and resubmits, back to `in_review`) → `approved` or `rejected`. An approved store can later be `suspended` by an admin, with the reason recorded. Every transition is logged with who, when and why.

**What approval does.** The store becomes publishable, the owner can publish products, the storefront appears in the Stores directory, and the "verified seller" mark is shown **only** because an admin approved real evidence. Before approval the owner can prepare draft products but cannot publish them, and the storefront is not public.

**What the applicant sees.** A status page ("Under review", "We need more information: ...", "Approved", "Not approved: reason"), without any automated message in the first release other than the in-app status; SMS or email notification is a later improvement.

**Profile pre-fill.** The application's "what you sell" and sourcing answers become the first version of the public profile, so a newly approved store is not empty; the seller then edits it and adds updates (11.6a).

**Founder-operated stores** are created directly by the admin, marked `founder_managed`, and show the label "PosraBazar পরিচালিত". They do not claim to be verified sellers, and they use the same listing, stock, order and finance machinery as everyone else.

**Privacy.** Identity documents go to a private storage bucket readable only by the applicant and admins; they are never shown on a storefront. Collect only what the evidence rules require. Collecting national ID numbers needs a data-protection decision from the founder.

### 11.4 Roles and permissions

Roles are capabilities; store membership is access to one store. One account can be a customer, a seller owner of one or more stores, and (for the founder) an admin.

| Capability | Customer | Seller applicant | Seller owner | Seller manager | Seller staff | Admin (founder) |
|---|---|---|---|---|---|---|
| Browse, search, cart, order, track own orders | yes | yes | yes | yes | yes | yes |
| Apply to become a seller | yes | (applying) | n/a | n/a | n/a | n/a |
| See own application status | n/a | yes | n/a | n/a | n/a | all |
| Edit store profile (name, tagline, logo, story) | no | draft only | yes | yes | no | all stores |
| Edit sourcing entries and post store updates | no | drafts only, not public | yes, after approval | yes, after approval | no | all stores (can hide a post) |
| Create and edit products, prices, stock | no | drafts only, not published | yes | yes | stock only | all stores |
| Publish products | no | **no** | yes, after approval | yes, after approval | no | all stores |
| Receive stock and set unit cost | no | no | yes | yes | yes | all stores |
| See and prepare orders for the store | no | no | yes | yes | yes | all stores |
| See customer phone and full address | own only | no | **only if the store has approved seller-managed delivery** | same | same | yes |
| See own store revenue, costs, settlement statement | no | no | yes | read | no | all stores, consolidated |
| Add or remove store members | no | no | yes | no | no | yes |
| Approve or reject applications, suspend stores | no | no | no | no | no | yes |
| Take products down, edit categories, delivery zones and fees | no | no | no | no | no | yes |
| Change a store's delivery arrangement | no | no | no | no | no | yes (explicit approval) |
| Edit the ledger directly | no | no | no | no | no | no (logged adjustments only) |

Privacy rule worth stating: because PosraBazar delivers at launch, **sellers do not need customers' phone numbers or full addresses**. They see what to prepare, the delivery zone and the customer's first name. This protects customers and removes a reason for sellers to contact buyers outside the platform.

A later `ops` role (a delivery helper who can see only delivery tasks) and a regional agent role fit into the same model.

### 11.5 Delivery and fulfilment workflow

**Default for every store: platform-managed delivery.** Customers pay one delivery fee per order, set by the **delivery zone** of the address. The fee is PosraBazar's delivery revenue and is recorded separately from every store's product revenue.

**Order-level delivery statuses (delivery orders):** Pending → Preparing → Ready for Delivery → Out for Delivery → Delivered. A failed attempt is recorded with a reason and the order returns to Ready for Delivery.
**Pickup orders** have their own statuses: Pending → Preparing → Ready for Pickup → Collected, and no delivery fee.

**How a multi-store order moves.** Each store prepares its own lines (the existing line-level statuses: accepted, ready, handed over). Founder-operated stores hand over to the founder instantly; external sellers either drop goods at the hub or the founder collects them (recorded as the handover method). The order becomes Ready for Delivery only when every line has been handed over. The founder then marks Out for Delivery and Delivered; he can do the whole flow from one screen. Customers confirm receipt is optional in the pilot because the founder delivers personally and records it; cash collected on delivery is recorded against the order.

**Flexibility kept.** Each store has a delivery arrangement: `platform_managed` (default), `seller_managed` or `third_party`. Only an admin can change it. The existing per-store zones and fees, the `delivery_method` and `provider` fields, and the handover record are retained so seller-managed delivery and a courier integration can be added later without redesign.

**Configurable per zone:** fee, free-delivery threshold, minimum order, and the allowed delivery days or time slots. Zones are groups of Sylhet upazilas defined by the founder.

### 11.6 Discovery: an organised marketplace

Discovery has two axes only: **by store** and **by category**. There is no mixed feed and no endless scroll.

**Navigation (bottom bar):** Home, Categories, Stores, Cart, Orders, Profile. On a 390 px screen six items are about 65 px each, which works with 11 px labels; the alternative is to move Profile into the header (decision in 11.14).

**Categories (10, flat):** Vegetables, Fruits, Fish, Rice and grains, Pulses, Dairy products, Poultry and eggs, Spices and agricultural products, Regional and processed food, Other approved categories. A product has exactly one. Dried fish sits under Fish and is told apart by a product attribute ("form": fresh, dried, processed), so categories stay simple.

**Category page:** its own page per category with filters (origin: Sylhet or other districts and a district picker, retail or wholesale, availability, price range, store) and sorting (newest, price, freshest). Each result shows the store name and the real origin.

**Stores directory and storefront:** a directory of all approved stores (founder-operated and independent), filterable by category and origin; each storefront shows the store's identity, its sourcing note and its products grouped by category.

**Homepage, in this order:**

| # | Section | Rule |
|---|---|---|
| 1 | Header | PosraBazar brand and the Sylhet location |
| 2 | Search and category navigation | Search bar; a row of the 10 categories linking to category pages |
| 3 | Featured seasonal campaign | One admin-curated campaign; its products are reserved for it |
| 4 | Shop by category | Grid of the 10 categories, no products |
| 5 | Featured sellers / stores | Admin-featured stores, each with identity and up to three of its own products |
| 6 | Locally produced in Sylhet | Products whose origin district is in Sylhet, grouped by category |
| 7 | Sourced from other districts | Products from elsewhere in Bangladesh, grouped by origin district |
| 8 | Fresh products available in Sylhet | Perishable categories with a harvest or catch date in the last few days and stock held in Sylhet, showing the date |
| 9 | Wholesale and bulk | Products with a wholesale tier, shown as a compact list with minimum quantities |
| 10 | Recently added | New products, grouped by category |
| 11 | Bottom navigation | As above |

**No scattering, no duplicates:** the homepage fills sections from top to bottom with a "used" list; a product shown in one section is excluded from the later ones, and an empty section is hidden. Every product shown has one category, one store, an identifiable origin and a valid inventory source; a listing that lacks any of these cannot be published.

**Search** covers product name, category, store name, origin district or upazila, and retail or wholesale availability (Bangla and English, Postgres full-text plus trigram matching).

### 11.6a Store profile: what is sold, where it comes from, how it is made

Buyers should be able to understand a seller before buying. Every storefront (founder-operated or independent) therefore has three parts, and the seller can keep adding to it with updates.

**Storefront tabs:** *Products* (grouped by category), *About and sourcing*, *Updates*.

**1. What we sell.** Built automatically from the store's published products by category, plus a short description the seller writes.

**2. Where the products come from (sourcing).** Structured entries, not free-form posts. Each entry has a source name, source type (own farm, local farmers, supplier in another district, wholesale market, own workshop), district and upazila, the seller's relationship ("we grow it", "we buy from"), and an optional photo. A product can point to one of these entries, so the product page can say "Source: [entry], [district]" next to the origin. This makes origin specific and checkable instead of a bare district name.

**3. How it is grown or made (production and handling).** A short written section with photos covering how the product is produced, harvested or caught, cleaned, dried, packed and stored. Typical for farmers and producers, equally useful for resellers describing how they handle goods.

**4. Updates (a per-store journal).** The seller posts short updates on their own store page: a new sourcing trip, a harvest in progress, how a batch is processed, new stock, a seasonal note. An update has a type (sourcing, production, new stock, announcement), a title, text, up to six photos, and optionally a link to one of the store's products or sourcing entries. Updates show newest first on that store's page and, when linked, on the related product page. There are no likes, comments, shares or algorithmic ranking in the MVP, and **no marketplace-wide feed**: updates are found by opening a store, a product or a followed store, in keeping with the structured discovery rule (U7).

**Following.** A buyer can follow a store (a simple list under Stores). In a later phase, updates from followed stores can appear in a "Following" tab that the buyer chose to build, which is still not a mixed public feed.

**Honest-claims policy (important).** Production and sourcing text is the **seller's own statement** and is labelled that way on the page ("বিক্রেতার নিজের বিবরণ") unless an admin has checked it. Regulated or hard-to-prove claims such as organic, chemical-free, formalin-free, halal or "farm fresh today" are not allowed in free text without evidence an admin has seen; "harvested or caught on" dates come from the listing field, not from prose. Founder-operated stores follow the same rule. An admin can hide any update or sourcing entry with a recorded reason.

**Who can post.** Seller owner and manager of an **approved** store. Applicants can draft but not publish; staff cannot post. Light rate limits (for example a few posts a day) keep stores from flooding their own page. Customers cannot post in the MVP.

**Media.** Photos are in the MVP (resized on upload, private-until-published not needed). Short video is valuable for farmers but costs storage and bandwidth and is heavy on low-end phones; recommended as a later addition (question Q11).

### 11.7 Geography: four separate facts

| Fact | Meaning | Where it lives | Restriction |
|---|---|---|---|
| **Product origin** | Where the product was grown, caught or made | listing: origin district (required) and optional upazila | Anywhere in Bangladesh |
| **Store location** | Where the seller operates | store: district and upazila | Anywhere in Bangladesh for independent sellers |
| **Inventory location** | Where the goods physically are now (a hub in Sylhet, or at the seller's place) | listing: inventory location | Drives "available in Sylhet" and handover planning |
| **Delivery destination** | Where the customer receives the order | order: upazila | Only the supported Sylhet service area, enforced by an allow-list |

Nationwide sourcing, Sylhet-only customers and sales; expanding the service area later means adding rows to the allow-list, not changing code.

### 11.8 Operational dashboards

**Founder / admin console (desktop-first, usable on a phone):**
- A **store switcher** at the top: "All stores" or one store. The choice persists in the address and filters every page, so the founder can look at one store and return to the whole marketplace in one tap.
- *Overview:* store cards (founder-operated and independent) with orders, revenue and low-stock counts; today's pending deliveries; overall performance.
- *Applications:* the review queue for new sellers, with evidence, decision and note.
- *Stores:* all stores, their products and inventory, and the store-wise view.
- *Inventory:* store-wise stock, receive stock with unit cost, adjustments, movement history.
- *Orders:* consolidated orders and a **seller-specific breakdown** of each order.
- *Deliveries:* a board by status and zone with customer name, phone, address, items and amounts, collection from sellers, assignment, status updates, cash collected.
- *Finance:* store-wise revenue and product cost, gross margin, delivery fee records, settlement statements.
- *Settings:* delivery zones and fees, categories, campaigns, featured stores.

**Seller dashboard (mobile-first, own store only):** overview, products (create, edit, pause, publish after approval), inventory with cost, orders to prepare and hand over, earnings and settlement statement, store profile. A seller who owns several stores can switch between them. A **Profile and updates** area lets the seller edit sourcing entries and the production section, write updates with photos, and link them to products.

### 11.9 Database changes (new migrations, each reversible, each with tests)

*Migration 4, seller onboarding and publishing:*
- `seller_type` enum; `stores.seller_type`, `operation_mode` (`founder_managed`, `independent`), `delivery_arrangement` (`platform_managed`, `seller_managed`, `third_party`), tagline, logo, cover, sourcing note, `published`, `featured`.
- `seller_applications` (applicant, store, type, identity and contact, location, business details, categories, agreements, status, review fields) and `application_events` (audit log); `application_documents` pointing at a private storage bucket.
- `store_sources` (name, type, district, upazila, relationship, photo, text), `store_posts` (store, type, title, body, optional linked listing and source, status published/hidden, hidden reason, published at), `store_post_media` (post, image path, order), `store_follows` (user, store), and `listings.source_id`.
- Rewrite the listing publish guard: owners of approved stores publish directly; unapproved stores cannot publish; admins can take down.
- Row-level security so an applicant sees only their own application and a seller only their own store; `is_admin` sees all.

*Migration 5, geography and categories:*
- The 10-category taxonomy (data migration), `products.form`.
- `listings.origin_district_id` (required to publish), `inventory_locations` and `listings.inventory_location_id`.
- `service_areas` (allow-list of upazilas) enforced by `place_order_v2`.

*Migration 6, delivery, pickup and costs:*
- `fulfilment_type` on orders (delivery or pickup), `delivery_zone_fees` (fee, free-over, minimum order, active), `deliveries` (status, assigned to, scheduled for, timestamps, failure reason, cash to collect and collected), pickup statuses.
- `delivery_revenue` ledger account: the delivery fee is credited there, not to the store; `store_delivery_zones` stays for a future seller-managed arrangement.
- Handover method and time on fulfilments.
- `stock_movements.unit_cost_paisa` on receipts, a weighted average cost on listings, and `line_financials.cost_paisa`.
- Views for the dashboards: orders with customer and stores, store summary, inventory, deliveries, store profit and loss. Views use the caller's rights, so sellers see only their own rows.

*Migration 7, search:* full-text and trigram indexes and a `search_catalog` function.

*Unchanged and reused:* listings, price tiers, stock movement log, parent order and sub-orders, fulfilments, financial snapshots, commission rules (0% pilot), the append-only ledger, the rollback harness and the test suite. Linked-stock mode stays in the schema but is not used by the launch stores.

*Tests to add:* only owners and managers of approved stores can publish updates; an admin can hide an update and the reason is kept; a hidden or unapproved store's updates are not public; application state machine and who may do what; approved vs unapproved publishing; service-area enforcement; delivery fee in the delivery-revenue account and not a store's payable; delivery status flow and pickup flow; cost snapshots and store-wise profit; one seller cannot read another's rows or customers' contact details.

### 11.10 Routes and screens

| Route | Change |
|---|---|
| `/` | Rebuilt to the 11-section homepage |
| `/categories`, `/categories/[slug]` | Category grid and category pages with filters and sorting (`/category/[slug]` redirects) |
| `/stores`, `/stores/[slug]` | Directory and storefronts with tabs Products, About and sourcing, Updates (`/seller/[slug]` redirects); follow button |
| `/search` | Upgraded search |
| `/product/[slug]` | Shows store, origin, inventory location and harvest date |
| `/become-a-seller`, `/become-a-seller/status` | Application and status (replaces the demo `/seller/register`) |
| `/seller/*` | Real seller dashboard (products, inventory, orders, earnings, profile, sourcing entries, updates) |
| `/admin/*` | Overview, applications, stores and `stores/[slug]`, inventory, orders and `orders/[id]`, deliveries, finance, settings |
| `/cart`, `/checkout`, `/account/orders` | Real orders, delivery or pickup choice, zone fee, COD |
| `/marketplace` feed, `/famous`, `/market-prices`, `/wholesale` | Feed removed; regional and bulk become filters; market prices hidden from navigation for the MVP |

Reused as they are: header, location sheet, product image slot, product and region components, price comparison, cart state, toast system, design tokens. The fabricated seller data and trust badges are removed.

### 11.11 Money, settlement and cash

COD only. For the founder's own stores the cash is simply the business's revenue. For **external sellers**, the founder collects customers' cash on their behalf and settles with them, which is in practice holding their money. The plan therefore keeps this deliberately simple and manual: the ledger shows what each store is owed on delivered orders, an admin issues a **settlement statement** per period and records each manual payment with a reference. There are no automated payouts, wallets or balances. Take legal and accounting advice, and put the terms in writing in the seller agreement, before onboarding the first external seller. Commission stays at 0% for the pilot and configurable afterwards.

### 11.12 Essential for the MVP, and what can wait

| Essential | Later |
|---|---|
| Real accounts (customer, seller, admin) | SMS or email notifications |
| Become a Seller application, evidence upload, admin review queue, status page | Automated recruitment or referral campaigns |
| Open seller dashboard: products, inventory, orders, earnings statement | Seller analytics, bulk import, promotions |
| Founder console with store switcher | Delivery helper role and route planning |
| Structured discovery, 10 categories, stores directory, new homepage, search | Personalised recommendations |
| Delivery and pickup with zone fees, status flow, COD cash record | Seller-managed delivery, courier integration, delivery slots |
| Unit costs and store-wise profit | Advanced reporting |
| Manual settlement statements | Online payments, automated payouts |
| Store profile sections (sourcing entries, production text) and photo updates on each store page; follow a store | Short video updates; "Following" updates tab; likes or comments |
| Real reviews from delivered orders (small) | Review moderation tools, ratings ranking |

### 11.13 Updated roadmap

Phase 0 is complete. Phase 1 is now the **open marketplace MVP**, in five parts:

- **1A Foundations (M).** Supabase project and environments; authentication (admin, customer, seller); migrations 4–7 with rollbacks and tests; the 10 category rows, service areas, delivery zone fees; remove the fabricated demo sellers and trust signals; seed the 10 founder-operated store shells once their identities are confirmed.
- **1B Structured storefront (M).** New navigation, categories pages with filters and sorting, stores directory and storefronts, homepage restructure with the no-duplicate rule, search, product page updates (store, origin, source entry, linked updates); storefront tabs Products, About and sourcing, Updates; read from the database instead of local data.
- **1C Seller onboarding and seller dashboard (M–L).** Become a Seller flow and status page, evidence upload to private storage, admin review queue and decisions, store creation on submission and publishing on approval, seller dashboard (products, inventory with cost, orders to prepare and hand over, earnings statement, profile sections and photo updates).
- **1D Orders, delivery and operations (L).** Real cart and checkout (delivery or pickup, zone fee, COD), per-store fulfilment, handover from external sellers, delivery board and status flow, founder console with store switcher, inventory, consolidated orders with seller breakdown, finance (store revenue and cost, delivery fee records, settlement statements).
- **1E Pilot launch readiness (S).** The 10 founder stores filled with real products, prices, photographs and sourcing notes; seller terms and product policy; first external applications reviewed; end-to-end test orders; a launch checklist covering licences and food-safety obligations the founder confirms.

Exit criteria: a stranger can apply, be approved and sell; a customer in Sylhet can order from several stores in one checkout and receive it with one delivery; the founder can see and run everything from one console.

**Phase 2 (M–L):** seller-managed delivery as an approved option, notifications, richer seller tools, youth reseller sourcing from producers (linked stock) at scale, saved addresses, review and dispute tools. **Phase 3 (L):** online payments, automated payouts after legal review, courier integration, expansion beyond Sylhet.

### 11.14 Decisions I need from you (with my recommended defaults)

| # | Question | Default if you just say "go" |
|---|---|---|
| Q1 | **The 10 launch stores:** name, category focus and sourcing for each | Cannot be defaulted: needed before 1A seeding and 1E content. Until then the seed creates nothing fictional |
| Q2 | **Evidence per seller type** and whether to collect national ID numbers | Individual: photo ID. Farmer/Producer: photo ID plus farm or product photos. Youth Entrepreneur: photo ID plus product photos (student or institution ID optional). Business: photo ID plus trade licence where one exists. ID image stored privately; do not store the ID number |
| Q3 | **Customer login** | Phone number and password for the pilot (no SMS cost); add one-time codes later |
| Q4 | **Sylhet delivery zones, fees, free-delivery threshold, minimum order, delivery days** | You supply the zones and fees |
| Q5 | **Collecting goods from external sellers** | Seller drops at your hub, or you collect inside the same zone; recorded per order |
| Q6 | **Settlement with external sellers** | Weekly manual statement, paid manually, written agreement, legal advice first |
| Q7 | **Bottom navigation** | Six items as you listed; Profile stays in the bar |
| Q8 | **Market Prices and Regional Products pages** | Hide Market Prices; fold Regional Products into category and origin filters |
| Q9 | **Seller terms and product policy** (prohibited items, food-safety rules, returns) | You or your adviser provide the text; I will draft a plain-language starting point |
| Q11 | **Video in store updates** | Photos only in the MVP; add short video after the pilot once storage and phone performance are known |
| Q12 | **Claims policy** for production and sourcing text | Seller's own statement, labelled as such; no organic, chemical-free or similar claims without evidence an admin has seen |
| Q13 | **No global feed** | Confirm: updates appear only on a store's own page, on linked product pages, and later in a buyer-built "Following" tab |
| Q10 | **Is the founder one legal business behind all 10 stores?** | Assume yes: stores are trade identities for management reporting, not separate legal sellers |

### 11.15 Resolution of 11.14 and Phase 1A status (2026-11-22)

You replied "go with defaults". Recorded as follows.

| # | Status |
|---|---|
| Q1 | **Open, no default.** The database creates no launch store. `create_founder_store()` exists; seeding the 10 stores waits for names, categories and sourcing |
| Q2, Q3, Q5–Q13 | **Defaults accepted** as written in 11.14. Q2 is enforced in part: approval is refused without an identity document. Q3 (phone login) needs the Supabase project |
| Q4 | **Open, no default.** The tables exist (`delivery_zones`, `zone_upazilas`, `delivery_zone_fees`) but hold no rows. Without a fee row for an upazila, checkout rejects delivery to it. Supply zones, fees and the free-delivery threshold |

**Built in Phase 1A (database and data only, all tested on PostgreSQL 16 with reversible migrations):**

| Migration | Content |
|---|---|
| 20261122000001 seller onboarding | Seller applications with status history and private document records; submit, resubmit, withdraw, review (approve needs an identity document), suspend, reinstate; stores have `published`, `operation_mode`, `delivery_arrangement`, `seller_type`; a store outside Sylhet is allowed (`district_id`); approved stores publish listings directly, admins can reject; store sourcing entries, store updates (5 a day, 6 photos, staff can hide), follows |
| 20261122000002 geography and categories | The 10 categories; listing origin district (required to publish); inventory locations; service areas |
| 20261122000003 delivery and operations | `place_order_v3`: only service-area districts, one platform delivery fee per order from the zone fee (free above the threshold), pickup carries no fee, seller-managed delivery is refused for now; founder handover workflow (`advance_order_delivery`: pending, preparing, ready for delivery, out for delivery, delivered or failed) tied to the fulfilments; delivery fee posts to a `delivery_revenue` account and never to a seller; unit cost with moving average, cost snapshot per line, `store_profit_loss` view; sellers can no longer read an order's phone and address, they use the `seller_orders` view (first name and upazila only) |
| 20261122000004 search | `search_listings` and `search_stores` (product, category, store, origin district or upazila, retail or wholesale), RLS applies |

Removed from the demo front end: ratings, order counts, review counts, "verified" badges and the verified-sellers filter. The demo sellers still exist as clearly labelled sample data until real stores replace them. The seed no longer contains any seller, store, offer or rating.

**Still to do, blocked or next:** Supabase project and credentials (auth, storage bucket for documents); Q1 and Q4 inputs; Phase 1B onward (UI over these tables). `place_order_v2` is dropped: the demo checkout still uses localStorage and is not affected.

### 11.16 Phase 1B status (2026-11-22)

Built on the sample catalogue (the front end is still not connected to Supabase):

- Navigation: Home, Categories, Stores, Cart, Orders, Profile (six items); desktop header links Categories, Stores, Become a Seller.
- `/categories/[slug]` with filters (product origin: Sylhet division, other districts, or one district; retail or wholesale; price; area) and price sorting. `/category/[slug]` redirects.
- `/stores` directory (filter by category and product origin) and `/stores/[slug]` storefronts with tabs Products (grouped by category), About and sourcing, Updates (empty until real stores post). `/seller/[slug]` redirects.
- Homepage rebuilt in plan order with the no-duplicate "used" list: category row, campaign (hidden, none configured), shop by category (no products), stores, produced in Sylhet, other districts by district, wholesale. "Fresh today" and "Recently added" stay hidden because they need real harvest and listing dates. The invented homepage stores were deleted.
- Search also matches origin district and store name.
- Not done: Become a Seller flow (1C), real data wiring (needs Supabase), product page origin/inventory/harvest date (needs real listings).

### 11.17 Phase 1C status (2026-11-22)

Seller onboarding and the seller dashboard are built as a **preview**: the data layer `src/lib/applications.ts` mirrors the database functions of migration 20261122000001 (same states, same rules: evidence per seller type, approval needs an identity document, request-info and reject need a note, 5 updates a day, publishing needs an approved store and a stated origin) but stores everything in the browser's localStorage. Replace its function bodies with RPC calls when Supabase is connected; the pages stay.

- `/become-a-seller`: five-step application (who, where, what, evidence, agreements); customers register first. `/seller/register` redirects.
- `/become-a-seller/status`: submitted, in review, needs information (answer and resubmit), approved, rejected, withdrawn; withdraw; evidence list; history.
- `/admin/applications`: review queue by status, evidence check, start review, approve, request information, reject, event log. Admin access is the demo login checkbox only.
- `/seller/dashboard` (own store only): products with origin district required and publish gated by approval, sourcing entries, production note, store updates, orders placeholder that states the seller will not see customer phone or address. The invented demo dashboard was removed. Register no longer offers a seller role; a seller is a customer with an approved application.
- Not in the preview: real file upload (only file names are kept), a public page for approved preview stores (storefronts are static from the sample catalogue), photos on updates, stock movements, orders. All need Supabase.
