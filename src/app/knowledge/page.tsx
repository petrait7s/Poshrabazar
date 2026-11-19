import Link from "next/link";
import { PillarHero } from "@/components/PillarHero";
import { ArticleCard } from "@/components/ArticleCard";
import { SectionHead } from "@/components/ui/misc";
import { articles, kCategories } from "@/data/knowledge";
export const metadata = { title: "নলেজ হাব" };
export default function Page() {
  return (
    <>
      <PillarHero pillar="knowledge" crumbs={[{ label: "হোম", href: "/" }, { label: "নলেজ হাব" }]} title="নলেজ হাব" sub="কৃষি, প্রাণিসম্পদ, মৎস্য ও ক্ষুদ্র ব্যবসার ব্যবহারিক জ্ঞান — বাংলায়। লেখা, ভিডিও, গাইড ও কোর্স (ধাপে ধাপে)।">
        <div className="flex flex-wrap gap-2">{kCategories.map((c) => <Link key={c.slug} href={`/knowledge/category/${c.slug}`} className="rounded-full border border-white/30 px-4 py-1.5 font-bn text-sm text-white hover:bg-white hover:text-navy">{c.bn}</Link>)}</div>
      </PillarHero>
      <div className="container-x py-12">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]"><ArticleCard a={articles[0]} featured /><div className="space-y-6">{articles.slice(1, 4).map((a) => <ArticleCard key={a.slug} a={a} row />)}</div></div>
        <SectionHead className="mt-14" eyebrow="LATEST" title="সাম্প্রতিক লেখা" />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{articles.map((a) => <ArticleCard key={a.slug} a={a} />)}</div>
        <p className="mt-12 glass rounded-md p-4 font-bn text-sm text-ink/70">বিশেষজ্ঞ-পর্যালোচিত কনটেন্ট। স্পনসরড কনটেন্ট স্পষ্টভাবে চিহ্নিত থাকবে। এখানকার লেখাগুলো ডেমো নমুনা।</p>
      </div>
    </>
  );
}
