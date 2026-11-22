// DEMO DATA — illustrative only. Prices, sellers and stock are not real.
// No ratings, order counts, reviews or verification claims exist here on purpose: those must come from real activity.
export type Motif = "tuber" | "round" | "grain" | "elongated" | "leaf" | "fish" | "egg" | "jar" | "powder" | "pot" | "sweet" | "cloth" | "mat" | "dried";

export type Category = { slug: string; bn: string; en: string; motif: Motif; color: string; blurb: string };

export const categories: Category[] = [
  { slug: "vegetables", bn: "সবজি", en: "Vegetables", motif: "round", color: "#E3EBD3", blurb: "তাজা মৌসুমি সবজি" },
  { slug: "fruits", bn: "ফল", en: "Fruits", motif: "round", color: "#FDE9C8", blurb: "মৌসুমি ও আঞ্চলিক ফল" },
  { slug: "fish", bn: "মাছ", en: "Fish", motif: "fish", color: "#DCE7EE", blurb: "নদী, হাওর ও পুকুরের মাছ, শুটকি" },
  { slug: "rice-grains", bn: "চাল ও শস্য", en: "Rice and grains", motif: "grain", color: "#F3EBD8", blurb: "চাল, আটা ও অন্যান্য শস্য" },
  { slug: "pulses", bn: "ডাল", en: "Pulses", motif: "grain", color: "#F3DCC4", blurb: "মসুর, মুগ, ছোলা ও অন্যান্য ডাল" },
  { slug: "dairy", bn: "দুধ ও দুগ্ধজাত", en: "Dairy", motif: "pot", color: "#F2E6D3", blurb: "দুধ, দই, ঘি, পনির" },
  { slug: "poultry-eggs", bn: "মুরগি ও ডিম", en: "Poultry and eggs", motif: "egg", color: "#F1E6D6", blurb: "দেশি মুরগি, হাঁস, ডিম" },
  { slug: "spices-agri", bn: "মসলা ও কৃষিপণ্য", en: "Spices and agricultural products", motif: "powder", color: "#F6E3A8", blurb: "মসলা, তেল, মধু, চা" },
  { slug: "regional-food", bn: "আঞ্চলিক ও প্রক্রিয়াজাত খাবার", en: "Regional and processed food", motif: "sweet", color: "#F6E1D0", blurb: "মিষ্টি, পিঠা, আচার, হাতে তৈরি খাবার" },
  { slug: "other-approved", bn: "অন্যান্য অনুমোদিত পণ্য", en: "Other approved", motif: "mat", color: "#E7E2C8", blurb: "অ্যাডমিন অনুমোদিত অন্য পণ্য" },
];

export type Product = {
  slug: string; bn: string; en: string; category: string; unit: string; motif: Motif;
  color: string; accent: string; base: { retail: number; wholesale: number };
  origin: string; desc: string; minWholesale: number; season?: string;
  /** District this product is famous for (sold nationwide). */
  famous?: string;
};

/** Bangla genitive: বগুড়া → বগুড়ার, নাটোর → নাটোরের */
export const genitive = (d: string) => (/[ািীুূেৈোৌা]$/.test(d) ? `${d}র` : `${d}ের`);

