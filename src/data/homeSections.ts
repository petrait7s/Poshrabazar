// Homepage sections in the order of the plan (11.6). A product shown in one section is excluded from every later one;
// a section with nothing to show is dropped. DEMO: derived from the sample catalogue.
import { categories, getSeller, products, offersFor, type Product } from "./catalog";
import { isSylhetOrigin, originDistrict, productsByCategory, productsOfStore, sellers } from "./market";

/** Admin-curated seasonal campaign. None is configured, so the section stays hidden. */
export const campaign: { title: string; blurb: string; slugs: string[] } | null = null;

export function buildHome() {
  const used = new Set<string>();
  const take = (list: Product[], max: number) => { const out = list.filter((p) => !used.has(p.slug)).slice(0, max); out.forEach((p) => used.add(p.slug)); return out; };

  const camp = campaign ? { ...campaign, items: take(campaign.slugs.map((s) => products.find((p) => p.slug === s)!).filter(Boolean), 6) } : null;

  const featured = [...sellers].sort((a, b) => productsOfStore(b.slug).length - productsOfStore(a.slug).length).slice(0, 3)
    .map((s) => ({ s, items: take(productsOfStore(s.slug), 3) })).filter((x) => x.items.length);

  const sylhet = productsByCategory(take(products.filter(isSylhetOrigin), 8));

  const others = products.filter((p) => !isSylhetOrigin(p) && !used.has(p.slug));
  const byDistrict = new Map<string, Product[]>();
  for (const p of others) { const d = originDistrict(p); byDistrict.set(d, [...(byDistrict.get(d) ?? []), p]); }
  const fromOthers = [...byDistrict.entries()].map(([district, list]) => ({ district, items: take(list, 3) })).filter((g) => g.items.length).slice(0, 5);

  const wholesale = take(products.filter((p) => offersFor(p).length), 6);

  return { camp, featured, sylhet, fromOthers, wholesale, counts: categories.map((c) => ({ c, n: products.filter((p) => p.category === c.slug).length })) };
}
export { getSeller };
