import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock } from "lucide-react";
import { ArticleCard, ArticleCover } from "@/components/ArticleCard";
import { Breadcrumb } from "@/components/ui/misc";
import { articles, kCategories } from "@/data/knowledge";
export const generateStaticParams = () => articles.map((a) => ({ slug: a.slug }));
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = articles.find((x) => x.slug === slug);
  if (!a) notFound();
  const cat = kCategories.find((c) => c.slug === a.cat)!;
  const more = articles.filter((x) => x.slug !== a.slug).slice(0, 3);
  return (
    <article>
      <header className="border-b border-mist-300 bg-white"><div className="container-x max-w-4xl py-10">
        <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: "নলেজ হাব", href: "/knowledge" }, { label: cat.bn, href: `/knowledge/category/${cat.slug}` }]} />
        <h1 className="mt-5 font-bn text-3xl font-normal sm:text-5xl">{a.bn}</h1>
        <p className="mt-2 text-mist-500">{a.en}</p>
        <p className="mt-4 flex items-center gap-3 font-bn text-sm text-ink/60"><span>{a.author}</span><span>·</span><span>{a.date}</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{a.minutes} min</span></p>
      </div></header>
      <div className="container-x max-w-3xl py-10">
        <div className="mb-8 aspect-[16/8] overflow-hidden rounded-md"><ArticleCover a={a} className="h-full w-full" /></div>
        <p className="font-bn text-xl text-ink/80">{a.excerpt}</p>
        <div className="mt-6 space-y-5 font-bn text-[17px] leading-[1.9] text-ink/90">{a.body.map((b, i) => <p key={i}>{b}</p>)}</div>
        <p className="mt-8 rounded-md border border-gold/50 bg-gold-50 p-4 font-bn text-sm text-gold-700">ডেমো কনটেন্ট: এটি নমুনা লেখা। প্রকাশের আগে বিশেষজ্ঞ-পর্যালোচনা প্রয়োজন।</p>
        <p className="mt-6 font-bn text-sm">সম্পর্কিত টুল: <Link href="/market-intelligence" className="text-teal underline">ফসল-মুনাফা ক্যালকুলেটর</Link> · <Link href="/market-prices" className="text-teal underline">আজকের বাজারদর</Link></p>
      </div>
      <div className="container-x pb-14"><h2 className="h-section mb-6">আরও পড়ুন</h2><div className="grid gap-8 sm:grid-cols-3">{more.map((x) => <ArticleCard key={x.slug} a={x} />)}</div></div>
    </article>
  );
}
