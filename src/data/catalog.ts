// DEMO DATA — illustrative only. Prices, sellers and stock are not real.
export type Motif = "tuber" | "round" | "grain" | "elongated" | "leaf" | "fish" | "egg" | "jar" | "powder";

export type Category = { slug: string; bn: string; en: string; motif: Motif; color: string; blurb: string };

export const categories: Category[] = [
  { slug: "vegetables", bn: "শাকসবজি", en: "Vegetables", motif: "round", color: "#cfe5d2", blurb: "টাটকা মৌসুমি সবজি সরাসরি কৃষকের কাছ থেকে" },
  { slug: "fruits", bn: "ফলমূল", en: "Fruits", motif: "round", color: "#f4e2b8", blurb: "দেশি ও মৌসুমি ফল" },
  { slug: "rice-pulses", bn: "চাল ও ডাল", en: "Rice & Pulses", motif: "grain", color: "#efe6cf", blurb: "পাইকারি ও খুচরা চাল, ডাল ও শস্য" },
  { slug: "spices", bn: "মসলা", en: "Spices", motif: "powder", color: "#f0d9b5", blurb: "গুঁড়া ও আস্ত মসলা" },
  { slug: "fish-meat", bn: "মাছ ও মাংস", en: "Fish & Meat", motif: "fish", color: "#d3e3ee", blurb: "তাজা মাছ, ডিম ও প্রাণিজ পণ্য" },
  { slug: "oil-honey", bn: "তেল ও মধু", en: "Oil & Honey", motif: "jar", color: "#f3e5b0", blurb: "ঘানি-ভাঙা তেল, খাঁটি মধু ও ঘি" },
];

export type Product = {
  slug: string; bn: string; en: string; category: string; unit: string; motif: Motif;
  color: string; accent: string; base: { retail: number; wholesale: number };
  origin: string; desc: string; minWholesale: number; season?: string;
};

