"use client";
import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Heart, MapPin, ShoppingBasket, Sprout, Truck, Wallet, Award } from "lucide-react";
import { ProductArt } from "@/components/ProductArt";
import { Price, VerifiedBadge, WishButton } from "@/components/Commerce";
import { QtyStepper } from "@/components/QtyStepper";
import { Stars, Tabs } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers";
import { bn, getSeller, offersFor, taka, type Product } from "@/data/catalog";
import { cn } from "@/lib/utils";
import { inArea, areaLabel } from "@/data/locations";

const views = ["পুরো দৃশ্য", "ক্লোজ-আপ", "গ্রেডিং", "প্যাকেজিং"];

export function ProductDetail({ p }: { p: Product }) {
  const { addToCart, toast, wishlist, toggleWish, area } = useApp();
  const near = (slug: string) => { const sl = getSeller(slug)!; return !!area.division && inArea(area, sl.location, sl.division); };
  const [mode, setMode] = useState<"retail" | "wholesale">("retail");
  const [view, setView] = useState(0);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [sortBy, setSortBy] = useState<"price" | "rating">("price");
  const base = offersFor(p);
  const offers = [...base].sort((a, b) => (near(b.sellerSlug) ? 1 : 0) - (near(a.sellerSlug) ? 1 : 0) || (sortBy === "price" ? a[mode] - b[mode] : b.rating - a.rating));
  const best = [...base].sort((a, b) => a[mode] - b[mode])[0];
  const wished = wishlist.includes(p.slug);
  const q = (s: string) => qty[s] ?? (mode === "wholesale" ? p.minWholesale : 1);

  const add = (sellerSlug: string) => {
    const n = q(sellerSlug);
    if (mode === "wholesale" && n < p.minWholesale) { toast(`পাইকারি অর্ডারে ন্যূনতম ${bn(p.minWholesale)} ${p.unit} (MOQ)`, "err"); return; }
    addToCart({ productSlug: p.slug, sellerSlug, mode, qty: n });
    toast(`${p.bn} · ${bn(n)} ${p.unit} কার্টে যোগ হয়েছে`);
  };

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div>
          <div className="relative overflow-hidden rounded-md border border-mist-300">
            <div className="aspect-[4/3]"><ProductArt key={view} motif={p.motif} bg={p.color} accent={p.accent} seed={p.slug + (view ? view : "")} className={cn("h-full w-full animate-rise", view === 1 && "scale-125", view === 2 && "hue-rotate-[8deg] saturate-125")} /></div>
            <WishButton slug={p.slug} className="absolute right-3 top-3" />
            <span className="absolute bottom-3 left-3 rounded-sm bg-white/90 px-2 py-1 font-bn text-xs text-ink/70">চিত্রটি দৃষ্টান্তমূলক</span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {views.map((v, i) => (
              <button key={v} onClick={() => setView(i)} aria-label={v} aria-pressed={view === i} className={cn("overflow-hidden rounded border-2", view === i ? "border-teal" : "border-transparent opacity-70 hover:opacity-100")}>
                <div className="aspect-[4/3]"><ProductArt motif={p.motif} bg={p.color} accent={p.accent} seed={p.slug + (i || "")} className={cn("h-full w-full", i === 1 && "scale-125")} /></div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow">{p.category.replace("-", " & ")}</p>
          <h1 className="mt-2 font-bn text-4xl font-normal sm:text-5xl">{p.bn}</h1>
          <p className="mt-1 text-lg text-mist-500">{p.en}</p>
          <p className="mt-4 font-bn text-[15px] text-ink/75">{p.desc}</p>
          <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-mist-300 py-4 font-bn text-sm">
            <div><dt className="text-xs text-mist-500">উৎস</dt><dd className="text-navy">{p.origin}</dd></div>
            <div><dt className="text-xs text-mist-500">একক</dt><dd className="text-navy">{p.unit}</dd></div>
            <div><dt className="text-xs text-mist-500">পাইকারি MOQ</dt><dd className="text-navy">{bn(p.minWholesale)} {p.unit}</dd></div>
          </dl>

          <div className="mt-5 rounded-md bg-navy p-5 text-white">
            <div role="group" className="mb-4 inline-flex overflow-hidden rounded-md border border-white/25">
              {(["retail", "wholesale"] as const).map((m) => <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)} className={cn("px-4 py-1.5 font-bn text-sm", mode === m ? "bg-white text-navy" : "text-white/80 hover:bg-white/10")}>{m === "retail" ? "খুচরা" : "পাইকারি"}</button>)}
            </div>
            <p className="font-bn text-xs text-white/60">সর্বনিম্ন {mode === "retail" ? "খুচরা" : "পাইকারি"} দাম</p>
            <p className="mt-1 flex items-baseline gap-1"><span className="text-4xl font-bold tabular-nums">{taka(best[mode])}</span><span className="font-bn text-sm text-white/60">/{p.unit}</span></p>
            <p className="mt-1 font-bn text-sm text-white/70">{getSeller(best.sellerSlug)!.bn} · {getSeller(best.sellerSlug)!.location}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="#sellers" className="inline-flex h-11 items-center gap-2 rounded-md bg-gold px-5 font-bn font-medium text-navy hover:bg-[#b8933f]"><ShoppingBasket className="h-4 w-4" />{base.length}জন বিক্রেতা তুলনা করুন</a>
              <button onClick={() => { toggleWish(p.slug); toast(wished ? "তালিকা থেকে সরানো হয়েছে" : "পছন্দের তালিকায় যোগ হয়েছে", wished ? "info" : "ok"); }} className="inline-flex h-11 items-center gap-2 rounded-md border border-white/30 px-4 font-bn text-sm hover:bg-white/10"><Heart className={cn("h-4 w-4", wished && "fill-red-400 text-red-400")} />{wished ? "পছন্দের" : "পছন্দ করুন"}</button>
            </div>
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-2 text-center font-bn text-xs text-ink/70">
            {[[Truck, "জেলাভিত্তিক ডেলিভারি"], [Wallet, "COD · bKash · Nagad"], [BadgeCheck, "যাচাইকৃত রিভিউ"]].map(([I, t], i) => { const Icon = I as typeof Truck; return <li key={i} className="rounded-md border border-mist-300 bg-white px-2 py-3"><Icon className="mx-auto mb-1 h-5 w-5 text-teal" strokeWidth={1.5} />{t as string}</li>; })}
          </ul>
        </div>
      </div>

      <section id="sellers" className="mt-14 scroll-mt-36">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow">COMPARE SELLERS</p><h2 className="h-section mt-1">{p.bn} — বিক্রেতা তুলনা</h2>{area.division && <p className="mt-1 font-bn text-sm text-teal-700">আপনার এলাকা ({areaLabel(area)}) এর বিক্রেতারা আগে দেখানো হয়েছে।</p>}<p className="mt-1 font-bn text-sm text-ink/60">প্রতিটি রেটিং এই পণ্য × এই বিক্রেতার ডেলিভারি-সম্পন্ন অর্ডার থেকে। দামগুলো ডেমো।</p></div>
          <div className="flex items-center gap-3">
            <div role="group" className="inline-flex overflow-hidden rounded-md border border-navy/25 bg-white">
              {(["retail", "wholesale"] as const).map((m) => <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)} className={cn("px-3.5 py-1.5 font-bn text-sm", mode === m ? "bg-navy text-white" : "text-navy hover:bg-mist")}>{m === "retail" ? "খুচরা" : "পাইকারি"}</button>)}
            </div>
            <select aria-label="Sort" value={sortBy} onChange={(e) => setSortBy(e.target.value as "price" | "rating")} className="h-9 rounded-md border border-mist-300 bg-white px-2 font-bn text-sm"><option value="price">দাম অনুযায়ী</option><option value="rating">রেটিং অনুযায়ী</option></select>
          </div>
        </div>

        <div className="hidden overflow-x-auto rounded-md border border-mist-300 bg-white md:block">
          <table className="tbl w-full">
            <thead><tr><th>বিক্রেতা</th><th>অবস্থান</th><th>গ্রেড</th><th className={cn("text-right", mode === "retail" && "!bg-teal")}>খুচরা</th><th className={cn("text-right", mode === "wholesale" && "!bg-teal")}>পাইকারি</th><th>স্টক</th><th>পরিমাণ</th><th /></tr></thead>
            <tbody>
              {offers.map((o) => { const s = getSeller(o.sellerSlug)!; const isBest = o.sellerSlug === best.sellerSlug; return (
                <tr key={o.sellerSlug}>
                  <td>
                    <Link href={`/seller/${s.slug}`} className="font-bn text-[15px] font-medium text-navy hover:text-teal">{s.bn}</Link>
                    <div className="mt-0.5 flex items-center gap-2">{s.verified && <VerifiedBadge small />}{near(o.sellerSlug) && <span className="rounded-sm bg-gold-50 px-1.5 py-0.5 font-bn text-[11px] text-gold-700">আপনার এলাকায়</span>}<Stars value={o.rating} count={o.reviews} /></div>
                  </td>
                  <td className="font-bn"><span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-mist-500" />{s.location}</span></td>
                  <td><span className="inline-flex items-center gap-1 font-semibold text-navy"><Award className="h-3.5 w-3.5 text-gold" />{o.grade}</span></td>
                  <td className={cn("text-right tabular-nums", mode === "retail" && "font-bold text-navy")}>{taka(o.retail)}{mode === "retail" && isBest && <span className="ml-1.5 rounded-sm bg-teal px-1 py-0.5 font-bn text-[10px] font-normal text-white">সেরা</span>}</td>
                  <td className={cn("text-right tabular-nums", mode === "wholesale" && "font-bold text-navy")}>{taka(o.wholesale)}{mode === "wholesale" && isBest && <span className="ml-1.5 rounded-sm bg-teal px-1 py-0.5 font-bn text-[10px] font-normal text-white">সেরা</span>}<span className="block font-bn text-[10px] font-normal text-mist-500">MOQ {bn(o.minWholesale)}</span></td>
                  <td className="font-bn tabular-nums text-ink/70">{bn(o.stock)} {p.unit}</td>
                  <td><QtyStepper compact value={q(o.sellerSlug)} min={1} onChange={(n) => setQty({ ...qty, [o.sellerSlug]: n })} /></td>
                  <td className="text-right"><Button size="sm" onClick={() => add(o.sellerSlug)}>কার্টে যোগ</Button></td>
                </tr>); })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {offers.map((o) => { const s = getSeller(o.sellerSlug)!; const isBest = o.sellerSlug === best.sellerSlug; return (
            <div key={o.sellerSlug} className={cn("rounded-md border bg-white p-4", isBest ? "border-teal" : "border-mist-300")}>
              <div className="flex items-start justify-between gap-2">
                <div><Link href={`/seller/${s.slug}`} className="font-bn text-base font-medium text-navy">{s.bn}</Link><p className="flex items-center gap-1 font-bn text-xs text-ink/60"><MapPin className="h-3 w-3" />{s.location} · গ্রেড {o.grade}</p></div>
                {isBest && <span className="rounded-sm bg-teal px-1.5 py-0.5 font-bn text-[11px] text-white">সেরা দাম</span>}
              </div>
              <div className="mt-2 flex items-center gap-2">{s.verified && <VerifiedBadge small />}<Stars value={o.rating} count={o.reviews} /></div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className={cn("rounded border p-2", mode === "retail" ? "border-teal bg-teal-50" : "border-mist-300")}><p className="font-bn text-[10px] text-mist-500">খুচরা</p><Price value={o.retail} unit={p.unit} size="sm" /></div>
                <div className={cn("rounded border p-2", mode === "wholesale" ? "border-teal bg-teal-50" : "border-mist-300")}><p className="font-bn text-[10px] text-mist-500">পাইকারি · MOQ {bn(o.minWholesale)}</p><Price value={o.wholesale} unit={p.unit} size="sm" /></div>
              </div>
              <div className="mt-3 flex items-center gap-2"><QtyStepper compact value={q(o.sellerSlug)} onChange={(n) => setQty({ ...qty, [o.sellerSlug]: n })} /><Button className="flex-1" onClick={() => add(o.sellerSlug)}>কার্টে যোগ করুন</Button></div>
            </div>); })}
        </div>
      </section>

      <section className="mt-14">
        <Tabs tabs={[
          { id: "d", label: "বিবরণ", content: <div className="max-w-2xl space-y-3 font-bn text-[15px] text-ink/80"><p>{p.desc}</p><p className="flex items-center gap-2 text-sm"><Sprout className="h-4 w-4 text-teal" />উৎস: {p.origin}{p.season && ` · মৌসুম: ${p.season}`}</p></div> },
          { id: "r", label: `রিভিউ (${bn(base.reduce((a, o) => a + o.reviews, 0))})`, content: <div className="grid gap-3 md:grid-cols-2">{base.slice(0, 4).map((o) => <div key={o.sellerSlug} className="rounded-md border border-mist-300 bg-white p-4"><div className="flex justify-between"><b className="font-bn text-navy">{getSeller(o.sellerSlug)!.bn}</b><Stars value={o.rating} count={o.reviews} /></div><p className="mt-2 font-bn text-sm text-ink/70">এই বিক্রেতার {p.bn} নিয়ে যাচাইকৃত ক্রেতাদের গড় রেটিং। (ডেমো)</p></div>)}</div> },
          { id: "s", label: "ডেলিভারি ও পেমেন্ট", content: <ul className="max-w-2xl list-disc space-y-2 pl-5 font-bn text-[15px] text-ink/80"><li>ক্যাশ অন ডেলিভারি (COD) প্রথমে; bKash/Nagad লাইসেন্সপ্রাপ্ত গেটওয়ের মাধ্যমে — পরিকল্পিত।</li><li>এই প্রিভিউ সংস্করণে কোনো বাস্তব অর্ডার বা পেমেন্ট প্রক্রিয়া হয় না।</li></ul> },
        ]} />
      </section>
    </>
  );
}
