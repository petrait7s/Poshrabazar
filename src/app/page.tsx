import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Scale, Sprout, Store, ShoppingBasket, Truck } from "lucide-react";
import { Hero } from "./_home/Hero";
import { PopularTabs } from "./_home/PopularTabs";
import { AreaSection } from "./_home/AreaSection";
import { ProductCard, CategoryTile, SellerCard } from "@/components/Commerce";
import { SectionHead, DemoBadge } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { Sparkline, Delta } from "@/components/Viz";
import { T } from "@/components/providers";
import { categories, getSeller, products, sellers, summary, taka, bn } from "@/data/catalog";
import { priceRows } from "@/data/prices";


export default function Home() {
  const featured = ["potato", "onion", "himsagar-mango", "miniket-rice", "rui-fish", "mustard-oil", "tomato", "khati-honey"].map((s) => products.find((p) => p.slug === s)!);
  const wholesale = products.filter((p) => ["potato", "onion", "miniket-rice", "masoor-dal", "garlic", "mustard-oil"].includes(p.slug));
  const verified = sellers.filter((s) => s.verified).slice(0, 4);
  return (
    <>
      <Hero />

      <AreaSection />

      <section className="section">
        <div className="container-x">
          <SectionHead eyebrow="CATEGORIES" title={<T bn="ক্যাটাগরি অনুযায়ী কিনুন" en="Shop by category" />} href="/categories" cta="সব দেখুন" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => <CategoryTile key={c.slug} c={c} count={products.filter((p) => p.category === c.slug).length} />)}
          </div>
        </div>
      </section>

      <section className="pb-12 sm:pb-16">
        <div className="container-x">
          <SectionHead eyebrow="FAMOUS · সারা দেশে" title={<T bn="যার যার এলাকার বিখ্যাত পণ্য" en="Famous from every region" />} sub="বগুড়ার দই, নাটোরের কাঁচাগোল্লা, কক্সবাজারের শুটকি, জামদানি, শীতলপাটি — এখন দেশের যেকোনো জায়গায়।" href="/famous" cta="সব বিখ্যাত পণ্য" />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6">
            {products.filter((p) => p.famous).filter((_, i) => i % 2 === 0 || i === 3).slice(0, 6).map((p) => <div key={p.slug} className="w-44 shrink-0 sm:w-auto"><ProductCard p={p} /></div>)}
          </div>
        </div>
      </section>

      <section className="pb-12 sm:pb-16">
        <div className="container-x">
          <SectionHead eyebrow="FEATURED" title={<T bn="আজকের নির্বাচিত পণ্য" en="Featured today" />} sub="প্রতিটি পণ্যে একাধিক বিক্রেতা — সবচেয়ে কম দাম কার্ডেই দেখুন।" href="/marketplace" cta="মার্কেটপ্লেস" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{featured.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink-800 py-14 text-white sm:py-20">
        <div className="container-x relative grid gap-10 lg:grid-cols-[.9fr_1.4fr]">
          <div>
            <p className="eyebrow !text-accent">WHOLESALE · পাইকারি</p>
            <h2 className="mt-2 font-bn text-3xl font-semibold !text-white sm:text-4xl">বড় পরিমাণে কিনুন,<br />সরাসরি উৎস থেকে</h2>
            <p className="mt-4 max-w-md font-bn text-white/75">পাইকার, আড়তদার ও দোকানদারদের জন্য — প্রতিটি অফারে গ্রেড, উৎস ও ন্যূনতম অর্ডার (MOQ) স্পষ্ট।</p>
            <ul className="mt-6 space-y-3 font-bn text-[15px] text-white/85">
              {[[Scale, "খুচরা ও পাইকারি দাম আলাদা"], [Truck, "জেলাভিত্তিক বিক্রেতা, দ্রুত সংগ্রহ"], [BadgeCheck, "সাথী এজেন্ট-যাচাইকৃত বিক্রেতা"]].map(([I, t], i) => { const Icon = I as typeof Scale; return <li key={i} className="flex items-center gap-3"><Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />{t as string}</li>; })}
            </ul>
            <LinkButton href="/wholesale" variant="accent" size="lg" className="mt-8">পাইকারি বাজার দেখুন <ArrowRight className="h-4 w-4" /></LinkButton>
          </div>
          <div className="surface min-w-0 overflow-x-auto rounded-md text-ink">
            <table className="tbl w-full min-w-[560px]">
              <thead><tr><th>পণ্য</th><th>সর্বনিম্ন পাইকারি</th><th>MOQ</th><th>সেরা বিক্রেতা</th><th /></tr></thead>
              <tbody>
                {wholesale.map((p) => { const s = summary(p); const o = [...s.offers].sort((a, b) => a.wholesale - b.wholesale)[0]; return (
                  <tr key={p.slug}>
                    <td><Link href={`/product/${p.slug}`} className="font-bn text-[15px] text-ink hover:text-primary">{p.bn}</Link></td>
                    <td className="font-bold tabular-nums text-primary">{taka(o.wholesale)}<span className="ml-1 font-bn text-xs font-normal text-muted">/{p.unit}</span></td>
                    <td className="font-bn tabular-nums">{bn(p.minWholesale)} {p.unit}+</td>
                    <td className="font-bn">{getSeller(o.sellerSlug)!.bn}</td>
                    <td className="text-right"><Link href={`/product/${p.slug}#sellers`} className="font-bn text-sm text-primary hover:underline">তুলনা</Link></td>
                  </tr>); })}
              </tbody>
            </table>
            <p className="border-t border-tint px-3 py-2 text-[11px] text-muted">Demo values — illustrative only.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHead eyebrow="POPULAR" title={<T bn="ক্যাটাগরিতে জনপ্রিয়" en="Popular by category" />} />
          <PopularTabs />
        </div>
      </section>

      <section className="surface-band py-14 sm:py-16">
        <div className="container-x">
          <SectionHead eyebrow="TRUST" title={<T bn="যাচাইকৃত বিক্রেতা" en="Verified sellers" />} sub="রেটিং শুধু ডেলিভারি-সম্পন্ন অর্ডার থেকে — একটি পণ্য × একজন বিক্রেতা।" href="/search?type=sellers" cta="সব বিক্রেতা" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{verified.map((s) => <SellerCard key={s.slug} slug={s.slug} />)}</div>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="eyebrow">MARKET PRICES</p>
            <h2 className="h-section mt-1.5"><T bn="বিক্রির আগে দাম জানুন" en="Know the price before selling" /></h2>
            <p className="mt-3 max-w-md font-bn text-ink/70">জেলা ও পণ্যভিত্তিক দৈনিক দর, পাইকারি বনাম খুচরা এবং মৌসুমি প্রবণতা — বিনামূল্যে।</p>
            <div className="mt-5 flex flex-wrap items-center gap-3"><LinkButton href="/market-prices" variant="dark">সব বাজারদর</LinkButton></div>
            <p className="mt-4"><DemoBadge /> <span className="font-bn text-xs text-muted">এগুলো প্রদর্শনী মান; বাস্তব বাজারদর নয়।</span></p>
          </div>
          <div className="overflow-hidden surface rounded-md">
            <table className="tbl w-full">
              <thead><tr><th>পণ্য</th><th className="text-right">আজ</th><th className="hidden text-right sm:table-cell">গতকাল</th><th>৭ দিন</th></tr></thead>
              <tbody>
                {priceRows.slice(0, 7).map((r) => (
                  <tr key={r.slug}>
                    <td><Link href={`/market-prices/${r.slug}`} className="font-bn text-[15px] text-ink hover:text-primary">{r.bn}</Link> <span className="text-xs text-muted">/{r.unit}</span></td>
                    <td className="text-right tabular-nums"><b>{taka(r.today)}</b> <Delta now={r.today} prev={r.yesterday} /></td>
                    <td className="hidden text-right tabular-nums text-muted sm:table-cell">{taka(r.yesterday)}</td>
                    <td><Sparkline data={r.trend} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHead eyebrow="JOIN · যোগ দিন" title="আপনি কীভাবে যুক্ত হবেন?" sub="প্রতিটি অ্যাকাউন্টে একাধিক ভূমিকা থাকতে পারে — একজন শিক্ষার্থী ক্রেতাও, উদ্যোক্তাও।" />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [Sprout, "কৃষক ও উৎপাদক", "নিজের ফসল, মাছ বা পণ্য তুলুন; পরিমাণ, দাম ও মৌসুম ঠিক করুন; সরাসরি বা শিক্ষার্থী উদ্যোক্তাদের মাধ্যমে বিক্রি করুন।", "উৎপাদক হিসেবে যোগ দিন"],
              [Store, "শিক্ষার্থী উদ্যোক্তা", "নিজের এলাকার উৎপাদকদের পণ্য নিজের দোকানে তুলুন, নিজের দামে বিক্রি করুন। শুরুতে মূলধন বা গুদাম লাগে না।", "দোকান খুলুন"],
              [ShoppingBasket, "ক্রেতা ও পাইকার", "এলাকা ধরে পণ্য খুঁজুন, দাম ও উৎস তুলনা করুন, খুচরা বা বেশি পরিমাণে কিনুন।", "পণ্য দেখুন"],
            ].map(([I, t, d, c], i) => { const Icon = I as typeof Sprout; return (
              <div key={i} className="surface flex flex-col rounded-md p-6">
                <span className="grid h-11 w-11 place-items-center rounded-md bg-primary-50 text-primary"><Icon className="h-5 w-5" strokeWidth={1.6} /></span>
                <h3 className="mt-4 font-bn text-xl text-ink">{t as string}</h3>
                <p className="mt-2 flex-1 font-bn text-[15px] text-ink/70">{d as string}</p>
                <LinkButton href={i === 2 ? "/marketplace" : "/seller/register"} variant={i === 1 ? "primary" : "outline"} className="mt-5">{c as string}</LinkButton>
              </div>); })}
          </div>
        </div>
      </section>

      <section className="surface-band py-12">
        <div className="container-x grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[[BadgeCheck, "যাচাইকৃত বিক্রেতা", "পরিচয় ও ঠিকানা যাচাই করা বিক্রেতা ও উৎপাদক।"], [MapPin, "এলাকা-ভিত্তিক", "বিভাগ, জেলা ও উপজেলা ধরে খুঁজুন; উৎস সবসময় স্পষ্ট।"], [Scale, "পাশাপাশি তুলনা", "একই পণ্যের সব বিক্রেতার দাম, গ্রেড ও পরিমাণ।"], [Truck, "এলাকাভিত্তিক ডেলিভারি", "নির্ধারিত ডেলিভারি এলাকা ও পিকআপ পয়েন্ট।"]].map(([I, t, d], i) => { const Icon = I as typeof Scale; return (
            <div key={i}><Icon className="h-6 w-6 text-primary" strokeWidth={1.5} /><h3 className="mt-3 font-bn text-lg text-ink">{t as string}</h3><p className="mt-1 font-bn text-sm text-ink/65">{d as string}</p></div>); })}
        </div>
      </section>
    </>
  );
}
