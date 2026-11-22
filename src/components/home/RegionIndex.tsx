"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { useApp } from "@/components/providers";
import { homeItems, regionDefs } from "@/data/home";
import { bn } from "@/data/catalog";
import { cn } from "@/lib/utils";

export function RegionIndex() {
  const [open, setOpen] = useState("জৈন্তাপুর");
  const { setArea } = useApp();
  const router = useRouter();
  return (
    <ol className="border-t border-ink">
      {regionDefs.map((r, i) => {
        const items = homeItems.filter((p) => p.upazila === r.bn);
        const on = open === r.bn;
        return (
          <li key={r.bn} className="border-b border-line">
            <button type="button" aria-expanded={on} onClick={() => setOpen(on ? "" : r.bn)} className="flex min-h-16 w-full items-center gap-4 py-2 text-left">
              <span className={cn("w-6 shrink-0 text-xs font-semibold tracking-[0.06em]", on ? "text-primary" : "text-muted")}>{bn("0" + (i + 1))}</span>
              <span className="flex min-w-0 flex-1 flex-col"><span className="text-xl leading-normal">{r.bn}</span><span className="text-[10.5px] leading-snug tracking-[0.12em] text-muted">{r.latin}</span></span>
              <span className="whitespace-nowrap text-[13px] text-muted">{items.length ? `${bn(items.length)}টি পণ্য` : "শীঘ্রই"}</span>
              <ChevronDown className={cn("h-[18px] w-[18px] shrink-0 text-muted transition-transform duration-200", on && "rotate-180")} strokeWidth={2} aria-hidden />
            </button>
            {on && (
              <div className="pb-5 pl-10">
                {items.length ? (
                  <>
                    <div className="flex gap-3">
                      {items.map((it) => (
                        <Link key={it.slug} href={`/product/${it.slug}`} className="w-[72px] shrink-0">
                          <ProductImage kind={it.art} className="rounded" sizes="72px" />
                          <span className="mt-1.5 block text-[12.5px] leading-snug">{it.title}</span>
                        </Link>
                      ))}
                    </div>
                    <button type="button" onClick={() => { setArea({ division: "সিলেট", district: "সিলেট", upazila: r.bn }); router.push("/marketplace"); }} className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary">{r.bn}-এর সব পণ্য<ArrowRight className="h-4 w-4" strokeWidth={2.2} /></button>
                  </>
                ) : <p className="text-sm leading-relaxed text-muted">এই উপজেলার উৎপাদকেরা শীঘ্রই যুক্ত হচ্ছেন।</p>}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
