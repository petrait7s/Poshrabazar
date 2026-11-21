"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { PillarHero } from "@/components/PillarHero";
import { Delta, Sparkline } from "@/components/Viz";
import { Select } from "@/components/ui/form";
import { DemoBadge } from "@/components/ui/misc";
import { markets, priceRows } from "@/data/prices";
import { categories, products, taka } from "@/data/catalog";
import { cn } from "@/lib/utils";

export default function Page() {
  const [m, setM] = useState(markets[0].slug);
  const [cat, setCat] = useState("");
  const [kind, setKind] = useState<"retail" | "wholesale">("retail");
  const f = markets.find((x) => x.slug === m)!.f;
  const rows = useMemo(() => priceRows.filter((r) => !cat || products.find((p) => p.slug === r.slug)!.category === cat), [cat]);
  const price = (r: (typeof priceRows)[0], v: number) => Math.round(v * f * (kind === "wholesale" ? 0.9 : 1.04));
  return (
    <>
      <PillarHero pillar="intelligence" crumbs={[{ label: "হোম", href: "/" }, { label: "বাজারদর" }]} title="আজকের বাজারদর" sub="জেলা ও পণ্যভিত্তিক দৈনিক দর — পাইকারি বনাম খুচরা। বিক্রির আগে দাম জানুন।" />
      <div className="container-x py-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Select value={m} onChange={(e) => setM(e.target.value)} aria-label="Market">{markets.map((x) => <option key={x.slug} value={x.slug}>{x.bn}, {x.city}</option>)}</Select>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="">সব ক্যাটাগরি</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.bn}</option>)}</Select>
          <div className="inline-flex overflow-hidden rounded-md border border-ink/25 bg-white">{(["retail", "wholesale"] as const).map((k) => <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k} className={cn("px-3.5 py-2 font-bn text-sm", kind === k ? "bg-ink text-white" : "text-ink hover:bg-tint")}>{k === "retail" ? "খুচরা" : "পাইকারি"}</button>)}</div>
          <DemoBadge className="ml-auto" /><span className="font-bn text-xs text-muted">প্রদর্শনী মান, বাস্তব বাজারদর নয়</span>
        </div>
        <div className="overflow-x-auto surface rounded-md">
          <table className="tbl w-full min-w-[620px]">
            <thead><tr><th>পণ্য</th><th className="text-right">আজ</th><th className="text-right">গতকাল</th><th className="text-right">পরিবর্তন</th><th className="text-right">সর্বনিম্ন–সর্বোচ্চ</th><th>৭ দিনের প্রবণতা</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.slug}><td><Link href={`/market-prices/${r.slug}`} className="font-bn text-[15px] text-ink hover:text-primary">{r.bn}</Link><span className="ml-1 text-xs text-muted">/{r.unit}</span></td><td className="text-right font-bold tabular-nums">{taka(price(r, r.today))}</td><td className="text-right tabular-nums text-muted">{taka(price(r, r.yesterday))}</td><td className="text-right"><Delta now={r.today} prev={r.yesterday} /></td><td className="text-right text-xs tabular-nums text-ink/70">{taka(price(r, r.low))} – {taka(price(r, r.high))}</td><td><Sparkline data={r.trend} /></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}
