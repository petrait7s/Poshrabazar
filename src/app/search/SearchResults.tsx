"use client";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { ProductExplorer } from "@/components/ProductExplorer";
import { SellerCard } from "@/components/Commerce";
import { sellers } from "@/data/catalog";

export function SearchResults() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const cat = sp.get("cat") ?? undefined;
  const matched = q ? sellers.filter((s) => s.bn.includes(q) || s.en.toLowerCase().includes(q.toLowerCase()) || s.location.includes(q)) : sp.get("type") === "sellers" ? sellers : [];
  return (
    <div className="container-x py-8">
      <h1 className="font-bn text-2xl text-ink sm:text-3xl">{q ? <>“{q}” এর ফলাফল</> : "অনুসন্ধান"}</h1>
      <SearchBar className="mt-4 max-w-2xl" defaultValue={q} />
      {matched.length > 0 && (
        <section className="mt-8"><h2 className="mb-3 font-bn text-lg">বিক্রেতা</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{matched.map((s) => <SellerCard key={s.slug} slug={s.slug} />)}</div></section>
      )}
      <section className="mt-8">{matched.length > 0 && <h2 className="mb-3 font-bn text-lg">পণ্য</h2>}<ProductExplorer key={q + (cat ?? "")} query={q} category={cat} /></section>
    </div>
  );
}
