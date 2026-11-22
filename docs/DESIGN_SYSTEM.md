# PosraBazar design system (Deep Orange)

Tokens live in `tailwind.config.ts`; global rules in `src/app/globals.css`. Use token names, never raw hex, in components.

## Palette

| Token | Hex | Use |
|---|---|---|
| `primary` | `#C2410C` | Primary buttons, links, key emphasis. `primary-50/100` tints, `primary-700` hover, `primary-800` text on tints |
| `secondary` | `#EA580C` | Hover states, large accents, charts. **Not** for small text or white-text buttons |
| `accent` | `#F59E0B` | Badges, ratings, highlights. Always pair with `ink` text. `accent-700` (`#B45309`) when amber text is needed on light |
| `cream` | `#FFFBF5` | Page background |
| `surface` | `#FFFFFF` | Cards, inputs, table bodies |
| `ink` | `#292524` | Primary text and dark panels (`ink-700/800/900` for deeper panels) |
| `muted` | `#78716C` | Secondary text, captions |
| `line` | `#E7E0D8` | Borders and dividers |
| `tint` | `#F5EFE6` | Subtle fills, hover, skeletons |

## Contrast (WCAG 2.1, calculated)

| Pair | Ratio | Rule |
|---|---|---|
| white on `primary` | 5.18 : 1 | OK for all text. This is the button colour |
| white on `secondary` | 3.56 : 1 | Large text and icons only |
| `ink` on `accent` | 7.06 : 1 | OK |
| `primary` on `cream` | 5.02 : 1 | OK for links |
| `ink` on `cream` | 14.71 : 1 | Body text |
| `muted` on `cream` / on white | 4.65 / 4.80 : 1 | Passes; keep secondary text at 14 px or larger |
| `secondary` on `cream` | 3.45 : 1 | Do not use for body-size text |
| `accent` on `cream` | about 2 : 1 | Never use for text; use `accent-700` |
| `line` against `cream` | 1.27 : 1 | Decorative only; interactive controls need a visible hover and focus state |

Focus rings use `primary` (2 px, offset 2 px).

## Typography

- **Bengali:** Tiro Bangla (owner decision; replaces the earlier Noto Sans Bengali choice). **English and digits:** Inter. Both load with `next/font`; `font-sans` lists Inter first and Tiro Bangla second, so each character is drawn by the font that covers it.
- Tiro Bangla has **one weight (400)**. Bengali emphasis therefore uses size, colour, spacing and rules, not bold; `font-synthesis-weight: none` prevents browser faux-bold. Use Inter 600/700 where real bold is needed (English labels, prices in Latin digits).
- Headings are semibold with line-height 1.3; body line-height 1.65 (Bengali needs the extra room).
- Minimum body size 14 px; touch targets at least 40 px.

## Surfaces and motion

Flat and minimal: white surface, 1 px `line` border, 4–8 px radius, a very light shadow that grows slightly on hover. No blur, gradients or ornamental patterns. Respect `prefers-reduced-motion`.

## Photography plan (placeholder illustrations are temporary)

Product pages need real photographs. Brief for producers and student sellers:
1. Natural daylight, plain light background, product fills about 70% of the frame.
2. One hero image per product plus a close-up, a scale/weight shot and a packaging shot.
3. Fresh produce and fish shot on the day of listing; harvest or catch date is recorded in the listing, not in the picture.
4. At least 1200 px on the long side; the app produces responsive sizes.
5. No watermarks, no stock images of a different origin: origin transparency is the product's selling point.

## Current status

Phase 0 applied the tokens, fonts and flat surfaces to the whole prototype and removed the earlier visual style. Page layouts have not been redesigned yet; that follows the Phase 1 information architecture.
