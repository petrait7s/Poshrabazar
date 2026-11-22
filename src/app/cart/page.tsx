"use client";
import Link from "next/link";
import { Trash2, ShieldAlert } from "lucide-react";
import { ProductArt } from "@/components/ProductArt";
import { QtyStepper } from "@/components/QtyStepper";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { useApp } from "@/components/providers";
import { resolve, totals } from "@/components/cartUtil";
import { taka } from "@/data/catalog";

export default function CartPage() {
  const { cart, setQty, removeLine, hydrated, toast } = useApp();
  const t = totals(cart);
  return (
    <div className="container-x py-8">
      <h1 className="font-bn text-3xl font-semibold">কার্ট</h1>
      {!hydrated ? <Skeleton className="mt-6 h-40" /> : cart.length === 0 ? (
        <div className="mt-6"><EmptyState title="আপনার কার্ট খালি" text="মার্কেটপ্লেস থেকে পণ্য যোগ করুন।" action={<LinkButton href="/marketplace">মার্কেটপ্লেসে যান</LinkButton>} /></div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-line surface rounded-md">
            {cart.map((l, i) => { const r = resolve(l); return (
              <li key={`${l.productSlug}-${l.sellerSlug}-${l.mode}`} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                <Link href={`/product/${r.p.slug}`} className="h-20 w-24 shrink-0 overflow-hidden rounded sm:h-24 sm:w-28"><ProductArt motif={r.p.motif} bg={r.p.color} accent={r.p.accent} seed={r.p.slug} className="h-full w-full" /></Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0"><Link href={`/product/${r.p.slug}`} className="font-bn text-lg text-ink hover:text-primary">{r.p.bn}</Link><p className="truncate font-bn text-xs text-ink/60">{r.s.bn} · {r.s.location} · {l.mode === "retail" ? "খুচরা" : "পাইকারি"}</p></div>
                    <button aria-label="Remove" onClick={() => { removeLine(i); toast("কার্ট থেকে সরানো হয়েছে", "info"); }} className="h-8 w-8 shrink-0 text-muted hover:text-red-600"><Trash2 className="mx-auto h-4 w-4" /></button>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <QtyStepper compact value={l.qty} onChange={(n) => setQty(i, n)} />
                    <div className="text-right"><p className="text-xs text-muted">{taka(r.price)}/{r.p.unit}</p><p className="text-lg font-bold tabular-nums text-ink">{taka(r.total)}</p></div>
                  </div>
                </div>
              </li>); })}
          </ul>
          <aside className="h-fit surface rounded-md p-5 lg:sticky lg:top-32">
            <h2 className="font-bn text-xl">অর্ডার সারসংক্ষেপ</h2>
            <dl className="mt-4 space-y-2 font-bn text-[15px]">
              <div className="flex justify-between"><dt className="text-ink/70">সাবটোটাল</dt><dd className="tabular-nums">{taka(t.sub)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/70">ডেলিভারি (আনুমানিক)</dt><dd className="tabular-nums">{taka(t.delivery)}</dd></div>
              <div className="flex justify-between border-t border-tint pt-3 text-lg font-bold text-ink"><dt>মোট</dt><dd className="tabular-nums">{taka(t.total)}</dd></div>
            </dl>
            <LinkButton href="/checkout" size="lg" className="mt-5 w-full">চেকআউটে যান</LinkButton>
            <p className="mt-3 flex gap-2 font-bn text-xs text-muted"><ShieldAlert className="h-4 w-4 shrink-0 text-accent-700" />প্রিভিউ সংস্করণ: কোনো বাস্তব অর্ডার বা পেমেন্ট হবে না।</p>
          </aside>
        </div>
      )}
    </div>
  );
}
