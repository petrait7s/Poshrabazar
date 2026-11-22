// DEMO content for the homepage. Prices come from the catalogue; origin, producers, distances, availability and stores are illustrative.
import { bn, getProduct, summary } from "./catalog";
import type { ArtKind } from "@/components/ProductImage";

export type Avail = "fresh" | "stock" | "low" | "out";
export type HomeCat = "all" | "veg" | "fruit" | "fish" | "dairy" | "rice" | "other";

export const homeCats: { key: HomeCat; label: string; icon: string }[] = [
  { key: "all", label: "সব", icon: "M4 7h16M4 12h16M4 17h16" },
  { key: "veg", label: "শাকসবজি", icon: "M5 19c0-8 5-13 14-14 0 9-5 14-14 14zM5 19L13 11" },
  { key: "fruit", label: "ফলমূল", icon: "M12 7c-4-2.5-8 0-8 5 0 4.5 3 8 5.5 8 1 0 1.5-.5 2.5-.5s1.5.5 2.5.5c2.5 0 5.5-3.5 5.5-8 0-5-4-7.5-8-5zM12 7c0-2 1-3.5 3-4" },
  { key: "fish", label: "মাছ", icon: "M3 12c3-5 9-6 13-3l5-3v12l-5-3c-4 3-10 2-13-3zM8 11.2h.01" },
  { key: "dairy", label: "দুগ্ধজাত", icon: "M9 3h6M10 3v4l-3 4v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-9l-3-4V3M7 13h10" },
  { key: "rice", label: "চাল ও ডাল", icon: "M12 21V8M12 8c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4zM12 8c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 14c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4zM12 14c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4z" },
  { key: "other", label: "অন্যান্য", icon: "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8" },
];

export type HomeItem = { slug: string; cat: Exclude<HomeCat, "all">; art: ArtKind; title: string; upazila: string; latin: string; km: number; producer: string; avail: Avail; note: string };

export const homeItems: HomeItem[] = [
  { slug: "orange", cat: "fruit", art: "orange", title: "জৈন্তাপুরের কমলা", upazila: "জৈন্তাপুর", latin: "JAINTIAPUR", km: 28, producer: "পাহাড়ি কমলা বাগান", avail: "fresh", note: "আজ সকালে তোলা" },
  { slug: "rui-fish", cat: "fish", art: "fish", title: "হাওরের রুই", upazila: "গোয়াইনঘাট", latin: "GOWAINGHAT", km: 25, producer: "মৎস্য চাষি দল", avail: "fresh", note: "আজ ধরা" },
  { slug: "lemon", cat: "fruit", art: "lemon", title: "সাতকরা লেবু", upazila: "কানাইঘাট", latin: "KANAIGHAT", km: 37, producer: "পাহাড়ি লেবু বাগান", avail: "low", note: "মাত্র ৩০টি বাকি" },
  { slug: "miniket-rice", cat: "rice", art: "rice", title: "বোরো ধানের চাল", upazila: "বিয়ানীবাজার", latin: "BEANIBAZAR", km: 45, producer: "কৃষক সমিতি", avail: "stock", note: "মজুত আছে" },
  { slug: "cauliflower", cat: "veg", art: "veg", title: "শীতের ফুলকপি", upazila: "সিলেট সদর", latin: "SYLHET SADAR", km: 4, producer: "শহরতলির সবজি খামার", avail: "fresh", note: "আজ সকালে তোলা" },
  { slug: "handi-doi", cat: "dairy", art: "doi", title: "মাটির হাঁড়ির দই", upazila: "বিয়ানীবাজার", latin: "BEANIBAZAR", km: 45, producer: "স্থানীয় দুগ্ধ খামার", avail: "out", note: "আপাতত নেই" },
  { slug: "coxsbazar-shutki", cat: "other", art: "shutki", title: "হাওরের শুটকি", upazila: "গোয়াইনঘাট", latin: "GOWAINGHAT", km: 25, producer: "শুটকি আড়ত", avail: "stock", note: "মজুত আছে" },
];

export const takaBn = (n: number) => `৳${bn(n.toLocaleString("en-US"))}`;

/** Prices and the cheapest seller come from the catalogue so the card and the product page agree. */
export function priced(it: HomeItem) {
  const p = getProduct(it.slug)!;
  const s = summary(p);
  return { p, retail: s.minRetail, wholesale: s.minWholesale, moq: p.minWholesale, unit: p.unit, sellerSlug: s.offers[0].sellerSlug };
}

export const regionDefs = [
  { bn: "সিলেট সদর", latin: "SYLHET SADAR" },
  { bn: "গোয়াইনঘাট", latin: "GOWAINGHAT" },
  { bn: "জৈন্তাপুর", latin: "JAINTIAPUR" },
  { bn: "কানাইঘাট", latin: "KANAIGHAT" },
  { bn: "বিয়ানীবাজার", latin: "BEANIBAZAR" },
];

export type HomeStore = { slug: string; name: string; mark: string; place: string; line: string; items: string[]; intro?: string };
export const featuredStore: HomeStore = { slug: "surma-fresh", name: "সুরমা ফ্রেশ", mark: "সু", place: "দক্ষিণ সুরমা, সিলেট", line: "কমলা, লেবু ও শীতের সবজি", intro: "এলাকার ৫ জন উৎপাদকের কাছ থেকে কমলা, লেবু ও শীতের সবজি সংগ্রহ করে বিক্রি করে।", items: ["orange", "lemon", "cauliflower"] };
export const otherStores: (HomeStore & { markBg: string; markFg: string })[] = [
  { slug: "haor-haat", name: "হাওর হাট", mark: "হা", place: "গোয়াইনঘাট", line: "মাছ, শুটকি ও চাল", items: ["rui-fish", "coxsbazar-shutki", "miniket-rice"], markBg: "#FFEDD5", markFg: "#7C2D12" },
  { slug: "jalalabad-bazar-ghar", name: "জালালাবাদ বাজার ঘর", mark: "জা", place: "গোলাপগঞ্জ", line: "শীতের সবজি ও আঞ্চলিক পণ্য", items: ["cauliflower", "handi-doi", "coxsbazar-shutki"], markBg: "#FEF3C7", markFg: "#92400E" },
];
export const artOf = (slug: string): ArtKind => homeItems.find((i) => i.slug === slug)!.art;
