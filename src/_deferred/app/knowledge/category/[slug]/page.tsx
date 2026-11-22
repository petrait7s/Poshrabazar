import { notFound } from "next/navigation";
import { PillarHero } from "@/components/PillarHero";
import { ArticleCard } from "@/_deferred/components/ArticleCard";
import { EmptyState } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { articles, kCategories } from "@/_deferred/data/knowledge";
export const generateStaticParams = () => kCategories.map((c) => ({ slug: c.slug }));
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = kCategories.find((x) => x.slug === slug);
  if (!c) notFound();
  const list = articles.filter((a) => a.cat === c.slug);
  return (
    <>
      <PillarHero pillar="knowledge" crumbs={[{ label: "হোম", href: "/" }, { label: "নলেজ হাব", href: "/knowledge" }, { label: c.bn }]} title={c.bn} sub={c.en} />
      <div className="container-x py-12">{list.length ? <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{list.map((a) => <ArticleCard key={a.slug} a={a} />)}</div> : <EmptyState title="এই বিভাগে এখনো লেখা নেই" text="শীঘ্রই আসছে।" action={<LinkButton href="/knowledge" variant="outline">সব লেখা</LinkButton>} />}</div>
    </>
  );
}
