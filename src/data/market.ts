// Derived discovery facts over the demo catalogue: product origin district, Sylhet or elsewhere, store lists.
// DEMO: origins come from the catalogue text; real listings carry origin_district_id.
import { categories, getCategory, getSeller, offersFor, products, sellers, type Product } from "./catalog";

export const SYLHET_DISTRICTS = ["সিলেট", "মৌলভীবাজার", "হবিগঞ্জ", "সুনামগঞ্জ"];

const fixed: Record<string, string> = {
  orange: "সিলেট", "handi-doi": "সিলেট", lemon: "সিলেট", shitalpati: "সিলেট", "sreemangal-tea": "মৌলভীবাজার",
  "himsagar-mango": "রাজশাহী", potato: "মুন্সিগঞ্জ", onion: "পাবনা", tomato: "যশোর", "khati-honey": "বাগেরহাট",
  "mustard-oil": "মানিকগঞ্জ", "dhaka-bakarkhani": "ঢাকা", "jamdani-saree": "নারায়ণগঞ্জ",
};
/** District a product comes from. */
export const originDistrict = (p: Product) => fixed[p.slug] ?? p.famous ?? p.origin.split(/[\/,]/).pop()!.trim();
export const isSylhetOrigin = (p: Product) => SYLHET_DISTRICTS.includes(originDistrict(p));

export const storesFor = (p: Product) => offersFor(p).map((o) => getSeller(o.sellerSlug)!);
export const productsOfStore = (slug: string) => products.filter((p) => offersFor(p).some((o) => o.sellerSlug === slug));
export const storeCategories = (slug: string) => {
  const set = new Set(productsOfStore(slug).map((p) => p.category));
  return categories.filter((c) => set.has(c.slug));
};
export const storeOrigins = (slug: string) => [...new Set(productsOfStore(slug).map(originDistrict))];
export const productsByCategory = (list: Product[]) => categories.map((c) => ({ c, items: list.filter((p) => p.category === c.slug) })).filter((g) => g.items.length);
export { getCategory, sellers };
