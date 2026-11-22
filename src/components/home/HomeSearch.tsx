"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";

export function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); router.push(`/search?q=${encodeURIComponent(q.trim())}`); }}
      className="flex h-[52px] items-center gap-3 rounded-lg border border-stone-300 bg-surface pl-4 pr-1 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <Search className="h-5 w-5 shrink-0 text-ink" strokeWidth={1.9} aria-hidden />
      <label className="sr-only" htmlFor="home-q">পণ্য খুঁজুন</label>
      <input id="home-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="কমলা, শুটকি, চাল খুঁজুন" className="h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
      <button type="button" aria-label="ফিল্টার" onClick={() => router.push("/categories")} className="grid h-11 w-11 shrink-0 place-items-center border-l border-line text-ink"><SlidersHorizontal className="h-[19px] w-[19px]" strokeWidth={1.8} /></button>
    </form>
  );
}
