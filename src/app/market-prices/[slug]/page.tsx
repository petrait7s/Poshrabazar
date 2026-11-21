import { notFound } from "next/navigation";
import Link from "next/link";
import { PillarHero } from "@/components/PillarHero";
import { BarChart, Delta, Sparkline } from "@/components/Viz";
import { Panel } from "@/components/DashboardShell";
import { LinkButton } from "@/components/ui/button";
import { markets, priceRows } from "@/data/prices";
import { taka } from "@/data/catalog";
export const generateStaticParams = () => priceRows.map((r) => ({ slug: r.slug }));
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = priceRows.find((x) => x.slug === slug);
  if (!r) notFound();
  return (
    <>
      <PillarHero pillar="intelligence" crumbs={[{ label: "হোম", href: "/" }, { label: "বাজারদর", href: "/market-prices" }, { label: r.bn }]} title={`${r.bn} — বাজারদর`} sub={`${r.en} · প্রতি ${r.unit} · ডেমো মান`} />
      <div className="container-x grid gap-6 py-8 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="গত ৭ দিন (৳)"><BarChart data={r.trend} labels={["৭", "৬", "৫", "৪", "৩", "২", "আজ"]} height={220} /><p className="mt-4 flex items-center gap-3 font-bn text-sm">আজ <b className="text-xl tabular-nums">{taka(r.today)}</b><Delta now={r.today} prev={r.yesterday} /><Sparkline data={r.trend} className="ml-auto" /></p></Panel>
        <Panel title="বাজারভেদে দর"><ul className="divide-y divide-tint">{markets.map((m) => <li key={m.slug} className="flex justify-between py-2.5 font-bn"><span>{m.bn}, {m.city}</span><b className="tabular-nums">{taka(Math.round(r.today * m.f))}</b></li>)}</ul><div className="mt-4 flex flex-wrap gap-2"><LinkButton href={`/product/${r.slug}`} size="sm">বিক্রেতা তুলনা</LinkButton></div></Panel>
      </div>
      <p className="container-x pb-10 font-bn text-xs text-muted"><Link href="/market-prices" className="text-primary underline">← সব দর</Link></p>
    </>
  );
}
