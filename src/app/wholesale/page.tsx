import { PillarHero } from "@/components/PillarHero";
import { ProductExplorer } from "@/components/ProductExplorer";
export const metadata = { title: "পাইকারি বাজার" };
export default function Page() {
  return (
    <>
      <PillarHero pillar="marketplace" crumbs={[{ label: "হোম", href: "/" }, { label: "মার্কেটপ্লেস", href: "/marketplace" }, { label: "পাইকারি" }]} title="পাইকারি বাজার" sub="গ্রেড, উৎস ও ন্যূনতম অর্ডার (MOQ) সহ বড় পরিমাণে কেনাবেচা।" />
      <div className="container-x py-8"><ProductExplorer initialMode="wholesale" /></div>
    </>
  );
}
