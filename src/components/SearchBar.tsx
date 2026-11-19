"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight, X } from "lucide-react";
import { categories, products } from "@/data/catalog";
import { cn } from "@/lib/utils";

export function SearchBar({ className, size = "md", defaultValue = "", placeholder = "পণ্য, বিক্রেতা বা ক্যাটাগরি খুঁজুন… Search in Bangla or English" }: { className?: string; size?: "md" | "lg"; defaultValue?: string; placeholder?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return products.filter((p) => p.bn.includes(t) || p.en.toLowerCase().includes(t)).slice(0, 5);
  }, [q]);
  const submit = (e?: React.FormEvent) => { e?.preventDefault(); setOpen(false); router.push(`/search?q=${encodeURIComponent(q.trim())}${cat ? `&cat=${cat}` : ""}`); };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <form onSubmit={submit} role="search" className={cn("flex overflow-hidden rounded-md border-2 border-navy/80 bg-white focus-within:border-teal", size === "lg" ? "h-14" : "h-11")}>
        <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} className="hidden w-32 shrink-0 border-r border-mist-300 bg-mist/60 px-2 font-bn text-sm text-navy focus:outline-none md:block">
          <option value="">সব ক্যাটাগরি</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.bn}</option>)}
        </select>
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-3.5 text-[15px] placeholder:text-mist-500 focus:outline-none" aria-label="Search" />
        {q && <button type="button" aria-label="Clear" onClick={() => setQ("")} className="px-2 text-mist-500 hover:text-navy"><X className="h-4 w-4" /></button>}
        <button type="submit" className="flex items-center gap-2 bg-navy px-4 font-bn text-sm font-medium text-white transition-colors hover:bg-teal sm:px-6"><Search className="h-4 w-4" /><span className="hidden sm:inline">খুঁজুন</span></button>
      </form>
      {open && q.trim() && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden glass rounded-md shadow-lift">
          {hits.length ? hits.map((p) => (
            <button key={p.slug} onClick={() => { setOpen(false); router.push(`/product/${p.slug}`); }} className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-paper">
              <span className="font-bn text-[15px] text-navy">{p.bn} <span className="text-xs text-mist-500">{p.en}</span></span><ArrowUpRight className="h-4 w-4 text-mist-500" />
            </button>
          )) : <p className="px-4 py-3 font-bn text-sm text-mist-500">কোনো মিল পাওয়া যায়নি — Enter চাপুন</p>}
          <button onClick={() => submit()} className="flex w-full items-center gap-2 border-t border-mist bg-paper px-4 py-2.5 text-left font-bn text-sm text-teal"><Search className="h-4 w-4" />“{q}” — সব ফলাফল দেখুন</button>
        </div>
      )}
    </div>
  );
}
