// DEMO DATA — not real market prices.
import { products } from "./catalog";
export const markets = [
  { slug: "karwan-bazar", bn: "কারওয়ান বাজার", city: "ঢাকা", f: 1 },
  { slug: "reza-bazar", bn: "রেয়াজউদ্দিন বাজার", city: "চট্টগ্রাম", f: 1.05 },
  { slug: "kazir-bazar", bn: "কাজীর বাজার", city: "সিলেট", f: 0.98 },
  { slug: "rajshahi-bazar", bn: "সাহেব বাজার", city: "রাজশাহী", f: 0.95 },
];
export type PriceRow = { slug: string; bn: string; en: string; unit: string; today: number; yesterday: number; trend: number[]; low: number; high: number };
export const priceRows: PriceRow[] = products.map((p, i) => {
  const today = Math.round((p.base.retail + p.base.wholesale) / 2);
  const wave = [0, 1, -1, 2, 1, -2, 0].map((x, k) => Math.round(today * (1 + ((x + ((i + k) % 3) - 1) * 1.4) / 100)));
  wave[6] = today;
  return { slug: p.slug, bn: p.bn, en: p.en, unit: p.unit, today, yesterday: wave[5], trend: wave, low: Math.round(today * 0.93), high: Math.round(today * 1.08) };
});
