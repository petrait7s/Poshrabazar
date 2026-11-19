"use client";
import Link from "next/link";
import { ArrowRight, BadgeCheck, TrendingDown } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { LinkButton } from "@/components/ui/button";
import { ProductArt } from "@/components/ProductArt";
import { T } from "@/components/providers";
import { getProduct, getSeller, offersFor, taka } from "@/data/catalog";
import { Delta } from "@/components/Viz";
import { priceRows } from "@/data/prices";

export function Hero() {
  const potato = getProduct("potato")!;
  const offers = offersFor(potato).slice(0, 3);
  const tiles = ["onion", "himsagar-mango", "miniket-rice", "rui-fish"].map((s) => getProduct(s)!);
  const tick = priceRows.slice(0, 4);
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "56px 56px" }} />
      <div className="container-x relative grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-20">
        <div className="animate-rise">
          <p className="eyebrow !text-gold"><T bn="Buy · Sell · Learn · Grow" en="Buy · Sell · Learn · Grow" /></p>
          <h1 className="mt-4 font-bn text-[2.6rem] font-normal leading-[1.15] !text-white sm:text-6xl">বাংলার উন্মুক্ত<br />ডিজিটাল <span className="text-gold">বাজার</span></h1>
          <p className="mt-5 max-w-xl font-bn text-lg text-white/80 sm:text-xl">কৃষক, ব্যবসায়ী, পাইকার ও ক্রেতা—সবাই এক বাজারে।</p>
          <p className="mt-1 text-sm text-white/55">Farmers, traders, wholesalers and buyers — in one marketplace.</p>
          <SearchBar size="lg" className="mt-7 hidden max-w-xl sm:block [&_form]:border-white/0" />
          <div className="mt-7 flex flex-wrap gap-3 sm:mt-5">
            <LinkButton href="/marketplace" variant="gold" size="lg">পণ্য খুঁজুন <ArrowRight className="h-4 w-4" /></LinkButton>
            <LinkButton href="/seller/register" variant="outline-light" size="lg">বিক্রেতা হিসেবে যোগ দিন</LinkButton>
          </div>
          <dl className="mt-9 grid max-w-xl grid-cols-3 gap-4 border-t border-white/15 pt-5">
            {[["এক পণ্য, বহু বিক্রেতা", "One product, many sellers"], ["খুচরা + পাইকারি", "Retail + wholesale"], ["COD · bKash · Nagad", "Payment options"]].map(([a, b]) => (
              <div key={a}><dt className="font-bn text-[13px] text-white">{a}</dt><dd className="mt-0.5 text-[11px] text-white/50">{b}</dd></div>
            ))}
          </dl>
        </div>

        <div className="relative hidden min-h-[460px] lg:block">
          <div className="absolute right-0 top-0 grid w-[88%] grid-cols-2 gap-3">
            {tiles.map((p, i) => (
              <Link key={p.slug} href={`/product/${p.slug}`} className={`group relative overflow-hidden rounded-md ${i % 3 === 0 ? "aspect-[4/5]" : "aspect-[4/3]"} ${i === 1 ? "mt-8" : ""} ${i === 2 ? "-mt-8" : ""}`}>
                <ProductArt motif={p.motif} bg={p.color} accent={p.accent} seed={p.slug} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute bottom-2 left-2 rounded-sm bg-navy/85 px-2 py-0.5 font-bn text-xs">{p.bn}</span>
              </Link>
            ))}
          </div>
          <div className="absolute -left-2 bottom-2 w-[330px] rounded-md bg-white p-4 text-ink shadow-lift">
            <div className="flex items-center justify-between"><p className="font-bn text-sm text-navy">আলু · বিক্রেতা তুলনা</p><span className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">Demo</span></div>
            <ul className="mt-2 divide-y divide-mist">
              {offers.map((o, i) => { const s = getSeller(o.sellerSlug)!; return (
                <li key={o.sellerSlug} className="flex items-center justify-between py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5 font-bn"><span className="truncate">{s.bn}</span>{s.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-teal" />}</span>
                  <span className="flex items-baseline gap-2 tabular-nums"><b className={i === 0 ? "text-teal" : "text-navy"}>{taka(o.retail)}</b><span className="text-xs text-mist-500">{taka(o.wholesale)}</span></span>
                </li>); })}
            </ul>
          </div>
          <div className="absolute right-0 top-[52%] w-52 rounded-md border border-white/15 bg-navy-800/95 p-3.5 shadow-lift backdrop-blur">
            <p className="flex items-center gap-1.5 font-bn text-xs text-white/70"><TrendingDown className="h-3.5 w-3.5 text-gold" />আজকের দর</p>
            {tick.map((r) => <div key={r.slug} className="mt-1.5 flex items-center justify-between text-sm"><span className="font-bn">{r.bn}</span><span className="flex items-center gap-2 tabular-nums"><b>{taka(r.today)}</b><Delta now={r.today} prev={r.yesterday} /></span></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
