import Link from "next/link";
import { CategoryTile, ProductCard } from "@/components/Commerce";
import { bn, getSeller, summary, taka, type Product } from "@/data/catalog";
import { buildHome } from "@/data/homeSections";

function Head({ id, kicker, title, sub, href }: { id: string; kicker?: string; title: string; sub?: string; href?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {kicker && <p className="text-xs font-semibold tracking-[0.04em] text-primary">{kicker}</p>}
        <h2 id={id} className="text-[22px] leading-snug lg:text-[28px]">{title}</h2>
        {sub && <p className="text-[13.5px] leading-normal text-muted">{sub}</p>}
      </div>
      {href && <Link href={href} className="inline-flex min-h-11 items-center whitespace-nowrap text-sm font-semibold text-primary">সব দেখুন</Link>}
    </div>
  );
}
const Rail = ({ items }: { items: Product[] }) => (
  <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible xl:grid-cols-5">
    {items.map((p) => <div key={p.slug} className="w-44 shrink-0 snap-start lg:w-auto"><ProductCard p={p} /></div>)}
  </div>
);

export function HomeSections() {
  const h = buildHome();
  return (
    <>
      {/* 2. category navigation */}
      <nav aria-label="ক্যাটাগরি" className="mt-8 border-y border-line">
        <div className="container-x no-scrollbar flex overflow-x-auto">
          {h.counts.map(({ c }) => <Link key={c.slug} href={`/categories/${c.slug}`} className="flex h-[52px] shrink-0 items-center px-3 text-[14.5px] text-ink hover:text-primary">{c.bn}</Link>)}
        </div>
      </nav>

      {/* 3. seasonal campaign (hidden until an admin sets one) */}
      {h.camp && h.camp.items.length > 0 && (
        <section aria-labelledby="camp-h" className="container-x pt-10"><Head id="camp-h" kicker="মৌসুমি আয়োজন" title={h.camp.title} sub={h.camp.blurb} /><Rail items={h.camp.items} /></section>
      )}

      {/* 4. shop by category: categories only, no products */}
      <section aria-labelledby="cat-h" className="container-x pt-10">
        <Head id="cat-h" title="ক্যাটাগরি অনুযায়ী কিনুন" href="/categories" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{h.counts.map(({ c, n }) => <CategoryTile key={c.slug} c={c} count={n} />)}</div>
      </section>

      {/* 5. featured stores */}
      {h.featured.length > 0 && (
        <section aria-labelledby="st-h" className="container-x pt-12">
          <Head id="st-h" kicker="নমুনা দোকান (ডেমো)" title="দোকান ঘুরে দেখুন" href="/stores" />
          <div className="grid gap-4 lg:grid-cols-3">
            {h.featured.map(({ s, items }) => (
              <article key={s.slug} className="surface rounded-md p-4">
                <Link href={`/stores/${s.slug}`} className="flex items-center gap-3">
                  <span aria-hidden className="grid h-12 w-12 place-items-center rounded bg-ink font-bn text-lg text-white">{s.bn[0]}</span>
                  <span><b className="block font-bn text-base">{s.bn}</b><span className="font-bn text-xs text-muted">{s.location} · {s.kind}</span></span>
                </Link>
                <ul className="mt-3 divide-y divide-line border-t border-line">
                  {items.map((p) => <li key={p.slug}><Link href={`/product/${p.slug}`} className="flex min-h-11 items-center justify-between font-bn text-sm"><span>{p.bn}</span><span className="tabular-nums text-muted">{taka(summary(p).minRetail)}/{p.unit}</span></Link></li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 6. produced in Sylhet */}
      {h.sylhet.length > 0 && (
        <section aria-labelledby="syl-h" className="container-x pt-12">
          <Head id="syl-h" kicker="স্থানীয়" title="সিলেটে উৎপাদিত" sub="সিলেট বিভাগের মাঠ, বাগান ও হাওর থেকে" />
          <div className="space-y-6">{h.sylhet.map(({ c, items }) => <div key={c.slug}><h3 className="mb-2 text-base">{c.bn}</h3><Rail items={items} /></div>)}</div>
        </section>
      )}

      {/* 7. other districts */}
      {h.fromOthers.length > 0 && (
        <section aria-labelledby="oth-h" className="container-x pt-12">
          <Head id="oth-h" kicker="সারা দেশ থেকে" title="অন্য জেলার নামকরা পণ্য" sub="উৎস জেলা প্রতিটি পণ্যে লেখা" />
          <div className="space-y-6">{h.fromOthers.map((g) => <div key={g.district}><h3 className="mb-2 text-base">{g.district} থেকে</h3><Rail items={g.items} /></div>)}</div>
        </section>
      )}

      {/* 8 (fresh today) and 10 (recently added) need real harvest dates and listing dates: hidden until real listings exist */}

      {/* 9. wholesale */}
      {h.wholesale.length > 0 && (
        <section aria-labelledby="wh-h" className="mt-12 border-y border-line bg-surface py-10">
          <div className="container-x">
            <Head id="wh-h" kicker="খুচরা ও পাইকারি" title="বেশি নিলে, কম দাম" sub="ন্যূনতম পরিমাণ পূরণ করলে পাইকারি দাম" />
            <ul className="divide-y divide-line">
              {h.wholesale.map((p) => { const s = summary(p); return (
                <li key={p.slug}><Link href={`/product/${p.slug}`} className="grid min-h-12 grid-cols-[1fr_auto] items-center gap-x-4 py-2 font-bn text-[15px]">
                  <span>{p.bn}<span className="block text-xs text-muted">{getSeller(s.offers[0].sellerSlug)?.bn}</span></span>
                  <span className="text-right tabular-nums"><b>{taka(s.minWholesale)}/{p.unit}</b><span className="block text-xs text-primary-700">{bn(p.minWholesale)} {p.unit}+</span></span>
                </Link></li>
              ); })}
            </ul>
          </div>
        </section>
      )}

      <p className="container-x py-6 text-xs leading-relaxed text-muted">এই পাতার দাম, দোকান ও উৎস নমুনা (ডেমো)। আসল দোকান ও পণ্য অনুমোদনের পর এখানে আসবে।</p>
    </>
  );
}
