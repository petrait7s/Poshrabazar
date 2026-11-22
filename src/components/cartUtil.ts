import { getProduct, getSeller, offersFor } from "@/data/catalog";
import type { CartLine } from "./providers";

export function resolve(l: CartLine) {
  const p = getProduct(l.productSlug)!;
  const o = offersFor(p).find((x) => x.sellerSlug === l.sellerSlug)!;
  const price = o[l.mode];
  return { p, s: getSeller(l.sellerSlug)!, price, total: price * l.qty };
}
export const DELIVERY_FEE = 60;

/** Prototype totals only. Commission is a seller-side accounting matter and is never added to the buyer's total. */
export function totals(lines: CartLine[]) {
  const sub = lines.reduce((a, l) => a + resolve(l).total, 0);
  const delivery = lines.length ? DELIVERY_FEE : 0;
  return { sub, delivery, total: sub + delivery };
}
