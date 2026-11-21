"use client";
import { useState } from "react";
import { ProductCard } from "@/components/Commerce";
import { categories, products } from "@/data/catalog";
import { cn } from "@/lib/utils";

export function PopularTabs() {
  const [a, setA] = useState(categories[0].slug);
  const list = products.filter((p) => p.category === a).slice(0, 4);
  return (
    <div>
      <div role="tablist" className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {categories.map((c) => (
          <button key={c.slug} role="tab" aria-selected={a === c.slug} onClick={() => setA(c.slug)}
            className={cn("shrink-0 rounded-full border px-4 py-1.5 font-bn text-sm transition-colors", a === c.slug ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink")}>{c.bn}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
    </div>
  );
}
