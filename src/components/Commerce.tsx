"use client";
import Link from "next/link";
import { BadgeCheck, Heart, MapPin, ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductArt } from "./ProductArt";
import { useApp } from "./providers";
import { bn, genitive, getSeller, summary, taka, type Category, type Product } from "@/data/catalog";

export function VerifiedBadge({ small }: { small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-sm bg-primary-50 font-bn font-medium text-primary-800", small ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs")}>
      <BadgeCheck className={small ? "h-3 w-3" : "h-3.5 w-3.5"} /> যাচাইকৃত
    </span>
  );
}

export function Price({ value, unit, size = "md", muted }: { value: number; unit: string; size?: "sm" | "md" | "lg"; muted?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1", muted && "text-ink/60")}>
      <span className={cn("font-bold tabular-nums", size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-base", !muted && "text-ink")}>{taka(value)}</span>
      <span className="font-bn text-xs text-muted">/{unit}</span>
    </span>
  );
}

export function WishButton({ slug, className }: { slug: string; className?: string }) {
  const { wishlist, toggleWish, toast } = useApp();
  const on = wishlist.includes(slug);
  return (
    <button aria-label="Wishlist" aria-pressed={on}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(slug); toast(on ? "পছন্দের তালিকা থেকে সরানো হয়েছে" : "পছন্দের তালিকায় যোগ হয়েছে", on ? "info" : "ok"); }}
      className={cn("grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink shadow-card transition hover:scale-105", className)}>
      <Heart className={cn("h-4 w-4 transition-colors", on && "fill-red-500 text-red-500")} />
    </button>
  );
}

export function ProductCard({ p, className }: { p: Product; className?: string }) {
  const s = summary(p);
  const { addToCart, toast } = useApp();
  const best = s.offers[0];
  return (
    <article className={cn("surface-card group flex flex-col", className)}>
      <Link href={`/product/${p.slug}`} className="relative block aspect-[4/3] overflow-hidden" aria-label={p.bn}>
        <ProductArt motif={p.motif} bg={p.color} accent={p.accent} seed={p.slug} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]" />
        <span className="absolute left-2 top-2 rounded-sm bg-ink/90 px-1.5 py-0.5 font-bn text-[11px] text-white">{bn(s.sellerCount)} জন বিক্রেতা</span>
        {p.famous && <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-sm bg-accent px-1.5 py-0.5 font-bn text-[11px] font-medium text-ink shadow-card"><MapPin className="h-3 w-3" />{genitive(p.famous)} বিখ্যাত</span>}
      </Link>
      <WishButton slug={p.slug} className="absolute right-2 top-2" />
      <div className="flex flex-1 flex-col p-3.5">
        <Link href={`/product/${p.slug}`} className="block">
          <h3 className="font-bn text-[17px] leading-tight text-ink group-hover:text-primary">{p.bn}</h3>
          <p className="text-xs text-muted">{p.en}</p>
        </Link>
        <div className="mt-2.5 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">খুচরা</p>
            <Price value={s.minRetail} unit={p.unit} />
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">পাইকারি</p>
            <Price value={s.minWholesale} unit={p.unit} size="sm" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-tint pt-2.5 text-xs text-ink/70">
          <span className="flex min-w-0 items-center gap-1 font-bn"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{s.top.bn}</span></span>
        </div>
        <button
          onClick={() => { addToCart({ productSlug: p.slug, sellerSlug: best.sellerSlug, mode: "retail", qty: 1 }); toast(`${p.bn} কার্টে যোগ হয়েছে`); }}
          className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-md border border-primary/40 font-bn text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white">
          <ShoppingBasket className="h-4 w-4" /> কার্টে যোগ করুন
        </button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden surface rounded-md">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-2 p-3.5"><div className="skeleton h-4 w-2/3 rounded" /><div className="skeleton h-3 w-1/3 rounded" /><div className="skeleton mt-3 h-6 w-1/2 rounded" /><div className="skeleton h-9 rounded" /></div>
    </div>
  );
}

export function CategoryTile({ c, count }: { c: Category; count?: number }) {
  return (
    <Link href={`/categories/${c.slug}`} style={{ background: `linear-gradient(135deg, ${c.color}d0, #FFFFFF 78%)` }} className="surface-card group flex items-center gap-3 p-2.5">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded">
        <ProductArt motif={c.motif} bg={c.color} accent="#C2410C" seed={c.slug} className="h-full w-full scale-150" />
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-bn text-base text-ink group-hover:text-primary">{c.bn}</h3>
        <p className="truncate text-[11px] text-muted">{c.en}{count !== undefined && ` · ${count}`}</p>
      </div>
    </Link>
  );
}

export function SellerCard({ slug }: { slug: string }) {
  const s = getSeller(slug)!;
  return (
    <Link href={`/stores/${s.slug}`} className="surface-card group flex flex-col p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-ink font-bn text-lg text-white">{s.bn[0]}</div>
        <div className="min-w-0">
          <h3 className="truncate font-bn text-base text-ink group-hover:text-primary">{s.bn}</h3>
          <p className="flex items-center gap-1 font-bn text-xs text-ink/60"><MapPin className="h-3 w-3" />{s.location} · {s.kind}</p>
        </div>
      </div>
    </Link>
  );
}
