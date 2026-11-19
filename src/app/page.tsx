import Link from "next/link";
import { ArrowRight, BadgeCheck, Handshake, Scale, Smartphone, Wallet, Sprout, BookOpen, LineChart, Boxes, Truck } from "lucide-react";
import { Hero } from "./_home/Hero";
import { PopularTabs } from "./_home/PopularTabs";
import { AreaSection } from "./_home/AreaSection";
import { ProductCard, CategoryTile, SellerCard } from "@/components/Commerce";
import { SectionHead, DemoBadge } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { ArticleCard } from "@/components/ArticleCard";
import { SoftwareMock, Sparkline, Delta } from "@/components/Viz";
import { T } from "@/components/providers";
import { categories, getSeller, products, sellers, summary, taka, bn } from "@/data/catalog";
import { priceRows } from "@/data/prices";
import { articles } from "@/data/knowledge";
import { software } from "@/data/software";

const tints = ["bg-teal/12 text-teal", "bg-gold/20 text-gold-700", "bg-navy/10 text-navy", "bg-[#B9442F]/12 text-[#B9442F]"];
const pillars = [
  { n: "01", tag: "Buy & Sell", bn: "মার্কেটপ্লেস", en: "Marketplace", d: "এক পণ্য, বহু বিক্রেতা — পাশাপাশি তুলনা করুন।", href: "/marketplace", icon: Handshake },
  { n: "02", tag: "Learn", bn: "নলেজ হাব", en: "Knowledge Hub", d: "কৃষি, প্রাণিসম্পদ, মৎস্য ও ব্যবসার বাংলা গাইড।", href: "/knowledge", icon: BookOpen },
  { n: "03", tag: "Understand", bn: "মার্কেট ইন্টেলিজেন্স", en: "Market Intelligence", d: "বিক্রির আগে জানুন আজকের দাম ও প্রবণতা।", href: "/market-intelligence", icon: LineChart },
  { n: "04", tag: "Grow", bn: "বিজনেস সলিউশন", en: "Business Solutions", d: "PetraPOS, PetraPMS, PetraDMS ও বিনামূল্যে Khata Lite।", href: "/business-solutions", icon: Boxes },
];