export const products: Product[] = [
  { slug: "potato", bn: "আলু", en: "Potato", category: "vegetables", unit: "কেজি", motif: "tuber", color: "#e9dcc0", accent: "#b88b4a", base: { retail: 36, wholesale: 31 }, origin: "মুন্সিগঞ্জ / বগুড়া", desc: "ভাজি, ভর্তা ও তরকারির জন্য উপযুক্ত দেশি আলু। বাছাই করা, মাটি ঝাড়া।", minWholesale: 50 },
  { slug: "onion", bn: "পেঁয়াজ", en: "Onion", category: "vegetables", unit: "কেজি", motif: "round", color: "#efd9d8", accent: "#a8454f", base: { retail: 62, wholesale: 54 }, origin: "পাবনা / ফরিদপুর", desc: "ঝাঁঝালো দেশি পেঁয়াজ, ভালো সংরক্ষণক্ষম।", minWholesale: 40 },
  { slug: "tomato", bn: "টমেটো", en: "Tomato", category: "vegetables", unit: "কেজি", motif: "round", color: "#f6d9d2", accent: "#c4452f", base: { retail: 48, wholesale: 40 }, origin: "যশোর / রাজশাহী", desc: "পাকা ও লাল টমেটো, সালাদ ও রান্নার জন্য।", minWholesale: 30 },
  { slug: "green-chili", bn: "কাঁচা মরিচ", en: "Green Chili", category: "vegetables", unit: "কেজি", motif: "elongated", color: "#d9e8cf", accent: "#3d8a3a", base: { retail: 90, wholesale: 76 }, origin: "বগুড়া", desc: "ঝাল ও সতেজ কাঁচা মরিচ।", minWholesale: 20 },
  { slug: "brinjal", bn: "বেগুন", en: "Brinjal", category: "vegetables", unit: "কেজি", motif: "elongated", color: "#e1d9ec", accent: "#5b3f8c", base: { retail: 55, wholesale: 46 }, origin: "যশোর", desc: "মসৃণ ও তাজা লম্বা বেগুন।", minWholesale: 30 },
  { slug: "cauliflower", bn: "ফুলকপি", en: "Cauliflower", category: "vegetables", unit: "পিস", motif: "leaf", color: "#dfead6", accent: "#5a9a4c", base: { retail: 40, wholesale: 32 }, origin: "মানিকগঞ্জ", desc: "শীতকালীন সাদা ও ঘন ফুলকপি।", minWholesale: 50, season: "শীত" },
  { slug: "garlic", bn: "রসুন", en: "Garlic", category: "vegetables", unit: "কেজি", motif: "round", color: "#f0ebe0", accent: "#b9a98a", base: { retail: 170, wholesale: 148 }, origin: "মেহেরপুর", desc: "ঝাঁঝালো দেশি রসুন।", minWholesale: 25 },
  { slug: "miniket-rice", bn: "মিনিকেট চাল", en: "Miniket Rice", category: "rice-grains", unit: "কেজি", motif: "grain", color: "#f1ead8", accent: "#c9b27a", base: { retail: 72, wholesale: 66 }, origin: "দিনাজপুর", desc: "চিকন, সাদা ও ঝরঝরে মিনিকেট চাল।", minWholesale: 50 },
  { slug: "masoor-dal", bn: "মসুর ডাল", en: "Red Lentil", category: "pulses", unit: "কেজি", motif: "grain", color: "#f3dcc4", accent: "#d0752f", base: { retail: 125, wholesale: 112 }, origin: "পাবনা", desc: "পরিষ্কার বাছাই করা মসুর ডাল।", minWholesale: 25 },
  { slug: "himsagar-mango", bn: "হিমসাগর আম", en: "Himsagar Mango", category: "fruits", unit: "কেজি", motif: "round", color: "#f4eab6", accent: "#a6b53a", base: { retail: 110, wholesale: 92 }, origin: "রাজশাহী / সাতক্ষীরা", desc: "মিষ্টি ও সুগন্ধি হিমসাগর আম।", minWholesale: 40, season: "গ্রীষ্ম" },
  { slug: "orange", bn: "কমলা", en: "Orange", category: "fruits", unit: "কেজি", motif: "round", color: "#FCE7C8", accent: "#F58A12", base: { retail: 180, wholesale: 155 }, origin: "জৈন্তাপুর", desc: "সিলেটের পাহাড়ি বাগানের মৌসুমি কমলা।", minWholesale: 25, season: "শীত" },
  { slug: "handi-doi", bn: "মাটির হাঁড়ির দই", en: "Clay-pot Doi", category: "dairy", unit: "কেজি", motif: "pot", color: "#F2E6D3", accent: "#B8743C", base: { retail: 240, wholesale: 210 }, origin: "বিয়ানীবাজার", desc: "স্থানীয় খামারের দুধে মাটির হাঁড়িতে জমানো দই।", minWholesale: 10 },
  { slug: "lemon", bn: "লেবু", en: "Lemon", category: "fruits", unit: "হালি", motif: "round", color: "#f4efb8", accent: "#c8bb2a", base: { retail: 32, wholesale: 26 }, origin: "সিলেট", desc: "রসালো সিলেটি লেবু।", minWholesale: 100 },
  { slug: "turmeric-powder", bn: "হলুদ গুঁড়া", en: "Turmeric Powder", category: "spices-agri", unit: "কেজি", motif: "powder", color: "#f6e3a8", accent: "#d19a14", base: { retail: 340, wholesale: 300 }, origin: "কুষ্টিয়া", desc: "ভেজালমুক্ত ঘরে-গুঁড়া হলুদ।", minWholesale: 10 },
  { slug: "rui-fish", bn: "রুই মাছ", en: "Rui Fish", category: "fish", unit: "কেজি", motif: "fish", color: "#d5e4ef", accent: "#4f7da1", base: { retail: 290, wholesale: 255 }, origin: "ময়মনসিংহ", desc: "চাষের তাজা রুই মাছ।", minWholesale: 20 },
  { slug: "farm-egg", bn: "দেশি ডিম", en: "Farm Eggs", category: "poultry-eggs", unit: "ডজন", motif: "egg", color: "#f3e8d8", accent: "#c79a68", base: { retail: 165, wholesale: 148 }, origin: "গাজীপুর", desc: "খামারের তাজা ডিম।", minWholesale: 30 },
  { slug: "mustard-oil", bn: "সরিষার তেল", en: "Mustard Oil", category: "spices-agri", unit: "লিটার", motif: "jar", color: "#f3e5a8", accent: "#c79b1b", base: { retail: 260, wholesale: 235 }, origin: "ঘানি-ভাঙা, মানিকগঞ্জ", desc: "কাঠের ঘানিতে ভাঙা খাঁটি সরিষার তেল।", minWholesale: 20 },
  { slug: "khati-honey", bn: "খাঁটি মধু", en: "Pure Honey", category: "spices-agri", unit: "কেজি", motif: "jar", color: "#f4dc9a", accent: "#c9831a", base: { retail: 650, wholesale: 580 }, origin: "সুন্দরবন", desc: "মৌয়ালদের সংগ্রহ করা খাঁটি মধু।", minWholesale: 10 },
  { slug: "bogura-doi", bn: "বগুড়ার দই", en: "Bogura Doi", category: "dairy", unit: "কেজি", motif: "pot", color: "#f3ead6", accent: "#b8743c", base: { retail: 260, wholesale: 228 }, origin: "বগুড়া", famous: "বগুড়া", desc: "মাটির পাতিলে জমানো, ঘন ও মিষ্টি বিখ্যাত বগুড়ার দই।", minWholesale: 20 },
  { slug: "natore-kachagolla", bn: "নাটোরের কাঁচাগোল্লা", en: "Natore Kachagolla", category: "regional-food", unit: "কেজি", motif: "sweet", color: "#f6e6d8", accent: "#ecd2a8", base: { retail: 520, wholesale: 470 }, origin: "নাটোর", famous: "নাটোর", desc: "ছানার নরম, সাদা কাঁচাগোল্লা — নাটোরের ঐতিহ্য।", minWholesale: 10 },
  { slug: "tangail-chomchom", bn: "টাঙ্গাইলের চমচম", en: "Tangail Chomchom", category: "regional-food", unit: "কেজি", motif: "sweet", color: "#f4dcd0", accent: "#b5683c", base: { retail: 480, wholesale: 430 }, origin: "টাঙ্গাইল", famous: "টাঙ্গাইল", desc: "রসে ভেজা, লালচে টাঙ্গাইলের চমচম।", minWholesale: 10 },
  { slug: "cumilla-roshmalai", bn: "কুমিল্লার রসমালাই", en: "Cumilla Roshmalai", category: "regional-food", unit: "কেজি", motif: "sweet", color: "#f6efdc", accent: "#f0dfae", base: { retail: 560, wholesale: 500 }, origin: "কুমিল্লা", famous: "কুমিল্লা", desc: "দুধের ঘন সরে ডোবানো কুমিল্লার রসমালাই।", minWholesale: 10 },
  { slug: "muktagachha-monda", bn: "মুক্তাগাছার মণ্ডা", en: "Muktagachha Monda", category: "regional-food", unit: "কেজি", motif: "sweet", color: "#f1e1c4", accent: "#c28a3e", base: { retail: 420, wholesale: 380 }, origin: "ময়মনসিংহ", famous: "ময়মনসিংহ", desc: "মুক্তাগাছার দুইশো বছরের ঐতিহ্যবাহী মণ্ডা।", minWholesale: 10 },
  { slug: "coxsbazar-shutki", bn: "কক্সবাজারের শুটকি", en: "Cox's Bazar Shutki", category: "fish", unit: "কেজি", motif: "dried", color: "#e8dcc8", accent: "#8c6a45", base: { retail: 900, wholesale: 820 }, origin: "কক্সবাজার", famous: "কক্সবাজার", desc: "রোদে শুকানো, পরিষ্কার করা কক্সবাজারের শুটকি।", minWholesale: 10 },
  { slug: "sreemangal-tea", bn: "শ্রীমঙ্গলের চা", en: "Sreemangal Tea", category: "spices-agri", unit: "কেজি", motif: "leaf", color: "#dfead2", accent: "#3f7a3a", base: { retail: 700, wholesale: 620 }, origin: "মৌলভীবাজার", famous: "মৌলভীবাজার", desc: "শ্রীমঙ্গলের বাগানের তাজা পাতার চা।", minWholesale: 10 },
  { slug: "kushtia-tilkhaja", bn: "কুষ্টিয়ার তিলের খাজা", en: "Kushtia Tilkhaja", category: "regional-food", unit: "কেজি", motif: "sweet", color: "#f1e4c8", accent: "#c9a05a", base: { retail: 380, wholesale: 340 }, origin: "কুষ্টিয়া", famous: "কুষ্টিয়া", desc: "কুড়মুড়ে তিল ও চিনির কুষ্টিয়ার বিখ্যাত খাজা।", minWholesale: 10 },
  { slug: "dhaka-bakarkhani", bn: "ঢাকার বাকরখানি", en: "Dhaka Bakarkhani", category: "regional-food", unit: "প্যাকেট", motif: "sweet", color: "#f0dfc2", accent: "#b9833f", base: { retail: 120, wholesale: 100 }, origin: "পুরান ঢাকা", famous: "ঢাকা", desc: "পুরান ঢাকার ঐতিহ্যবাহী কুড়মুড়ে বাকরখানি।", minWholesale: 20 },
  { slug: "tangail-saree", bn: "টাঙ্গাইল শাড়ি", en: "Tangail Saree", category: "other-approved", unit: "পিস", motif: "cloth", color: "#f1dcdc", accent: "#b4472f", base: { retail: 2200, wholesale: 1900 }, origin: "টাঙ্গাইল", famous: "টাঙ্গাইল", desc: "হাতে-বোনা টাঙ্গাইলের তাঁতের শাড়ি।", minWholesale: 5 },
  { slug: "rajshahi-silk", bn: "রাজশাহী সিল্ক", en: "Rajshahi Silk", category: "other-approved", unit: "পিস", motif: "cloth", color: "#e3dcef", accent: "#6a4a9a", base: { retail: 4500, wholesale: 4000 }, origin: "রাজশাহী", famous: "রাজশাহী", desc: "রাজশাহীর খাঁটি রেশমের সিল্ক শাড়ি।", minWholesale: 3 },
  { slug: "jamdani-saree", bn: "জামদানি শাড়ি", en: "Jamdani Saree", category: "other-approved", unit: "পিস", motif: "cloth", color: "#e6eef0", accent: "#C2410C", base: { retail: 8500, wholesale: 7600 }, origin: "রূপগঞ্জ, নারায়ণগঞ্জ", famous: "নারায়ণগঞ্জ", desc: "নকশা-বোনা ঐতিহ্যবাহী জামদানি।", minWholesale: 3 },
  { slug: "nakshi-kantha", bn: "নকশি কাঁথা", en: "Nakshi Kantha", category: "other-approved", unit: "পিস", motif: "cloth", color: "#f6e9d2", accent: "#c6a15b", base: { retail: 3500, wholesale: 3000 }, origin: "জামালপুর", famous: "জামালপুর", desc: "হাতের সুঁইয়ে বোনা নকশি কাঁথা।", minWholesale: 5 },
  { slug: "shitalpati", bn: "শীতলপাটি", en: "Shitalpati", category: "other-approved", unit: "পিস", motif: "mat", color: "#e7e2c8", accent: "#8a9a4a", base: { retail: 2800, wholesale: 2400 }, origin: "সিলেট", famous: "সিলেট", desc: "বেত দিয়ে বোনা ঠান্ডা শীতলপাটি।", minWholesale: 5 },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);

