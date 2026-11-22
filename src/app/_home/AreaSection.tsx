"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, ShoppingBasket, Store } from "lucide-react";
import { divisions, areaLabel, type Area } from "@/data/locations";
import { sellers } from "@/data/catalog";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AreaSection() {
  const { setArea, area } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [div, setDiv] = useState(divisions[0].bn);
  const [dist, setDist] = useState("");
  const d = divisions.find((x) => x.bn === div)!;
  const picked: Area = { division: div, district: dist };
  const go = () => { setArea(picked); router.push(mode === "buy" ? "/marketplace" : "/become-a-seller"); };

  return (
    <section className="surface-band py-14 sm:py-16">
      <div className="container-x">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">LOCAL · এলাকাভিত্তিক</p>
            <h2 className="h-section mt-1.5">কোথায় কিনবেন, কোথায় বিক্রি করবেন</h2>
            <p className="mt-1.5 max-w-xl font-bn text-[15px] text-ink/70">প্রথমে বিভাগ, তারপর জেলা বাছুন — নিজের এলাকার বিক্রেতা ও ক্রেতার সঙ্গে সহজে যুক্ত হোন।</p>
          </div>
          <div role="tablist" className="inline-flex overflow-hidden rounded-md border border-ink/25">
            {([["buy", "এলাকায় কিনুন", ShoppingBasket], ["sell", "এলাকায় বিক্রি করুন", Store]] as const).map(([k, l, I]) => (
              <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={cn("flex items-center gap-2 px-4 py-2.5 font-bn text-sm", mode === k ? "bg-ink text-white" : "text-ink hover:bg-tint")}><I className="h-4 w-4" />{l}</button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="mb-2 font-bn text-sm font-semibold text-ink">১. বিভাগ</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {divisions.map((x) => {
                const n = sellers.filter((s) => s.division === x.bn).length;
                return (
                  <button key={x.bn} onClick={() => { setDiv(x.bn); setDist(""); }} aria-pressed={div === x.bn} className={cn("rounded-md border p-3 text-left transition-colors", div === x.bn ? "border-primary bg-primary-50" : "border-line hover:border-ink")}>
                    <span className="block font-bn text-[16px] text-ink">{x.bn}</span>
                    <span className="block text-[11px] text-muted">{x.districts.length} জেলা</span>
                    <span className="mt-1 block font-bn text-[11px] text-primary">{n ? `${n}টি বিক্রেতা (ডেমো)` : "শীঘ্রই"}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 font-bn text-sm font-semibold text-ink">২. জেলা — {d.bn} বিভাগ</p>
            <div className="flex max-h-[188px] flex-wrap gap-2 overflow-y-auto rounded-md border border-line bg-cream p-3">
              <button onClick={() => setDist("")} aria-pressed={!dist} className={cn("rounded-full border px-3.5 py-1.5 font-bn text-sm", !dist ? "border-ink bg-ink text-white" : "border-line bg-white")}>পুরো বিভাগ</button>
              {d.districts.map((x) => <button key={x} onClick={() => setDist(x)} aria-pressed={dist === x} className={cn("rounded-full border px-3.5 py-1.5 font-bn text-sm", dist === x ? "border-primary bg-primary text-white" : "border-line bg-white text-ink hover:border-ink")}>{x}</button>)}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={go}><MapPin className="h-4 w-4" />{areaLabel(picked)} — {mode === "buy" ? "পণ্য দেখুন" : "বিক্রেতা নিবন্ধন"}<ArrowRight className="h-4 w-4" /></Button>
              {area.division && <span className="font-bn text-xs text-muted">বর্তমান: {areaLabel(area)}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
