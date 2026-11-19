// DEMO wallet ledger. Real balances come from the backend + payment gateway later.
import { FEE, feeFor, sellerFee } from "./fees";
export type Tx = { id: string; date: string; label: string; type: "credit" | "debit" | "fee"; amount: number };

const sales = [
  { id: "PB-DEMO-2210", date: "১৮ নভেম্বর", who: "আরিফ হোসেন", gross: 1550 },
  { id: "PB-DEMO-2209", date: "১৭ নভেম্বর", who: "রহমান স্টোর", gross: 4320 },
  { id: "PB-DEMO-2204", date: "১৬ নভেম্বর", who: "সুমি আক্তার", gross: 330 },
  { id: "PB-DEMO-2198", date: "১৪ নভেম্বর", who: "ঢাকা মুদি ভাণ্ডার", gross: 4700 },
];
/** Seller view: each sale with the platform fee taken out (only above the threshold). */
export const saleRows = sales.map((s) => { const fee = feeFor(s.gross); const sf = sellerFee(fee); return { ...s, fee, sellerFee: sf, net: s.gross - sf }; });
export const sellerTx: Tx[] = saleRows.flatMap((r): Tx[] => [
  { id: r.id + "c", date: r.date, label: `বিক্রয় ${r.id} — ${r.who}`, type: "credit", amount: r.gross },
  ...(r.sellerFee ? [{ id: r.id + "f", date: r.date, label: `প্ল্যাটফর্ম ফি (${(FEE.rate * 100).toFixed(1)}%) — ${r.id}`, type: "fee" as const, amount: r.sellerFee }] : []),
]);
export const buyerTx: Tx[] = [
  { id: "b1", date: "১০ নভেম্বর", label: "রিফান্ড — বাতিল অর্ডার PB-DEMO-1019", type: "credit", amount: 520 },
  { id: "b2", date: "০৮ নভেম্বর", label: "অর্ডার PB-DEMO-1031 পরিশোধ", type: "debit", amount: 1310 },
];
export const balanceOf = (tx: Tx[]) => tx.reduce((a, t) => a + (t.type === "credit" ? t.amount : -t.amount), 0);