export default function Home() {
  const featured = ["potato", "onion", "himsagar-mango", "miniket-rice", "rui-fish", "mustard-oil", "tomato", "khati-honey"].map((s) => products.find((p) => p.slug === s)!);
  const wholesale = products.filter((p) => ["potato", "onion", "miniket-rice", "masoor-dal", "garlic", "mustard-oil"].includes(p.slug));
  const verified = sellers.filter((s) => s.verified).slice(0, 4);
  return (
    <>
      <Hero />

      <section className="glass-band">
        <div className="container-x grid divide-mist-300 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          {pillars.map((p, i) => (
            <Link key={p.n} href={p.href} className="group relative flex gap-4 p-5 transition-colors hover:bg-white/60 sm:p-6">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${tints[i]}`}><p.icon className="h-5 w-5" strokeWidth={1.6} /></span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-700">{p.n} · {p.tag}</p>
                <h3 className="mt-1 font-bn text-lg text-navy group-hover:text-teal"><T bn={p.bn} en={p.en} /></h3>
                <p className="mt-1 font-bn text-[13px] leading-snug text-ink/65">{p.d}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

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
          <SectionHead eyebrow="FEATURED" title={<T bn="আজকের নির্বাচিত পণ্য" en="Featured today" />} sub="প্রতিটি পণ্যে একাধিক বিক্রেতা — সবচেয়ে কম দাম কার্ডেই দেখুন।" href="/marketplace" cta="মার্কেটপ্লেস" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{featured.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-800 to-[#0f4a49] py-14 text-white sm:py-20">
        <div className="container-x relative grid gap-10 lg:grid-cols-[.9fr_1.4fr]">
          <div>
            <p className="eyebrow !text-gold">WHOLESALE · পাইকারি</p>
            <h2 className="mt-2 font-bn text-3xl font-normal !text-white sm:text-4xl">বড় পরিমাণে কিনুন,<br />সরাসরি উৎস থেকে</h2>
            <p className="mt-4 max-w-md font-bn text-white/75">পাইকার, আড়তদার ও দোকানদারদের জন্য — প্রতিটি অফারে গ্রেড, উৎস ও ন্যূনতম অর্ডার (MOQ) স্পষ্ট।</p>
            <ul className="mt-6 space-y-3 font-bn text-[15px] text-white/85">
              {[[Scale, "খুচরা ও পাইকারি দাম আলাদা"], [Truck, "জেলাভিত্তিক বিক্রেতা, দ্রুত সংগ্রহ"], [BadgeCheck, "সাথী এজেন্ট-যাচাইকৃত বিক্রেতা"]].map(([I, t], i) => { const Icon = I as typeof Scale; return <li key={i} className="flex items-center gap-3"><Icon className="h-5 w-5 text-gold" strokeWidth={1.5} />{t as string}</li>; })}
            </ul>
            <LinkButton href="/wholesale" variant="gold" size="lg" className="mt-8">পাইকারি বাজার দেখুন <ArrowRight className="h-4 w-4" /></LinkButton>
          </div>
          <div className="glass min-w-0 overflow-x-auto rounded-md text-ink">
            <table className="tbl w-full min-w-[560px]">
              <thead><tr><th>পণ্য</th><th>সর্বনিম্ন পাইকারি</th><th>MOQ</th><th>সেরা বিক্রেতা</th><th /></tr></thead>
              <tbody>
                {wholesale.map((p) => { const s = summary(p); const o = [...s.offers].sort((a, b) => a.wholesale - b.wholesale)[0]; return (
                  <tr key={p.slug}>
                    <td><Link href={`/product/${p.slug}`} className="font-bn text-[15px] text-navy hover:text-teal">{p.bn}</Link></td>
                    <td className="font-bold tabular-nums text-teal">{taka(o.wholesale)}<span className="ml-1 font-bn text-xs font-normal text-mist-500">/{p.unit}</span></td>
                    <td className="font-bn tabular-nums">{bn(p.minWholesale)} {p.unit}+</td>
                    <td className="font-bn">{getSeller(o.sellerSlug)!.bn}</td>
                    <td className="text-right"><Link href={`/product/${p.slug}#sellers`} className="font-bn text-sm text-teal hover:underline">তুলনা</Link></td>
                  </tr>); })}
              </tbody>
            </table>
            <p className="border-t border-mist px-3 py-2 text-[11px] text-mist-500">Demo values — illustrative only.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHead eyebrow="POPULAR" title={<T bn="ক্যাটাগরিতে জনপ্রিয়" en="Popular by category" />} />
          <PopularTabs />
        </div>
      </section>

      <section className="glass-band py-14 sm:py-16">
        <div className="container-x">
          <SectionHead eyebrow="TRUST" title={<T bn="যাচাইকৃত বিক্রেতা" en="Verified sellers" />} sub="রেটিং শুধু ডেলিভারি-সম্পন্ন অর্ডার থেকে — একটি পণ্য × একজন বিক্রেতা।" href="/search?type=sellers" cta="সব বিক্রেতা" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{verified.map((s) => <SellerCard key={s.slug} slug={s.slug} />)}</div>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="eyebrow">03 · UNDERSTAND</p>
            <h2 className="h-section mt-1.5"><T bn="বিক্রির আগে দাম জানুন" en="Know the price before selling" /></h2>
            <p className="mt-3 max-w-md font-bn text-ink/70">জেলা ও পণ্যভিত্তিক দৈনিক দর, পাইকারি বনাম খুচরা এবং মৌসুমি প্রবণতা — বিনামূল্যে।</p>
            <div className="mt-5 flex flex-wrap items-center gap-3"><LinkButton href="/market-prices" variant="navy">সব বাজারদর</LinkButton><LinkButton href="/market-intelligence" variant="outline">ক্যালকুলেটর ও অ্যালার্ট</LinkButton></div>
            <p className="mt-4"><DemoBadge /> <span className="font-bn text-xs text-mist-500">এগুলো প্রদর্শনী মান; বাস্তব বাজারদর নয়।</span></p>
          </div>
          <div className="overflow-hidden glass rounded-md">
            <table className="tbl w-full">
              <thead><tr><th>পণ্য</th><th className="text-right">আজ</th><th className="hidden text-right sm:table-cell">গতকাল</th><th>৭ দিন</th></tr></thead>
              <tbody>
                {priceRows.slice(0, 7).map((r) => (
                  <tr key={r.slug}>
                    <td><Link href={`/market-prices/${r.slug}`} className="font-bn text-[15px] text-navy hover:text-teal">{r.bn}</Link> <span className="text-xs text-mist-500">/{r.unit}</span></td>
                    <td className="text-right tabular-nums"><b>{taka(r.today)}</b> <Delta now={r.today} prev={r.yesterday} /></td>
                    <td className="hidden text-right tabular-nums text-mist-500 sm:table-cell">{taka(r.yesterday)}</td>
                    <td><Sparkline data={r.trend} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="glass-band py-14 sm:py-16">
        <div className="container-x">
          <SectionHead eyebrow="02 · LEARN" title={<T bn="নলেজ হাব" en="Knowledge Hub" />} sub="কৃষি, প্রাণিসম্পদ, মৎস্য ও ক্ষুদ্র ব্যবসার ব্যবহারিক জ্ঞান — বাংলায়।" href="/knowledge" cta="সব লেখা" />
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <ArticleCard a={articles[0]} featured />
            <div className="grid content-start gap-6">{articles.slice(1, 4).map((a) => <ArticleCard key={a.slug} a={a} row />)}</div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-b from-navy-800 to-navy-900 py-14 text-white sm:py-20">
        <div className="container-x relative">
          <p className="eyebrow !text-gold">04 · GROW · PETRA BUSINESS SOLUTIONS</p>
          <h2 className="mt-2 max-w-2xl font-bn text-3xl font-normal !text-white sm:text-4xl">ব্যবসা চালানোর সফটওয়্যার, সাশ্রয়ী দামে</h2>
          <p className="mt-3 max-w-xl font-bn text-white/70">পেট্রা সফটওয়্যার সলিউশনসের তৈরি। প্রতিটি বিক্রেতার জন্য বিনামূল্যে Khata Lite।</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {software.map((s) => (
              <div key={s.slug} className="flex flex-col">
                <SoftwareMock kind={s.slug as "petrapos"} />
                <h3 className="mt-5 font-sans text-xl font-bold !text-white">{s.name}</h3>
                <p className="font-bn text-sm text-gold">{s.audience}</p>
                <p className="mt-2 font-bn text-sm text-white/70">{s.desc}</p>
                <Link href={`/business-solutions/${s.slug}`} className="mt-3 inline-flex items-center gap-1 font-bn text-sm text-white hover:text-gold">বিস্তারিত ও ডেমো <ArrowRight className="h-4 w-4" /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid overflow-hidden glass rounded-md lg:grid-cols-2">
          <div className="p-7 sm:p-10">
            <p className="eyebrow">SELLER · বিক্রেতা</p>
            <h2 className="h-section mt-1.5">আপনার পণ্য হাজারো ক্রেতার সামনে</h2>
            <ul className="mt-5 space-y-3 font-bn text-[15px]">
              {[[Sprout, "কৃষক, খামারি, পাইকার, আড়তদার ও দোকানদার — সবার জন্য"], [BadgeCheck, "সাথী এজেন্টের মাধ্যমে যাচাই ও অনবোর্ডিং"], [Wallet, "খুচরায় ২–৫%, পাইকারিতে ১–২% কমিশন"], [Smartphone, "বিনামূল্যে Khata Lite — হিসাব রাখুন ফোনেই"]].map(([I, t], i) => { const Icon = I as typeof Sprout; return <li key={i} className="flex items-start gap-3"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal" strokeWidth={1.5} />{t as string}</li>; })}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3"><LinkButton href="/seller/register" size="lg">বিক্রেতা হিসেবে যোগ দিন</LinkButton><LinkButton href="/seller/dashboard" variant="outline" size="lg">ড্যাশবোর্ড দেখুন</LinkButton></div>
          </div>
          <div className="relative min-h-[240px] bg-teal-50">
            <div className="absolute inset-0 grid grid-cols-3 gap-2 p-6 opacity-95">
              {sellers.slice(0, 6).map((s) => <div key={s.slug} className="flex flex-col justify-end rounded-md bg-white p-3 shadow-card"><span className="grid h-8 w-8 place-items-center rounded bg-navy font-bn text-white">{s.bn[0]}</span><p className="mt-2 truncate font-bn text-xs text-navy">{s.bn}</p><p className="font-bn text-[10px] text-mist-500">{s.location}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-band py-12">
        <div className="container-x grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[[BadgeCheck, "ট্রাস্ট, শুধু দাম নয়", "রেটিং আসে শুধু ডেলিভারি-সম্পন্ন অর্ডার থেকে।"], [Scale, "পাশাপাশি তুলনা", "একই পণ্যের সব বিক্রেতা, গ্রেড ও উৎসসহ।"], [Wallet, "সহজ পেমেন্ট", "COD, bKash ও Nagad — লাইসেন্সপ্রাপ্ত গেটওয়ে (পরিকল্পিত)।"], [Smartphone, "বাংলা-প্রথম, মোবাইল-প্রথম", "কম দামি অ্যান্ড্রয়েডেও দ্রুত চলে।"]].map(([I, t, d], i) => { const Icon = I as typeof Scale; return (
            <div key={i}><Icon className="h-6 w-6 text-teal" strokeWidth={1.5} /><h3 className="mt-3 font-bn text-lg text-navy">{t as string}</h3><p className="mt-1 font-bn text-sm text-ink/65">{d as string}</p></div>); })}
        </div>
      </section>
    </>
  );
}
