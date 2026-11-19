import { PillarHero } from "@/components/PillarHero";
import { ProductExplorer } from "@/components/ProductExplorer";
export const metadata = { title: "মার্কেটপ্লেস" };
export default function Page() {
  return (
    <>
      <PillarHero pillar="marketplace" crumbs={[{ label: "হোম", href: "/" }, { label: "মার্কেটপ্লেস" }]} title="মার্কেটপ্লেস" sub="এক পণ্য, বহু বিক্রেতা — দাম, অবস্থান ও রেটিং পাশাপাশি তুলনা করুন। খুচরা ও পাইকারি দুটোই।" />
      <div className="container-x py-8"><ProductExplorer /></div>
    </>
  );
}
