import { notFound } from "next/navigation";
import { PillarHero } from "@/components/PillarHero";
import { ProductExplorer } from "@/components/ProductExplorer";
import { categories, getCategory } from "@/data/catalog";
export const generateStaticParams = () => categories.map((c) => ({ slug: c.slug }));
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const c = getCategory((await params).slug);
  if (!c) notFound();
  return (
    <>
      <PillarHero pillar="marketplace" crumbs={[{ label: "হোম", href: "/" }, { label: "ক্যাটাগরি", href: "/categories" }, { label: c.bn }]} title={<>{c.bn} <span className="text-2xl text-white/50 sm:text-3xl">{c.en}</span></>} sub={c.blurb} />
      <div className="container-x py-8"><ProductExplorer category={c.slug} lockCategory /></div>
    </>
  );
}
