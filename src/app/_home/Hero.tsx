"use client";
import Image from "next/image";
import { ArrowRight, TrendingDown } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { LinkButton } from "@/components/ui/button";
import { T } from "@/components/providers";
import { taka } from "@/data/catalog";
import { Delta } from "@/components/Viz";
import { priceRows } from "@/data/prices";

export function Hero() {
  
  
  const tick = priceRows.slice(0, 4);
  return (
    <section className="relative isolate overflow-hidden bg-cream text-ink">
      {/* colour washes under the multiplied line art */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#FFEFD6_0%,#FFF6E8_32%,#FFFBF5_62%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-[46%] bg-[linear-gradient(0deg,#F8E3C2_0%,#FCEBD0_55%,#FFF3E0_100%)]" />
      <div className="absolute inset-y-0 left-0 -z-[4] w-full bg-gradient-to-r from-cream from-30% via-cream/85 via-50% to-transparent max-lg:from-cream/80 max-lg:via-cream/70 max-lg:to-cream/40 lg:w-[68%]" />
      <div className="absolute inset-y-0 right-0 -z-[5] w-full [mask-image:linear-gradient(90deg,transparent_0%,transparent_34%,#000_60%)] lg:w-[72%] max-lg:opacity-25">
        <Image src="/hero-line.webp" alt="" fill priority sizes="(min-width:1024px) 72vw, 100vw" className="-scale-x-100 object-cover object-right-bottom mix-blend-multiply" />
      </div>
      <div className="container-x relative z-10 grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-20">
        <div className="animate-rise">
          <p className="eyebrow"><T bn="সিলেট থেকে শুরু" en="Starting in Sylhet" /></p>
          <h1 className="mt-4 font-bn text-[2.6rem] font-semibold leading-[1.15] !text-ink sm:text-6xl">মাঠ থেকে সরাসরি,<br />আপনার <span className="text-primary">এলাকার বাজার</span></h1>
          <p className="mt-5 max-w-xl font-bn text-lg font-medium text-ink sm:text-xl">কৃষক, উৎপাদক, তরুণ উদ্যোক্তা ও ক্রেতা—সবাই এক বাজারে।</p>
          <p className="mt-1 text-sm text-ink/75">Farmers, producers, young entrepreneurs and buyers — in one marketplace.</p>
          <SearchBar size="lg" className="mt-7 hidden max-w-xl sm:block" />
          <div className="mt-7 flex flex-wrap gap-3 sm:mt-5">
            <LinkButton href="/marketplace" variant="dark" size="lg">পণ্য খুঁজুন <ArrowRight className="h-4 w-4" /></LinkButton>
            <LinkButton href="/seller/register" variant="outline" size="lg">বিক্রেতা হিসেবে যোগ দিন</LinkButton>
          </div>
          <dl className="mt-9 grid max-w-xl grid-cols-3 gap-2.5 sm:gap-3">
            {[["এক পণ্য, বহু বিক্রেতা", "One product, many sellers"], ["খুচরা + পাইকারি", "Retail + wholesale"], ["ক্যাশ অন ডেলিভারি", "Online payment coming later"]].map(([a, b]) => (
              <div key={a} className="surface rounded-md px-3 py-2.5"><dt className="font-bn text-[13px] text-ink">{a}</dt><dd className="mt-0.5 text-[11px] text-ink/70">{b}</dd></div>
            ))}
          </dl>
        </div>

        <div className="relative hidden min-h-[420px] lg:block">
          <div className="surface-dark absolute bottom-0 right-0 w-56 rounded-md text-white p-3.5 shadow-lift">
            <p className="flex items-center gap-1.5 font-bn text-xs text-white/70"><TrendingDown className="h-3.5 w-3.5 text-accent" />আজকের দর</p>
            {tick.map((r) => <div key={r.slug} className="mt-1.5 flex items-center justify-between text-sm"><span className="font-bn">{r.bn}</span><span className="flex items-center gap-2 tabular-nums"><b>{taka(r.today)}</b><Delta dark now={r.today} prev={r.yesterday} /></span></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
