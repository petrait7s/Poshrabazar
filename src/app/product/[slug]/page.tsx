import { notFound } from "next/navigation";
import { ProductDetail } from "./ProductDetail";
import { ProductCard } from "@/components/Commerce";
import { Breadcrumb, SectionHead } from "@/components/ui/misc";
import { getCategory, getProduct, products } from "@/data/catalog";

export const generateStaticParams = () => products.map((p) => ({ slug: p.slug }));
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const p = getProduct((await params).slug); return { title: p ? `${p.bn} · ${p.en}` : "Product" }; }

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  const c = getCategory(p.category)!;
  const related = products.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 4);
  const more = related.length < 4 ? [...related, ...products.filter((x) => x.category !== p.category).slice(0, 4 - related.length)] : related;
  return (
    <div className="container-x py-6 sm:py-8">
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: c.bn, href: `/category/${c.slug}` }, { label: p.bn }]} />
      <div className="mt-5"><ProductDetail p={p} /></div>
      <section className="mt-16"><SectionHead title="আরও পণ্য" /><div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{more.map((x) => <ProductCard key={x.slug} p={x} />)}</div></section>
    </div>
  );
}
