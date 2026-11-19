import { Percent } from "lucide-react";
import { FEE, feeRateLabel, payerLabel } from "@/data/fees";
import { bn, taka } from "@/data/catalog";

/** Shows the platform fee line in cart/checkout summaries. */
export function FeeRow({ fee, buyerPays }: { fee: number; buyerPays: number }) {
  if (!fee) return (
    <p className="flex gap-2 rounded bg-gold-50 px-3 py-2 font-bn text-xs text-gold-700"><Percent className="mt-0.5 h-3.5 w-3.5 shrink-0" />প্ল্যাটফর্ম ফি: একই বিক্রেতার অর্ডার ৳{bn(FEE.threshold)} এর বেশি হলে {feeRateLabel} ({payerLabel})।</p>
  );
  return (
    <div className="rounded border border-gold/40 bg-gold-50 px-3 py-2 font-bn text-sm">
      <div className="flex justify-between text-gold-700"><span>প্ল্যাটফর্ম ফি ({feeRateLabel})</span><b className="tabular-nums">{taka(fee)}</b></div>
      <p className="mt-0.5 text-xs text-gold-700/80">{payerLabel}{buyerPays ? ` · আপনার মোটে যোগ: ${taka(buyerPays)}` : " · আপনার মোট বাড়ছে না"}। পেট্রা সফটওয়্যার সলিউশনস প্ল্যাটফর্ম ফি পায়।</p>
    </div>
  );
}
