import Link from "next/link";
import { LineChart, Calculator, Bell, CalendarDays } from "lucide-react";
import { PillarHero } from "@/components/PillarHero";
import { SectionHead } from "@/components/ui/misc";
import { Delta, Sparkline } from "@/components/Viz";
import { Tools } from "./Tools";
import { priceRows } from "@/data/prices";
import { taka } from "@/data/catalog";
export const metadata = { title: "মার্কেট ইন্টেলিজেন্স" };
export default function Page() {
  const movers = [...priceRows].sort((a, b) => Math.abs(b.today - b.yesterday) / b.yesterday - Math.abs(a.today - a.yesterday) / a.yesterday).slice(0, 4);
  return (
    <>
      <PillarHero pillar="intelligence" crumbs={[{ label: "হোম", href: "/" }, { label: "মার্কেট ইন্টেলিজেন্স" }]} title="বিক্রির আগে দাম জানুন" sub="জেলা ও পণ্যভিত্তিক দৈনিক দর, পাইকারি বনাম খুচরা, মৌসুমি প্রবণতা, ক্যালকুলেটর ও প্রাইস অ্যালার্ট।">
        <div className="flex flex-wrap gap-3 font-bn text-sm text-white/85">{[[LineChart, "দৈনিক দর"], [Calculator, "ক্যালকুলেটর"], [Bell, "প্রাইস অ্যালার্ট"], [CalendarDays, "ফসল ক্যালেন্ডার"]].map(([I, t], i) => { const Icon = I as typeof Bell; return <span key={i} className="inline-flex items-center gap-2 border border-white/25 px-3 py-1.5"><Icon className="h-4 w-4 text-gold" />{t as string}</span>; })}</div>
      </PillarHero>
      <div className="container-x py-12">
        <SectionHead eyebrow="TODAY" title="আজকের বড় পরিবর্তন" href="/market-prices" cta="সব দর" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{movers.map((r) => <Link key={r.slug} href={`/market-prices/${r.slug}`} className="glass rounded-md p-4 hover:shadow-lift"><p className="font-bn text-navy">{r.bn}</p><p className="mt-1 text-2xl font-bold tabular-nums">{taka(r.today)}</p><div className="mt-1 flex items-center justify-between"><Delta now={r.today} prev={r.yesterday} /><Sparkline data={r.trend} className="w-16" /></div></Link>)}</div>
        <SectionHead className="mt-14" eyebrow="TOOLS" title="ক্যালকুলেটর ও অ্যালার্ট" sub="সব হিসাব আপনার ব্রাউজারেই হয়; কিছু সংরক্ষিত হয় না।" />
        <Tools />
      </div>
    </>
  );
}
