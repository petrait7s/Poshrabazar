import Link from "next/link";
import { PillarHero } from "@/components/PillarHero";
import { ProductArt } from "@/components/ProductArt";
import { categories, products } from "@/data/catalog";
export const metadata = { title: "সব ক্যাটাগরি" };
export default function Page() {
  return (
    <>
      <PillarHero pillar="marketplace" crumbs={[{ label: "হোম", href: "/" }, { label: "ক্যাটাগরি" }]} title="সব ক্যাটাগরি" sub="প্রথমে একটি অঞ্চল ও ২–৩টি নিত্যপ্রয়োজনীয় ক্যাটাগরি দিয়ে শুরু।" />
      <div className="container-x grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const items = products.filter((p) => p.category === c.slug);
          return (
            <Link key={c.slug} href={`/category/${c.slug}`} className="group overflow-hidden surface rounded-md transition-shadow hover:shadow-lift">
              <div className="aspect-[16/7] overflow-hidden"><ProductArt motif={c.motif} bg={c.color} accent={items[0]?.accent ?? "#C2410C"} seed={c.slug} className="h-full w-full transition-transform duration-500 group-hover:scale-105" /></div>
              <div className="p-4"><h2 className="font-bn text-xl text-ink group-hover:text-primary">{c.bn} <span className="text-sm text-muted">{c.en}</span></h2><p className="mt-1 font-bn text-sm text-ink/65">{c.blurb}</p><p className="mt-2 text-xs text-primary">{items.map((p) => p.bn).join(" · ")}</p></div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
