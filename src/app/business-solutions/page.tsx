import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PillarHero } from "@/components/PillarHero";
import { SoftwareMock } from "@/components/Viz";
import { LinkButton } from "@/components/ui/button";
import { software, khataLite } from "@/data/software";
export const metadata = { title: "বিজনেস সলিউশন" };
export default function Page() {
  return (
    <>
      <PillarHero pillar="solutions" crumbs={[{ label: "হোম", href: "/" }, { label: "বিজনেস সলিউশন" }]} title="ব্যবসা চালান, বাড়ান — সাশ্রয়ী সফটওয়্যারে" sub="পেট্রা সফটওয়্যার সলিউশনসের তৈরি PetraPOS, PetraPMS ও PetraDMS। সাবস্ক্রিপশন-ভিত্তিক; প্রতিটি বিক্রেতার জন্য বিনামূল্যে Khata Lite।" />
      <div className="container-x space-y-16 py-14">
        {software.map((s, i) => (
          <section key={s.slug} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <div className={i % 2 ? "lg:order-2" : ""}>
              <p className="eyebrow">{s.en.toUpperCase()}</p>
              <h2 className="mt-1.5 font-sans text-3xl font-bold text-navy">{s.name}</h2>
              <p className="mt-1 font-bn text-lg text-teal">{s.audience}</p>
              <p className="mt-3 font-bn text-ink/75">{s.desc}</p>
              <ul className="mt-5 space-y-2 font-bn text-[15px]">{s.features.map((f) => <li key={f} className="flex items-start gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-teal" />{f}</li>)}</ul>
              <div className="mt-6 flex flex-wrap gap-3"><LinkButton href={`/business-solutions/${s.slug}`}>বিস্তারিত দেখুন <ArrowRight className="h-4 w-4" /></LinkButton><LinkButton href={`/business-solutions/${s.slug}#demo`} variant="outline">ডেমো অনুরোধ</LinkButton></div>
            </div>
            <div className={`rounded-md bg-navy p-5 sm:p-8 ${i % 2 ? "lg:order-1" : ""}`}><SoftwareMock kind={s.slug as "petrapos"} /></div>
          </section>
        ))}
        <section className="rounded-md border border-gold/50 bg-gold-50 p-7 sm:p-10">
          <p className="eyebrow !text-gold-700">FREE FOR EVERY SELLER</p>
          <h2 className="mt-1 font-sans text-2xl font-bold">{khataLite.name} <span className="font-bn font-normal text-ink/60">· {khataLite.bn}</span></h2>
          <p className="mt-2 max-w-xl font-bn text-ink/75">{khataLite.desc}। বিক্রেতারা প্ল্যাটফর্মে থাকার একটি দৈনন্দিন কারণ পান; প্রয়োজনে PetraPOS/PMS/DMS-এ উন্নীত হতে পারেন।</p>
          <LinkButton href="/seller/register" variant="gold" className="mt-5">বিক্রেতা হিসেবে যোগ দিন</LinkButton>
        </section>
        <p className="font-bn text-xs text-mist-500">এই পাতার স্ক্রিন চিত্রগুলো দৃষ্টান্তমূলক। মূল্য ও প্যাকেজ শীঘ্রই ঘোষিত হবে। <Link href="/" className="text-teal underline">হোম</Link></p>
      </div>
    </>
  );
}
