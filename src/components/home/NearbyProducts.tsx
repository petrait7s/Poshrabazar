"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, Plus } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { useApp } from "@/components/providers";
import { homeCats, homeItems, priced, takaBn, type Avail, type HomeCat } from "@/data/home";
import { bn } from "@/data/catalog";
import { cn } from "@/lib/utils";

const AV: Record<Avail, { dot: string; text: string }> = {
  fresh: { dot: "bg-secondary", text: "text-primary-700" },
  stock: { dot: "bg-muted", text: "text-stone-600" },
  low: { dot: "bg-accent", text: "text-accent-700" },
  out: { dot: "bg-stone-400", text: "text-muted" },
};

export function NearbyProducts() {
  const { cart, addToCart, removeLine, toast, area, hydrated } = useApp();
  const [cat, setCat] = useState<HomeCat>("all");
  const [loading, setLoading] = useState(false);
  const [notify, setNotify] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const place = hydrated ? area.upazila || area.district || area.division || "সিলেট" : "সিলেট";
  const list = homeItems.filter((i) => cat === "all" || i.cat === cat);
  const pick = (k: HomeCat) => {
    if (k === cat) return;
    setCat(k); setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), 450);
  };

  const toggle = (slug: string, title: string) => {
    const idx = cart.findIndex((l) => l.productSlug === slug);
    if (idx >= 0) { removeLine(idx); toast(`${title} কার্ট থেকে সরানো হয়েছে`, "info"); return; }
    const it = homeItems.find((i) => i.slug === slug)!;
    addToCart({ productSlug: slug, sellerSlug: priced(it).sellerSlug, mode: "retail", qty: 1 });
    toast(`${title} কার্টে যোগ হয়েছে`, "ok", { label: "কার্ট দেখুন", href: "/cart" });
  };

  return (
    <>
      <nav aria-label="ক্যাটাগরি" className="mt-8 border-y border-line">
        <div className="container-x">
          <div className="no-scrollbar -mx-2 flex overflow-x-auto sm:mx-0">
            {homeCats.map((c) => {
              const on = c.key === cat;
              return (
                <button key={c.key} type="button" aria-pressed={on} onClick={() => pick(c.key)} className={cn("relative flex h-[52px] shrink-0 items-center gap-[7px] px-3 text-[14.5px]", on ? "font-semibold text-ink" : "text-muted hover:text-ink")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={c.icon} /></svg>
                  {c.label}
                  <span aria-hidden className={cn("absolute inset-x-3 -bottom-px h-0.5", on ? "bg-primary" : "bg-transparent")} />
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <section aria-labelledby="near-h" className="container-x pt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="near-h" className="text-[22px] leading-snug lg:text-[28px]">কাছের পণ্য</h2>
            <p className="text-[13.5px] leading-normal text-muted">{place} থেকে ৬০ কিমির মধ্যে</p>
          </div>
          <Link href="/marketplace" className="inline-flex min-h-11 items-center whitespace-nowrap text-sm font-semibold text-primary">সব দেখুন</Link>
        </div>

        <div className="no-scrollbar -mx-4 mt-3 flex snap-x snap-proximity gap-3 overflow-x-auto px-4 pb-2 [scroll-padding-left:16px] sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:gap-x-5 lg:gap-y-8 lg:overflow-visible xl:grid-cols-5" aria-busy={loading}>
          {loading
            ? Array.from({ length: Math.max(3, list.length) }).slice(0, 5).map((_, i) => (
                <div key={i} className="w-40 shrink-0 lg:w-auto">
                  <div className="skeleton aspect-[4/5] w-full rounded" />
                  <div className="skeleton mt-3 h-2.5 w-[70px] rounded-sm" /><div className="skeleton mt-2 h-4 w-[130px] rounded-sm" /><div className="skeleton mt-2 h-3 w-[100px] rounded-sm" /><div className="skeleton mt-3 h-5 w-20 rounded-sm" />
                </div>
              ))
            : list.map((it) => {
                const pr = priced(it);
                const out = it.avail === "out";
                const added = hydrated && cart.some((l) => l.productSlug === it.slug);
                const want = notify.includes(it.slug);
                const st = AV[it.avail];
                return (
                  <article key={it.slug} className={cn("w-40 shrink-0 snap-start lg:w-auto", out && "opacity-70")}>
                    <div className="relative">
                      <Link href={`/product/${it.slug}`} aria-label={it.title}><ProductImage kind={it.art} className="rounded" /></Link>
                      {!out ? (
                        <button type="button" onClick={() => toggle(it.slug, it.title)} aria-pressed={added} aria-label={added ? `${it.title} কার্ট থেকে সরান` : `${it.title} কার্টে যোগ করুন`}
                          className={cn("absolute bottom-2 right-2 grid h-11 w-11 place-items-center rounded-lg transition-colors duration-150", added ? "bg-primary text-white" : "bg-white text-ink hover:bg-cream")}>
                          {added ? <Check className="h-5 w-5" strokeWidth={2.6} /> : <Plus className="h-5 w-5" strokeWidth={2.2} />}
                        </button>
                      ) : (
                        <>
                          <span className="absolute bottom-2 left-2 rounded bg-white px-2 py-1 text-xs font-semibold">আপাতত নেই</span>
                          <button type="button" aria-pressed={want} aria-label={`${it.title} এলে জানান`} onClick={() => { setNotify((n) => (want ? n.filter((x) => x !== it.slug) : [...n, it.slug])); toast(want ? "জানানো বাতিল" : `${it.title} এলে জানানো হবে (ডেমো)`, "info"); }}
                            className={cn("absolute bottom-2 right-2 grid h-11 w-11 place-items-center rounded-lg", want ? "bg-ink text-white" : "bg-tint text-muted")}><Bell className="h-5 w-5" strokeWidth={1.9} /></button>
                        </>
                      )}
                    </div>
                    <p className="mt-3 text-[11px] font-semibold leading-snug tracking-[0.1em] text-primary">{it.latin}<span className="font-medium tracking-[0.02em] text-muted"> · {bn(it.km)} কিমি</span></p>
                    <h3 className="mt-0.5 text-base leading-normal"><Link href={`/product/${it.slug}`}>{it.title}</Link></h3>
                    <p className="text-[13px] leading-normal text-muted">{it.upazila} · {it.producer}</p>
                    <p className="mt-2 flex items-baseline gap-[3px]"><b className="text-lg font-bold leading-tight tabular-nums">{takaBn(pr.retail)}</b><span className="text-[13px] text-muted">/{pr.unit}</span></p>
                    <p className="text-[12.5px] leading-normal text-primary-700">{bn(pr.moq)} {pr.unit}+ {takaBn(pr.wholesale)}</p>
                    <p className={cn("mt-1.5 flex items-center gap-1.5 text-[12.5px] font-medium leading-snug", st.text)}><span aria-hidden className={cn("h-[7px] w-[7px] rounded-full", st.dot)} />{it.note}</p>
                  </article>
                );
              })}
        </div>
        {!loading && list.length === 0 && <p className="py-8 text-sm text-muted">এই ক্যাটাগরিতে এখন কোনো পণ্য নেই।</p>}
      </section>
    </>
  );
}
