import { notFound } from "next/navigation";
import { MapPin, CalendarDays, Sprout } from "lucide-react";
import { ProductCard } from "@/components/Commerce";
import { FollowButton } from "@/components/FollowButton";
import { Breadcrumb, EmptyState, Tabs } from "@/components/ui/misc";
import { getSeller, sellers, bn } from "@/data/catalog";
import { originDistrict, productsByCategory, productsOfStore } from "@/data/market";

export const generateStaticParams = () => sellers.map((s) => ({ slug: s.slug }));
export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> }) => ({ title: getSeller((await params).slug)?.bn ?? "দোকান" });

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const s = getSeller((await params).slug);
  if (!s) notFound();
  const list = productsOfStore(s.slug);
  const groups = productsByCategory(list);
  const origins = [...new Set(list.map(originDistrict))];
  return (
    <>
      <section className="surface-band">
        <div className="container-x py-8">
          <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: "দোকান", href: "/stores" }, { label: s.bn }]} />
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-md bg-ink font-bn text-4xl text-white">{s.bn[0]}</div>
            <div className="flex-1">
              <h1 className="font-bn text-3xl font-semibold">{s.bn}</h1>
              <p className="mt-1 font-bn text-ink/70">{s.desc}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-bn text-sm text-ink/70">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{s.location}, {s.division}</span>
                <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />{bn(s.since)} থেকে</span>
                <span>{s.kind}</span>
              </div>
            </div>
            <FollowButton slug={s.slug} />
          </div>
        </div>
      </section>
      <div className="container-x py-8">
        <Tabs tabs={[
          { id: "p", label: `পণ্য (${bn(list.length)})`, content: (
            <div className="space-y-10">
              {groups.map(({ c, items }) => (
                <section key={c.slug} aria-labelledby={`g-${c.slug}`}>
                  <h2 id={`g-${c.slug}`} className="h-section mb-4">{c.bn} <span className="text-base text-muted">({bn(items.length)})</span></h2>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
                </section>
              ))}
            </div>
          ) },
          { id: "a", label: "পরিচিতি ও উৎস", content: (
            <div className="max-w-2xl space-y-5 font-bn text-[15px] text-ink/80">
              <p>{s.desc}</p>
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-ink"><Sprout className="h-4 w-4 text-primary" />পণ্য যেসব জেলা থেকে আসে</h3>
                <p>{origins.join(", ")}</p>
              </div>
              <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-muted">নমুনা তথ্য (ডেমো)। আসল দোকানে বিক্রেতা নিজে সংগ্রহের জায়গা ও উৎপাদন পদ্ধতি লিখবেন; সেটি “বিক্রেতার নিজের বিবরণ” হিসেবে দেখানো হবে।</p>
            </div>
          ) },
          { id: "u", label: "আপডেট", content: <EmptyState title="এখনো কোনো আপডেট নেই" text="দোকান নতুন ফসল, সংগ্রহ বা উৎপাদনের আপডেট দিলে এখানে সবার আগে নতুনটি দেখা যাবে।" /> },
        ]} />
      </div>
    </>
  );
}
