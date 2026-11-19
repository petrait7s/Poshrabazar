import { getProduct, getSeller, offersFor } from "@/data/catalog";
import { buyerFee, feeFor, sellerFee } from "@/data/fees";
import type { CartLine } from "./providers";

export function resolve(l: CartLine) {
  const p = getProduct(l.productSlug)!;
  const o = offersFor(p).find((x) => x.sellerSlug === l.sellerSlug)!;
  const price = o[l.mode];
  return { p, s: getSeller(l.sellerSlug)!, price, total: price * l.qty };
}
export const DELIVERY_FEE = 60;

/** Platform fee is worked out per seller (each seller's share of the cart). */
export function totals(lines: CartLine[]) {
  const sub = lines.reduce((a, l) => a + resolve(l).total, 0);
  const delivery = lines.length ? DELIVERY_FEE : 0;
  const bySeller = new Map<string, number>();
  lines.forEach((l) => bySeller.set(l.sellerSlug, (bySeller.get(l.sellerSlug) ?? 0) + resolve(l).total));
  let fee = 0;
  bySeller.forEach((v) => { fee += feeFor(v); });
  fee = Math.round(fee * 100) / 100;
  const byBuyer = Math.round(buyerFee(fee) * 100) / 100;
  return { sub, delivery, fee, buyerFee: byBuyer, sellerFee: Math.round(sellerFee(fee) * 100) / 100, total: sub + delivery + byBuyer };
}
