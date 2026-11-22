"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X, BadgeCheck, MapPin } from "lucide-react";
import { useApp } from "./providers";
import { AreaSelect, AreaButton } from "./AreaPicker";
import { areaLabel, inArea, noArea } from "@/data/locations";
import { ProductCard, ProductCardSkeleton } from "./Commerce";
import { Select } from "./ui/form";
import { Button } from "./ui/button";
import { EmptyState } from "./ui/misc";
import { categories, products, sellers, offersFor, bn, type Product } from "@/data/catalog";
import { cn } from "@/lib/utils";

type Mode = "retail" | "wholesale";

export function ProductExplorer({ category, query = "", initialMode = "retail", lockCategory }: { category?: string; query?: string; initialMode?: Mode; lockCategory?: boolean }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [cats, setCats] = useState<string[]>(category ? [category] : []);
  const { area, setArea } = useApp();
  const [maxPrice, setMaxPrice] = useState(10000);
  const [verified, setVerified] = useState(false);
  const [sort, setSort] = useState("popular");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const toggle = (arr: string[], v: string, set: (a: string[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t); }, [mode, cats, area, maxPrice, verified, sort, query]);
  useEffect(() => { if (category) setCats([category]); }, [category]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.map((p) => {
      let offers = offersFor(p);
      offers = offers.filter((o) => { const sl = sellers.find((s) => s.slug === o.sellerSlug)!; return inArea(area, sl.location, sl.division) || (!!p.famous && !!sl.nationwide); });
      if (verified) offers = offers.filter((o) => sellers.find((s) => s.slug === o.sellerSlug)!.verified);
      const price = offers.length ? Math.min(...offers.map((o) => o[mode])) : Infinity;
      return { p, offers, price };
    }).filter(({ p, offers, price }) =>
      offers.length && price <= maxPrice &&
      (!cats.length || cats.includes(p.category)) &&
      (!q || p.bn.includes(q) || p.en.toLowerCase().includes(q) || categories.find((c) => c.slug === p.category)?.bn.includes(q))
    );
    if (sort === "low") list.sort((a, b) => a.price - b.price);
    if (sort === "high") list.sort((a, b) => b.price - a.price);
    if (sort === "sellers") list.sort((a, b) => b.offers.length - a.offers.length);
    return list;
  }, [mode, cats, area, maxPrice, verified, sort, query]);

  const reset = () => { setCats(category && lockCategory ? [category] : []); setArea(noArea); setMaxPrice(10000); setVerified(false); };
  const active = (lockCategory ? 0 : cats.length) + (area.division ? 1 : 0) + (verified ? 1 : 0) + (maxPrice < 10000 ? 1 : 0);

  const Filters = (
    <div className="space-y-6">
      {!lockCategory && (
        <fieldset><legend className="mb-2 font-bn text-sm font-semibold text-ink">ক্যাটাগরি</legend>
          {categories.map((c) => <Check key={c.slug} checked={cats.includes(c.slug)} onChange={() => toggle(cats, c.slug, setCats)} label={c.bn} n={products.filter((p) => p.category === c.slug).length} />)}
        </fieldset>
      )}
      <fieldset><legend className="mb-2 font-bn text-sm font-semibold text-ink">সর্বোচ্চ দাম (প্রতি ইউনিট)</legend>
        <input type="range" min={50} max={10000} step={50} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="w-full accent-primary" aria-label="Max price" />
        <div className="mt-1 flex justify-between text-xs tabular-nums text-muted"><span>৳50</span><b className="text-ink">{maxPrice === 10000 ? "সব দাম" : `≤ ৳${maxPrice}`}</b><span>৳10,000</span></div>
      </fieldset>
      <fieldset><legend className="mb-2 font-bn text-sm font-semibold text-ink">এলাকা (কোথা থেকে কিনবেন)</legend>
        <AreaSelect value={area} onChange={setArea} allLabel="সারা দেশ" className="!grid-cols-1" />
      </fieldset>
      <Check checked={verified} onChange={() => setVerified(!verified)} label="শুধু যাচাইকৃত বিক্রেতা" icon />
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-32 surface rounded-md p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-bn text-lg text-ink">ফিল্টার</h2>{active > 0 && <button onClick={reset} className="font-bn text-xs text-primary hover:underline">রিসেট</button>}</div>
          {Filters}
        </div>
      </aside>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-primary/25 bg-primary-50 px-3 py-2">
          <MapPin className="h-4 w-4 text-primary" />
          <p className="font-bn text-sm text-primary-800">এলাকা: <b>{areaLabel(area)}</b>{area.division && <span className="text-primary-800/70"> — শুধু এই এলাকার বিক্রেতা</span>}</p>
          <AreaButton className="ml-auto !py-1.5" label="এলাকা বদলান" />
          {area.division && <button onClick={() => setArea(noArea)} className="font-bn text-xs text-primary underline">সারা দেশ</button>}
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Retail or wholesale" className="inline-flex overflow-hidden rounded-md border border-ink/25 bg-white">
            {(["retail", "wholesale"] as const).map((m) => (
              <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)} className={cn("px-4 py-2 font-bn text-sm transition-colors", mode === m ? "bg-ink text-white" : "text-ink hover:bg-tint")}>{m === "retail" ? "খুচরা" : "পাইকারি"}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setOpen(true)}><SlidersHorizontal className="h-4 w-4" />ফিল্টার{active > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-white">{active}</span>}</Button>
          <p className="font-bn text-sm text-ink/60">{loading ? "…" : `${bn(rows.length)}টি পণ্য`}</p>
          <label className="ml-auto flex items-center gap-2 font-bn text-sm text-ink/70">সাজান
            <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
              <option value="popular">জনপ্রিয়</option><option value="low">দাম: কম → বেশি</option><option value="high">দাম: বেশি → কম</option><option value="sellers">বেশি বিক্রেতা</option>
            </Select>
          </label>
        </div>
        {mode === "wholesale" && <p className="mb-4 rounded-md border border-primary/20 bg-primary-50 px-3 py-2 font-bn text-sm text-primary-800">পাইকারি দাম প্রযোজ্য হয় প্রতিটি পণ্যের ন্যূনতম অর্ডার (MOQ) পূরণ করলে।</p>}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
        ) : rows.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{rows.map(({ p }) => <ProductCard key={p.slug} p={p as Product} />)}</div>
        ) : (
          <EmptyState title="কোনো পণ্য পাওয়া যায়নি" text="ফিল্টার বদলে বা রিসেট করে আবার চেষ্টা করুন।" action={<div className="flex flex-wrap justify-center gap-2"><Button onClick={reset} variant="outline">ফিল্টার রিসেট</Button>{area.division && <Link href="/seller/register" className="inline-flex h-11 items-center rounded-md bg-primary px-5 font-bn text-[15px] text-white hover:bg-primary-700">এই এলাকায় বিক্রেতা হোন</Link>}</div>} />
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] animate-rise overflow-y-auto rounded-t-lg bg-white p-5 pb-24">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-bn text-lg text-ink">ফিল্টার</h2><button aria-label="Close" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>
            {Filters}
            <div className="fixed inset-x-0 bottom-0 flex gap-3 border-t border-line bg-white p-3"><Button variant="outline" className="flex-1" onClick={reset}>রিসেট</Button><Button className="flex-1" onClick={() => setOpen(false)}>{bn(rows.length)}টি দেখুন</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Check({ checked, onChange, label, n, icon }: { checked: boolean; onChange: () => void; label: string; n?: number; icon?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5 font-bn text-[15px] text-ink hover:text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded-sm accent-primary" />
      {icon && <BadgeCheck className="h-4 w-4 text-primary" />}<span className="flex-1">{label}</span>{n !== undefined && <span className="text-xs text-muted">{n}</span>}
    </label>
  );
}
