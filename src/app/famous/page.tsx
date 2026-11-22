import { PillarHero } from "@/components/PillarHero";
import { ProductCard } from "@/components/Commerce";
import { LinkButton } from "@/components/ui/button";
import { divisions, divisionOf } from "@/data/locations";
import { genitive, products } from "@/data/catalog";
export const metadata = { title: "দেশজুড়ে বিখ্যাত পণ্য" };

export default function Page() {
  const famous = products.filter((p) => p.famous);
  const groups = divisions.map((d) => ({ d, items: famous.filter((p) => divisionOf(p.famous!) === d.bn) })).filter((g) => g.items.length);
  return (
    <>
      <PillarHero pillar="marketplace" crumbs={[{ label: "হোম", href: "/" }, { label: "মার্কেটপ্লেস", href: "/marketplace" }, { label: "বিখ্যাত পণ্য" }]} title="যার যার এলাকার সেরা — সারা দেশে" sub="দই, মিষ্টি, শুটকি, চা, জামদানি, শীতলপাটি — যে পণ্য এলাকাকে বিখ্যাত করেছে, তা এখন দেশের যেকোনো জায়গায় পাঠানো যায়।">
        <LinkButton href="/become-a-seller" variant="accent">আপনার এলাকার পণ্য বিক্রি করুন</LinkButton>
      </PillarHero>
      <div className="container-x space-y-12 py-10">
        {groups.map(({ d, items }) => (
          <section key={d.bn}>
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="h-section">{d.bn} বিভাগ</h2>
              <p className="font-bn text-sm text-primary">{[...new Set(items.map((p) => genitive(p.famous!)))].join(" · ")}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{items.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
          </section>
        ))}
      </div>
    </>
  );
}