export type Seller = {
  slug: string; bn: string; en: string; location: string; division: string;
  kind: "কৃষক" | "খামারি" | "পাইকার" | "আড়তদার" | "দোকানদার" | "কারিগর"; since: number;
  desc: string; priceFactor: number; cats: string[];
  /** Sells to the whole country (famous regional products). */
  nationwide?: boolean;
  /** For famous products: slugs this seller makes/sells. */
  specialties?: string[];
};

export const sellers: Seller[] = [
  { slug: "sylhet-krishi-bhandar", bn: "সিলেট কৃষি ভাণ্ডার", en: "Sylhet Krishi Bhandar", location: "সিলেট", division: "সিলেট", kind: "পাইকার", since: 2019, desc: "সিলেট অঞ্চলের সবজি ও মসলার নির্ভরযোগ্য পাইকার।", priceFactor: 0.97, cats: ["vegetables", "regional-food", "spices-agri", "dairy", "fruits"] },
  { slug: "bogura-farmers-hub", bn: "বগুড়া ফার্মার্স হাব", en: "Bogura Farmers Hub", location: "বগুড়া", division: "রাজশাহী", kind: "আড়তদার", since: 2018, desc: "উত্তরাঞ্চলের আলু, মরিচ ও সবজির আড়ত।", priceFactor: 0.94, cats: ["vegetables", "regional-food", "spices-agri", "dairy"] },
  { slug: "dhaka-fresh-trade", bn: "ঢাকা ফ্রেশ ট্রেড", en: "Dhaka Fresh Trade", location: "ঢাকা", division: "ঢাকা", kind: "পাইকার", since: 2017, desc: "রাজধানীতে দ্রুত ডেলিভারির পাইকারি সরবরাহকারী।", priceFactor: 1.03, cats: ["vegetables", "fruits", "fish", "poultry-eggs", "other-approved", "regional-food", "spices-agri", "dairy"], specialties: ["dhaka-bakarkhani", "sreemangal-tea"], nationwide: true },
  { slug: "dinajpur-rice-mill", bn: "দিনাজপুর রাইস মিল", en: "Dinajpur Rice Mill", location: "দিনাজপুর", division: "রংপুর", kind: "পাইকার", since: 2015, desc: "চাল ও ডালের সরাসরি মিল-সরবরাহ।", priceFactor: 0.96, cats: ["rice-grains", "pulses"] },
  { slug: "jashore-green-farm", bn: "যশোর গ্রিন ফার্ম", en: "Jashore Green Farm", location: "যশোর", division: "খুলনা", kind: "কৃষক", since: 2022, desc: "নিজস্ব খামারের টমেটো, বেগুন ও মৌসুমি সবজি।", priceFactor: 0.95, cats: ["vegetables"] },
  { slug: "chattogram-bazar-ghar", bn: "চট্টগ্রাম বাজার ঘর", en: "Chattogram Bazar Ghar", location: "চট্টগ্রাম", division: "চট্টগ্রাম", kind: "দোকানদার", since: 2020, desc: "পরিবারের জন্য মুদি ও খাদ্যসামগ্রী।", priceFactor: 1.06, cats: ["rice-grains", "pulses", "regional-food", "spices-agri", "dairy", "fish", "poultry-eggs", "other-approved"], nationwide: true, specialties: ["coxsbazar-shutki", "sreemangal-tea", "kushtia-tilkhaja"] },
  { slug: "rajshahi-orchard", bn: "রাজশাহী অর্চার্ড", en: "Rajshahi Orchard", location: "রাজশাহী", division: "রাজশাহী", kind: "কৃষক", since: 2016, desc: "বাগান থেকে সরাসরি আম ও মৌসুমি ফল।", priceFactor: 0.98, cats: ["fruits"] },
  { slug: "mymensingh-matshya", bn: "ময়মনসিংহ মৎস্য খামার", en: "Mymensingh Matshya", location: "ময়মনসিংহ", division: "ময়মনসিংহ", kind: "খামারি", since: 2019, desc: "চাষের মাছ ও খামারের ডিম।", priceFactor: 0.96, cats: ["fish", "poultry-eggs", "other-approved"] },
  { slug: "bogura-doi-ghar", bn: "বগুড়া দই ঘর", en: "Bogura Doi Ghar", location: "বগুড়া", division: "রাজশাহী", kind: "দোকানদার", since: 2012, desc: "বগুড়ার ঐতিহ্যবাহী দই, সরাসরি কারখানা থেকে।", priceFactor: 0.98, cats: [], nationwide: true, specialties: ["bogura-doi"] },
  { slug: "bogura-mishti-bhandar", bn: "বগুড়া মিষ্টি ভাণ্ডার", en: "Bogura Mishti Bhandar", location: "বগুড়া", division: "রাজশাহী", kind: "দোকানদার", since: 2016, desc: "তাজা দই ও মিষ্টি, সারা দেশে কুরিয়ারে পাঠাই।", priceFactor: 1.03, cats: [], nationwide: true, specialties: ["bogura-doi"] },
  { slug: "natore-mishti-bhandar", bn: "নাটোর মিষ্টান্ন ভাণ্ডার", en: "Natore Mishtanno Bhandar", location: "নাটোর", division: "রাজশাহী", kind: "দোকানদার", since: 2009, desc: "নাটোরের নামকরা কাঁচাগোল্লার পুরনো দোকান।", priceFactor: 1.0, cats: [], nationwide: true, specialties: ["natore-kachagolla"] },
  { slug: "tangail-chomchom-ghar", bn: "টাঙ্গাইল চমচম ঘর", en: "Tangail Chomchom Ghar", location: "টাঙ্গাইল", division: "ঢাকা", kind: "দোকানদার", since: 2011, desc: "পোড়াবাড়ির ধারার টাঙ্গাইলের চমচম।", priceFactor: 1.0, cats: [], nationwide: true, specialties: ["tangail-chomchom"] },
  { slug: "cumilla-roshmalai-ghar", bn: "কুমিল্লা রসমালাই ঘর", en: "Cumilla Roshmalai Ghar", location: "কুমিল্লা", division: "চট্টগ্রাম", kind: "দোকানদার", since: 2008, desc: "মা ও ছেলের ঐতিহ্যের কুমিল্লার রসমালাই।", priceFactor: 1.0, cats: [], nationwide: true, specialties: ["cumilla-roshmalai"] },
  { slug: "muktagachha-monda-ghar", bn: "মুক্তাগাছা মণ্ডা ঘর", en: "Muktagachha Monda Ghar", location: "ময়মনসিংহ", division: "ময়মনসিংহ", kind: "দোকানদার", since: 1999, desc: "মুক্তাগাছার মূল ধারার মণ্ডা।", priceFactor: 1.0, cats: [], nationwide: true, specialties: ["muktagachha-monda"] },
  { slug: "dhaka-desi-mishti", bn: "ঢাকা দেশি মিষ্টি বাজার", en: "Dhaka Desi Mishti Bazar", location: "ঢাকা", division: "ঢাকা", kind: "পাইকার", since: 2018, desc: "সারা দেশের নামকরা মিষ্টি ও দই একসঙ্গে, ঢাকা থেকে পাইকারি ও খুচরা।", priceFactor: 1.06, cats: [], nationwide: true, specialties: ["bogura-doi","natore-kachagolla","tangail-chomchom","cumilla-roshmalai","muktagachha-monda"] },
  { slug: "coxsbazar-shutki-aarot", bn: "কক্সবাজার শুটকি আড়ত", en: "Cox's Bazar Shutki Aarot", location: "কক্সবাজার", division: "চট্টগ্রাম", kind: "আড়তদার", since: 2007, desc: "সৈকতের রোদে শুকানো শুটকি, বাছাই ও প্যাকেটজাত।", priceFactor: 0.97, cats: [], nationwide: true, specialties: ["coxsbazar-shutki"] },
  { slug: "sreemangal-tea-traders", bn: "শ্রীমঙ্গল টি ট্রেডার্স", en: "Sreemangal Tea Traders", location: "মৌলভীবাজার", division: "সিলেট", kind: "পাইকার", since: 2013, desc: "শ্রীমঙ্গলের বাগান থেকে সরাসরি চা।", priceFactor: 0.98, cats: [], nationwide: true, specialties: ["sreemangal-tea"] },
  { slug: "kushtia-khaja-ghar", bn: "কুষ্টিয়া খাজা ঘর", en: "Kushtia Khaja Ghar", location: "কুষ্টিয়া", division: "খুলনা", kind: "দোকানদার", since: 2014, desc: "কুষ্টিয়ার তিলের খাজার কারিগর।", priceFactor: 1.0, cats: [], nationwide: true, specialties: ["kushtia-tilkhaja"] },
  { slug: "dhaka-bakarkhani-ghar", bn: "পুরান ঢাকা বাকরখানি ঘর", en: "Old Dhaka Bakarkhani Ghar", location: "ঢাকা", division: "ঢাকা", kind: "দোকানদার", since: 1990, desc: "পুরান ঢাকার প্রতিদিনের গরম বাকরখানি।", priceFactor: 1.0, cats: [], nationwide: true, specialties: ["dhaka-bakarkhani"] },
  { slug: "tangail-tant-ghar", bn: "টাঙ্গাইল তাঁত ঘর", en: "Tangail Tant Ghar", location: "টাঙ্গাইল", division: "ঢাকা", kind: "কারিগর", since: 2005, desc: "তাঁতিদের হাতে-বোনা টাঙ্গাইল শাড়ি।", priceFactor: 0.97, cats: [], nationwide: true, specialties: ["tangail-saree"] },
  { slug: "rajshahi-silk-house", bn: "রাজশাহী সিল্ক হাউস", en: "Rajshahi Silk House", location: "রাজশাহী", division: "রাজশাহী", kind: "কারিগর", since: 2010, desc: "রেশম পল্লীর খাঁটি সিল্ক।", priceFactor: 1.0, cats: [], nationwide: true, specialties: ["rajshahi-silk"] },
  { slug: "rupganj-jamdani-palli", bn: "রূপগঞ্জ জামদানি পল্লী", en: "Rupganj Jamdani Palli", location: "নারায়ণগঞ্জ", division: "ঢাকা", kind: "কারিগর", since: 2003, desc: "তাঁতিদের নিজস্ব জামদানি পল্লী।", priceFactor: 0.98, cats: [], nationwide: true, specialties: ["jamdani-saree"] },
  { slug: "jamalpur-kantha-kutir", bn: "জামালপুর কাঁথা কুটির", en: "Jamalpur Kantha Kutir", location: "জামালপুর", division: "ময়মনসিংহ", kind: "কারিগর", since: 2012, desc: "গ্রামের নারীদের হাতে সেলাই করা নকশি কাঁথা।", priceFactor: 0.97, cats: [], nationwide: true, specialties: ["nakshi-kantha"] },
  { slug: "sylhet-shitalpati-ghar", bn: "সিলেট শীতলপাটি ঘর", en: "Sylhet Shitalpati Ghar", location: "সিলেট", division: "সিলেট", kind: "কারিগর", since: 2015, desc: "বেতের কারিগরদের হাতে বোনা শীতলপাটি।", priceFactor: 1.0, cats: [], nationwide: true, specialties: ["shitalpati"] },
  { slug: "dhaka-craft-bazar", bn: "ঢাকা হস্তশিল্প বাজার", en: "Dhaka Craft Bazar", location: "ঢাকা", division: "ঢাকা", kind: "পাইকার", since: 2017, desc: "সারা দেশের শাড়ি ও হস্তশিল্প এক ছাদের নিচে।", priceFactor: 1.07, cats: [], nationwide: true, specialties: ["tangail-saree","rajshahi-silk","jamdani-saree","nakshi-kantha","shitalpati"] },
];
export const getSeller = (slug: string) => sellers.find((s) => s.slug === slug);

export type Offer = { grade: string; sellerSlug: string; retail: number; wholesale: number; stock: number; minWholesale: number };

// Deterministic demo offers: every seller whose categories include the product's category.
export function offersFor(p: Product): Offer[] {
  const list = sellers.filter((s) => (p.famous ? s.specialties?.includes(p.slug) : s.cats.includes(p.category)));
  return list.map((s, i) => {
    const jitter = 1 + (((p.slug.length * 7 + i * 5) % 7) - 3) / 100;
    const f = s.priceFactor * jitter;
    return {
      grade: ["A", "A", "B", "A"][i % 4],
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
  };
}
export const bn = (n: number | string) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
export const taka = (n: number) => `৳${n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
