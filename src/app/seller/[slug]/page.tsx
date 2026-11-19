import { notFound } from "next/navigation";
import { MapPin, CalendarDays, ShoppingBag, MessageCircle } from "lucide-react";
import { ProductCard, VerifiedBadge } from "@/components/Commerce";
import { Breadcrumb, Stars } from "@/components/ui/misc";
import { getSeller, products, sellers, offersFor, bn } from "@/data/catalog";

export const generateStaticParams = () => sellers.filter((s) => s.slug !== "register").map((s) => ({ slug: s.slug }));

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const s = getSeller((await params).slug);
  if (!s) notFound();
  const list = products.filter((p) => offersFor(p).some((o) => o.sellerSlug === s.slug));
  return (
    <>
      <section className="border-b border-mist-300 bg-white">
        <div className="container-x py-8">
          <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: "বিক্রেতা" }, { label: s.bn }]} />
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-md bg-navy font-bn text-4xl text-white">{s.bn[0]}</div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3"><h1 className="font-bn text-3xl font-normal">{s.bn}</h1>{s.verified ? <VerifiedBadge /> : <span className="rounded-sm bg-gold-50 px-2 py-1 font-bn text-xs text-gold-700">যাচাই চলমান</span>}</div>
              <p className="mt-1 font-bn text-ink/70">{s.desc}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-bn text-sm text-ink/70">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{s.location}, {s.division}</span>
                <span className="flex items-center gap-1"><ShoppingBag className="h-4 w-4" />{bn(s.orders)}+ অর্ডার</span>
                <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />{bn(s.since)} থেকে</span>
                <span>{s.kind}</span><Stars value={s.rating} />
              </div>
            </div>
            <button className="inline-flex h-11 items-center gap-2 rounded-md border border-navy/25 px-5 font-bn text-sm text-navy hover:bg-mist"><MessageCircle className="h-4 w-4" />মেসেজ (শীঘ্রই)</button>
          </div>
        </div>
      </section>
      <div className="container-x py-10">
        <h2 className="h-section mb-5">এই বিক্রেতার পণ্য <span className="text-base text-mist-500">({bn(list.length)})</span></h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
      </div>
    </>
  );
}