export const products: Product[] = [
  { slug: "potato", bn: "আলু", en: "Potato", category: "vegetables", unit: "কেজি", motif: "tuber", color: "#e9dcc0", accent: "#b88b4a", base: { retail: 36, wholesale: 31 }, origin: "মুন্সিগঞ্জ / বগুড়া", desc: "ভাজি, ভর্তা ও তরকারির জন্য উপযুক্ত দেশি আলু। বাছাই করা, মাটি ঝাড়া।", minWholesale: 50 },
  { slug: "onion", bn: "পেঁয়াজ", en: "Onion", category: "vegetables", unit: "কেজি", motif: "round", color: "#efd9d8", accent: "#a8454f", base: { retail: 62, wholesale: 54 }, origin: "পাবনা / ফরিদপুর", desc: "ঝাঁঝালো দেশি পেঁয়াজ, ভালো সংরক্ষণক্ষম।", minWholesale: 40 },
  { slug: "tomato", bn: "টমেটো", en: "Tomato", category: "vegetables", unit: "কেজি", motif: "round", color: "#f6d9d2", accent: "#c4452f", base: { retail: 48, wholesale: 40 }, origin: "যশোর / রাজশাহী", desc: "পাকা ও লাল টমেটো, সালাদ ও রান্নার জন্য।", minWholesale: 30 },
  { slug: "green-chili", bn: "কাঁচা মরিচ", en: "Green Chili", category: "vegetables", unit: "কেজি", motif: "elongated", color: "#d9e8cf", accent: "#3d8a3a", base: { retail: 90, wholesale: 76 }, origin: "বগুড়া", desc: "ঝাল ও সতেজ কাঁচা মরিচ।", minWholesale: 20 },
  { slug: "brinjal", bn: "বেগুন", en: "Brinjal", category: "vegetables", unit: "কেজি", motif: "elongated", color: "#e1d9ec", accent: "#5b3f8c", base: { retail: 55, wholesale: 46 }, origin: "যশোর", desc: "মসৃণ ও তাজা লম্বা বেগুন।", minWholesale: 30 },
  { slug: "cauliflower", bn: "ফুলকপি", en: "Cauliflower", category: "vegetables", unit: "পিস", motif: "leaf", color: "#dfead6", accent: "#5a9a4c", base: { retail: 40, wholesale: 32 }, origin: "মানিকগঞ্জ", desc: "শীতকালীন সাদা ও ঘন ফুলকপি।", minWholesale: 50, season: "শীত" },
  { slug: "garlic", bn: "রসুন", en: "Garlic", category: "spices", unit: "কেজি", motif: "round", color: "#f0ebe0", accent: "#b9a98a", base: { retail: 170, wholesale: 148 }, origin: "মেহেরপুর", desc: "ঝাঁঝালো দেশি রসুন।", minWholesale: 25 },
  { slug: "miniket-rice", bn: "মিনিকেট চাল", en: "Miniket Rice", category: "rice-pulses", unit: "কেজি", motif: "grain", color: "#f1ead8", accent: "#c9b27a", base: { retail: 72, wholesale: 66 }, origin: "দিনাজপুর", desc: "চিকন, সাদা ও ঝরঝরে মিনিকেট চাল।", minWholesale: 50 },
  { slug: "masoor-dal", bn: "মসুর ডাল", en: "Red Lentil", category: "rice-pulses", unit: "কেজি", motif: "grain", color: "#f3dcc4", accent: "#d0752f", base: { retail: 125, wholesale: 112 }, origin: "পাবনা", desc: "পরিষ্কার বাছাই করা মসুর ডাল।", minWholesale: 25 },
  { slug: "himsagar-mango", bn: "হিমসাগর আম", en: "Himsagar Mango", category: "fruits", unit: "কেজি", motif: "round", color: "#f4eab6", accent: "#a6b53a", base: { retail: 110, wholesale: 92 }, origin: "রাজশাহী / সাতক্ষীরা", desc: "মিষ্টি ও সুগন্ধি হিমসাগর আম।", minWholesale: 40, season: "গ্রীষ্ম" },
  { slug: "lemon", bn: "লেবু", en: "Lemon", category: "fruits", unit: "হালি", motif: "round", color: "#f4efb8", accent: "#c8bb2a", base: { retail: 32, wholesale: 26 }, origin: "সিলেট", desc: "রসালো সিলেটি লেবু।", minWholesale: 100 },
  { slug: "turmeric-powder", bn: "হলুদ গুঁড়া", en: "Turmeric Powder", category: "spices", unit: "কেজি", motif: "powder", color: "#f6e3a8", accent: "#d19a14", base: { retail: 340, wholesale: 300 }, origin: "কুষ্টিয়া", desc: "ভেজালমুক্ত ঘরে-গুঁড়া হলুদ।", minWholesale: 10 },
  { slug: "rui-fish", bn: "রুই মাছ", en: "Rui Fish", category: "fish-meat", unit: "কেজি", motif: "fish", color: "#d5e4ef", accent: "#4f7da1", base: { retail: 290, wholesale: 255 }, origin: "ময়মনসিংহ", desc: "চাষের তাজা রুই মাছ।", minWholesale: 20 },
  { slug: "farm-egg", bn: "দেশি ডিম", en: "Farm Eggs", category: "fish-meat", unit: "ডজন", motif: "egg", color: "#f3e8d8", accent: "#c79a68", base: { retail: 165, wholesale: 148 }, origin: "গাজীপুর", desc: "খামারের তাজা ডিম।", minWholesale: 30 },
  { slug: "mustard-oil", bn: "সরিষার তেল", en: "Mustard Oil", category: "oil-honey", unit: "লিটার", motif: "jar", color: "#f3e5a8", accent: "#c79b1b", base: { retail: 260, wholesale: 235 }, origin: "ঘানি-ভাঙা, মানিকগঞ্জ", desc: "কাঠের ঘানিতে ভাঙা খাঁটি সরিষার তেল।", minWholesale: 20 },
  { slug: "khati-honey", bn: "খাঁটি মধু", en: "Pure Honey", category: "oil-honey", unit: "কেজি", motif: "jar", color: "#f4dc9a", accent: "#c9831a", base: { retail: 650, wholesale: 580 }, origin: "সুন্দরবন", desc: "মৌয়ালদের সংগ্রহ করা খাঁটি মধু।", minWholesale: 10 },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);

export type Seller = {
  slug: string; bn: string; en: string; location: string; division: string; verified: boolean;
  kind: "কৃষক" | "খামারি" | "পাইকার" | "আড়তদার" | "দোকানদার"; rating: number; orders: number; since: number;
  desc: string; priceFactor: number; cats: string[];
};

