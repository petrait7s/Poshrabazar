"use client";
import { useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { useApp } from "@/components/providers";
import { bn, getProduct, offersFor, summary } from "@/data/catalog";
import { takaBn } from "@/data/home";
import { cn } from "@/lib/utils";

/** One honest retail/wholesale comparison for a single product (the seasonal orange). Numbers come from the catalogue. */
export function PriceCompare() {
  const p = getProduct("orange")!;
  const sm = summary(p);
  const r = sm.minRetail, w = sm.minWholesale, moq = p.minWholesale;
  const [qty, setQty] = useState(10);
  const { addToCart, toast } = useApp();
  const wholesale = qty >= moq;
  const unit = wholesale ? w : r;
  const save = (r - w) * moq;
  const hint = wholesale ? `পাইকারি দর চালু: খুচরার চেয়ে মোট ${takaBn((r - w) * qty)} কম।` : `${bn(moq - qty)} কেজি বেশি নিলে পাইকারি দর। ${bn(moq)} কেজিতে মোট ${takaBn(w * moq)}, খুচরার চেয়ে ${takaBn(save)} কম।`;
  const add = () => {
    const offers = offersFor(p);
    const best = [...offers].sort((a, b) => (wholesale ? a.wholesale - b.wholesale : a.retail - b.retail))[0];
    addToCart({ productSlug: p.slug, sellerSlug: best.sellerSlug, mode: wholesale ? "wholesale" : "retail", qty });
    toast(`কমলা ${bn(qty)} কেজি কার্টে যোগ হয়েছে`, "ok", { label: "কার্ট দেখুন", href: "/cart" });
  };
  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center gap-3">
        <div className="w-14 shrink-0"><ProductImage kind="orange" className="rounded" sizes="56px" /></div>
        <div><h3 className="text-[17px] leading-normal">জৈন্তাপুরের কমলা</h3><p className="text-[13px] leading-normal text-muted">পাহাড়ি কমলা বাগান · জৈন্তাপুর</p></div>
      </div>

      <div className="mt-6 grid grid-cols-2 border-t border-line">
        <div className={cn("-mt-px border-t-2 py-4 pr-3 transition-opacity duration-200", !wholesale ? "border-ink opacity-100" : "border-transparent opacity-50")}>
          <p className="text-[12.5px] font-semibold text-stone-600">খুচরা</p>
          <p className="text-[13px] text-muted">১–{bn(moq - 1)} কেজি</p>
          <p className="mt-3 flex items-baseline gap-[3px]"><b className="text-[28px] font-bold leading-tight tabular-nums">{takaBn(r)}</b><span className="text-[13px] text-muted">/কেজি</span></p>
        </div>
        <div className={cn("-mt-px border-l border-t-2 border-l-line py-4 pl-4 transition-opacity duration-200", wholesale ? "border-t-primary opacity-100" : "border-t-transparent opacity-70")}>
          <p className="text-[12.5px] font-semibold text-primary-700">পাইকারি</p>
          <p className="text-[13px] text-muted">{bn(moq)} কেজি বা বেশি</p>
          <p className="mt-3 flex items-baseline gap-[3px]"><b className="text-[28px] font-bold leading-tight tabular-nums text-primary-700">{takaBn(w)}</b><span className="text-[13px] text-muted">/কেজি</span></p>
          <p className="mt-1 text-[12.5px] font-semibold text-primary-700">প্রতি কেজিতে {takaBn(r - w)} কম</p>
        </div>
      </div>

      <p className="mb-2 mt-6 text-[13px] font-semibold text-stone-600" id="qty-l">কত কেজি নেবেন?</p>
      <div role="group" aria-labelledby="qty-l" className="grid grid-cols-5 overflow-hidden rounded-lg border border-stone-300">
        {[5, 10, moq, 50, 100].map((n, i) => (
          <button key={n} type="button" aria-pressed={qty === n} onClick={() => setQty(n)} className={cn("h-12 text-[15px] font-semibold tabular-nums transition-colors duration-150", i > 0 && "border-l border-stone-300", qty === n ? "bg-ink text-white" : "bg-surface text-ink hover:bg-cream")}>{bn(n)}</button>
        ))}
      </div>

      <div className="mt-5 flex items-baseline justify-between">
        <span className="text-sm text-stone-600">{bn(qty)} কেজি × {takaBn(unit)}</span>
        <b className="text-2xl font-bold leading-snug tabular-nums">{takaBn(unit * qty)}</b>
      </div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-primary-700" aria-live="polite">{hint}</p>
      <button type="button" onClick={add} className="mt-5 flex h-[52px] w-full items-center justify-center rounded-lg bg-primary text-base font-semibold text-white hover:bg-primary-700">কার্টে যোগ করুন</button>
    </div>
  );
}
