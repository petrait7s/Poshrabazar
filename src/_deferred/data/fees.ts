/**
 * Platform fee paid to Petra on larger marketplace orders.
 * One place to change the rule: rate, threshold, and who bears it.
 *  - "seller": deducted from the seller's payout (buyer pays nothing extra)
 *  - "buyer":  added on top of the buyer's total
 *  - "split":  half each
 */
export const FEE = { rate: 0.015, threshold: 999, payer: "seller" as "seller" | "buyer" | "split" };

/** Fee on one seller's share of an order. Applies only when that subtotal is above the threshold. */
export const feeFor = (sellerSubtotal: number) => (sellerSubtotal > FEE.threshold ? Math.round(sellerSubtotal * FEE.rate * 100) / 100 : 0);
export const buyerFee = (fee: number) => (FEE.payer === "buyer" ? fee : FEE.payer === "split" ? Math.round(fee * 50) / 100 : 0);
export const sellerFee = (fee: number) => fee - buyerFee(fee);
export const feeRateLabel = `${(FEE.rate * 100).toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]).replace(".", ".")}%`;
export const payerLabel = FEE.payer === "seller" ? "বিক্রেতা বহন করেন" : FEE.payer === "buyer" ? "ক্রেতা বহন করেন" : "ক্রেতা ও বিক্রেতা অর্ধেক করে বহন করেন";