export const sellers: Seller[] = [
  { slug: "sylhet-krishi-bhandar", bn: "সিলেট কৃষি ভাণ্ডার", en: "Sylhet Krishi Bhandar", location: "সিলেট", division: "সিলেট", verified: true, kind: "পাইকার", rating: 4.7, orders: 1280, since: 2019, desc: "সিলেট অঞ্চলের সবজি ও মসলার নির্ভরযোগ্য পাইকার।", priceFactor: 0.97, cats: ["vegetables", "spices", "fruits"] },
  { slug: "bogura-farmers-hub", bn: "বগুড়া ফার্মার্স হাব", en: "Bogura Farmers Hub", location: "বগুড়া", division: "রাজশাহী", verified: true, kind: "আড়তদার", rating: 4.8, orders: 2140, since: 2018, desc: "উত্তরাঞ্চলের আলু, মরিচ ও সবজির আড়ত।", priceFactor: 0.94, cats: ["vegetables", "spices"] },
  { slug: "dhaka-fresh-trade", bn: "ঢাকা ফ্রেশ ট্রেড", en: "Dhaka Fresh Trade", location: "ঢাকা", division: "ঢাকা", verified: true, kind: "পাইকার", rating: 4.5, orders: 3420, since: 2017, desc: "রাজধানীতে দ্রুত ডেলিভারির পাইকারি সরবরাহকারী।", priceFactor: 1.03, cats: ["vegetables", "fruits", "fish-meat", "oil-honey"] },
  { slug: "dinajpur-rice-mill", bn: "দিনাজপুর রাইস মিল", en: "Dinajpur Rice Mill", location: "দিনাজপুর", division: "রংপুর", verified: true, kind: "পাইকার", rating: 4.6, orders: 980, since: 2015, desc: "চাল ও ডালের সরাসরি মিল-সরবরাহ।", priceFactor: 0.96, cats: ["rice-pulses"] },
  { slug: "jashore-green-farm", bn: "যশোর গ্রিন ফার্ম", en: "Jashore Green Farm", location: "যশোর", division: "খুলনা", verified: false, kind: "কৃষক", rating: 4.3, orders: 310, since: 2022, desc: "নিজস্ব খামারের টমেটো, বেগুন ও মৌসুমি সবজি।", priceFactor: 0.95, cats: ["vegetables"] },
  { slug: "chattogram-bazar-ghar", bn: "চট্টগ্রাম বাজার ঘর", en: "Chattogram Bazar Ghar", location: "চট্টগ্রাম", division: "চট্টগ্রাম", verified: true, kind: "দোকানদার", rating: 4.4, orders: 760, since: 2020, desc: "পরিবারের জন্য মুদি ও খাদ্যসামগ্রী।", priceFactor: 1.06, cats: ["rice-pulses", "spices", "oil-honey", "fish-meat"] },
  { slug: "rajshahi-orchard", bn: "রাজশাহী অর্চার্ড", en: "Rajshahi Orchard", location: "রাজশাহী", division: "রাজশাহী", verified: true, kind: "কৃষক", rating: 4.9, orders: 640, since: 2016, desc: "বাগান থেকে সরাসরি আম ও মৌসুমি ফল।", priceFactor: 0.98, cats: ["fruits"] },
  { slug: "mymensingh-matshya", bn: "ময়মনসিংহ মৎস্য খামার", en: "Mymensingh Matshya", location: "ময়মনসিংহ", division: "ময়মনসিংহ", verified: true, kind: "খামারি", rating: 4.6, orders: 870, since: 2019, desc: "চাষের মাছ ও খামারের ডিম।", priceFactor: 0.96, cats: ["fish-meat"] },
];
export const getSeller = (slug: string) => sellers.find((s) => s.slug === slug);

export type Offer = { grade: string; rating: number; reviews: number; sellerSlug: string; retail: number; wholesale: number; stock: number; minWholesale: number };

// Deterministic demo offers: every seller whose categories include the product's category.
export function offersFor(p: Product): Offer[] {
  const list = sellers.filter((s) => s.cats.includes(p.category));
  return list.map((s, i) => {
    const jitter = 1 + (((p.slug.length * 7 + i * 5) % 7) - 3) / 100;
    const f = s.priceFactor * jitter;
    return {
      grade: ["A", "A", "B", "A"][i % 4],
      rating: Math.round((s.rating - 0.2 + ((p.slug.length + i) % 4) * 0.1) * 10) / 10,
      reviews: 12 + ((p.slug.length * 13 + i * 29) % 140),
      sellerSlug: s.slug,
      retail: Math.round(p.base.retail * f),
      wholesale: Math.round(p.base.wholesale * f),
      stock: 80 + ((p.slug.length * 37 + i * 91) % 900),
      minWholesale: p.minWholesale,
    };
  }).sort((a, b) => a.retail - b.retail);
}

export function summary(p: Product) {
  const o = offersFor(p);
  return {
    offers: o,
    minRetail: Math.min(...o.map((x) => x.retail)),
    minWholesale: Math.min(...o.map((x) => x.wholesale)),
    sellerCount: o.length,
    top: getSeller(o[0].sellerSlug)!,
    anyVerified: o.some((x) => getSeller(x.sellerSlug)?.verified),
  };
}
export const bn = (n: number | string) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
export const taka = (n: number) => `৳${n.toLocaleString("en-US")}`;
