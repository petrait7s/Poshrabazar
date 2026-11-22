"use client";
import { useMemo, useState } from "react";
import { SellerCard } from "./Commerce";
import { Select } from "./ui/form";
import { EmptyState } from "./ui/misc";
import { categories, bn } from "@/data/catalog";
import { SYLHET_DISTRICTS, sellers, storeCategories, storeOrigins } from "@/data/market";
import { cn } from "@/lib/utils";

export function StoreDirectory() {
  const [cat, setCat] = useState("");
  const [origin, setOrigin] = useState("");
  const districts = useMemo(() => [...new Set(sellers.flatMap((s) => storeOrigins(s.slug)))].sort((a, b) => a.localeCompare(b, "bn")), []);
  const list = useMemo(() => sellers.filter((s) =>
    (!cat || storeCategories(s.slug).some((c) => c.slug === cat)) &&
    (!origin || (origin === "_sylhet" ? storeOrigins(s.slug).some((d) => SYLHET_DISTRICTS.includes(d)) : storeOrigins(s.slug).includes(origin)))
  ), [cat, origin]);
  return (
    <>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="ক্যাটাগরি">
        {[{ slug: "", bn: "সব" }, ...categories].map((c) => (
          <button key={c.slug} type="button" aria-pressed={cat === c.slug} onClick={() => setCat(c.slug)} className={cn("h-9 shrink-0 rounded-full border px-3.5 font-bn text-sm", cat === c.slug ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:bg-tint")}>{c.bn}</button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 font-bn text-sm text-ink/70">পণ্যের উৎস
          <Select value={origin} onChange={(e) => setOrigin(e.target.value)} aria-label="উৎস জেলা">
            <option value="">সব জেলা</option><option value="_sylhet">সিলেট বিভাগ</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </label>
        <p className="font-bn text-sm text-ink/60">{bn(list.length)}টি দোকান</p>
      </div>
      {list.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map((s) => <SellerCard key={s.slug} slug={s.slug} />)}</div>
      ) : <div className="mt-5"><EmptyState title="কোনো দোকান পাওয়া যায়নি" text="অন্য ক্যাটাগরি বা জেলা বেছে দেখুন।" /></div>}
    </>
  );
}
