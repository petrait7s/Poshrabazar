import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { PillarHero } from "@/components/PillarHero";
import { SoftwareMock } from "@/components/Viz";
import { DemoForm } from "./DemoForm";
import { software } from "@/data/software";

export const generateStaticParams = () => software.map((s) => ({ slug: s.slug }));
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = software.find((x) => x.slug === slug);
  if (!s) notFound();
  return (
    <>
      <PillarHero pillar="solutions" crumbs={[{ label: "হোম", href: "/" }, { label: "বিজনেস সলিউশন", href: "/business-solutions" }, { label: s.name }]} title={<span className="font-sans font-bold">{s.name}</span>} sub={`${s.bn} (${s.en}) — ${s.audience}`} />
      <div className="container-x grid gap-10 py-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="rounded-md bg-navy p-5 sm:p-8"><SoftwareMock kind={s.slug as "petrapos"} /></div>
          <p className="mt-2 font-bn text-xs text-mist-500">দৃষ্টান্তমূলক ইন্টারফেস — প্রকৃত সফটওয়্যারের স্ক্রিনশট নয়।</p>
          <h2 className="h-section mt-8">{s.desc}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 font-bn text-[15px]">{s.features.map((f) => <li key={f} className="flex items-start gap-2 rounded-md border border-mist-300 bg-white p-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />{f}</li>)}</ul>
        </div>
        <div id="demo" className="h-fit scroll-mt-36 rounded-md border border-mist-300 bg-white p-6 shadow-card lg:sticky lg:top-32"><h2 className="font-bn text-xl">ডেমো অনুরোধ করুন</h2><p className="mb-4 mt-1 font-bn text-sm text-ink/60">আমাদের টিম আপনার সঙ্গে যোগাযোগ করবে। (প্রিভিউ: ফর্ম জমা হয় না)</p><DemoForm product={s.name} /></div>
      </div>
    </>
  );
}
