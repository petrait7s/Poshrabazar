"use client";
import { ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { useApp } from "@/components/providers";
import { artOf, featuredStore, homeItems, otherStores, priced, takaBn } from "@/data/home";
import { getProduct } from "@/data/catalog";

function useSoon() {
  const { toast } = useApp();
  return () => toast("দোকানের নিজস্ব পাতা শীঘ্রই আসছে (ডেমো)", "info");
}

export function StoresSection() {
  const soon = useSoon();
  const f = featuredStore;
  return (
    <section aria-labelledby="st-h" className="pt-12">
      <div className="container-x pb-5">
        <p className="text-xs font-semibold tracking-[0.04em] text-primary">শিক্ষার্থী উদ্যোক্তা</p>
        <h2 id="st-h" className="text-[22px] leading-snug lg:text-[28px]">নিজের এলাকার দোকান</h2>
        <p className="text-[13.5px] leading-normal text-muted">স্থানীয় উৎপাদকদের পণ্য, নিজের পছন্দে সাজানো দোকানে</p>
      </div>
      <div className="lg:container-x lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <article className="bg-ink px-4 pb-7 pt-8 text-white lg:rounded-xl lg:px-8">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.06em] text-accent"><span aria-hidden className="h-px w-5 bg-accent" />শিক্ষার্থী-চালিত দোকান</p>
          <h3 className="mt-3 text-[32px] leading-tight tracking-[-0.01em] text-white">{f.name}</h3>
          <p className="mt-1 text-[13.5px] text-stone-300">{f.place}</p>
          <p className="mt-3 max-w-[300px] text-[15px] leading-relaxed text-stone-200">{f.intro}</p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {f.items.map((slug) => { const it = homeItems.find((i) => i.slug === slug)!; const pr = priced(it); return (
              <div key={slug}>
                <ProductImage kind={artOf(slug)} className="rounded" sizes="120px" />
                <span className="mt-2 block text-[13.5px] leading-snug">{getProduct(slug)!.bn}</span>
                <span className="block text-[12.5px] leading-snug text-stone-300">{takaBn(pr.retail)}/{pr.unit}</span>
              </div>
            ); })}
          </div>
          <button type="button" onClick={soon} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white text-[15px] font-semibold text-ink hover:bg-cream">দোকানে যান<ArrowRight className="h-4 w-4" strokeWidth={2.2} /></button>
        </article>

        <div className="lg:self-center">
          {otherStores.map((s) => (
            <article key={s.slug} className="container-x border-b border-line py-5 lg:!px-0">
              <div className="flex items-center gap-3">
                <span aria-hidden className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-lg text-[22px]" style={{ background: s.markBg, color: s.markFg }}>{s.mark}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg leading-normal">{s.name}</h3>
                  <p className="text-[13px] leading-normal text-muted">{s.place} · {s.line}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex gap-1.5">{s.items.map((slug) => <div key={slug} className="w-12"><ProductImage kind={artOf(slug)} className="rounded" sizes="48px" /></div>)}</div>
                <button type="button" onClick={soon} className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-primary">দোকানে যান<ArrowRight className="h-4 w-4" strokeWidth={2.2} /></button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
