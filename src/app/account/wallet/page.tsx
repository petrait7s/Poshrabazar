"use client";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Landmark, Plus, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers";
import { balanceOf, buyerTx, sellerTx } from "@/data/wallet";
import { taka } from "@/data/catalog";
import { FEE, feeRateLabel, payerLabel } from "@/data/fees";
import { bn } from "@/data/catalog";
import { cn } from "@/lib/utils";

export default function Page() {
  const { user, toast } = useApp();
  const seller = user?.role === "seller";
  const [view, setView] = useState<"buyer" | "seller">(seller ? "seller" : "buyer");
  const tx = view === "seller" ? sellerTx : buyerTx;
  const bal = balanceOf(tx);
  const gate = () => toast("পেমেন্ট গেটওয়ে (bKash/Nagad/কার্ড) এখনো যুক্ত হয়নি — শীঘ্রই", "info");
  return (
    <>
      <h1 className="font-bn text-3xl font-normal">আমার ওয়ালেট</h1>
      <p className="mt-1 flex items-center gap-2 font-bn text-sm text-gold-700"><ShieldAlert className="h-4 w-4" />ডেমো ওয়ালেট — নিচের সব অঙ্ক নমুনা; আসল টাকা যোগ/তোলা যায় না।</p>
      <div className="mt-4 inline-flex overflow-hidden rounded-md border border-navy/25">{(["buyer", "seller"] as const).map((v) => <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={cn("px-4 py-2 font-bn text-sm", view === v ? "bg-navy text-white" : "bg-white/60 text-navy hover:bg-white")}>{v === "buyer" ? "ক্রেতা ওয়ালেট" : "বিক্রেতা ওয়ালেট"}</button>)}</div>

      <div className="glass-dark mt-5 rounded-md bg-[radial-gradient(420px_220px_at_100%_0%,rgba(198,161,91,.3),transparent_70%)] p-6 text-white">
        <p className="font-bn text-sm text-white/70">{view === "seller" ? "উত্তোলনযোগ্য ব্যালেন্স (ফি বাদে)" : "ওয়ালেট ব্যালেন্স"}</p>
        <p className="mt-1 text-4xl font-bold tabular-nums">{taka(bal)}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {view === "buyer" ? <Button variant="gold" onClick={gate}><Plus className="h-4 w-4" />টাকা যোগ করুন</Button> : <Button variant="gold" onClick={gate}><Landmark className="h-4 w-4" />টাকা তুলুন</Button>}
          <span className="self-center font-bn text-xs text-white/60">গেটওয়ে যুক্ত হলে চালু হবে</span>
        </div>
      </div>

      {view === "seller" && (
        <div className="glass mt-4 rounded-md p-4 font-bn text-sm text-ink/80">
          <b className="text-navy">প্ল্যাটফর্ম ফি নীতি:</b> একই বিক্রেতার অর্ডার <b>৳{bn(FEE.threshold)}</b>-এর বেশি হলে <b>{feeRateLabel}</b> ফি পেট্রা পায় ({payerLabel})। ৳{bn(FEE.threshold)} বা তার কম অর্ডারে কোনো ফি নেই।
        </div>
      )}

      <h2 className="mb-3 mt-8 font-bn text-xl">লেনদেন</h2>
      <ul className="glass divide-y divide-navy/[.07] rounded-md">
        {tx.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-4 py-3">
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", t.type === "credit" ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-600")}>{t.type === "credit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}</span>
            <div className="min-w-0 flex-1"><p className="truncate font-bn text-sm text-navy">{t.label}</p><p className="font-bn text-xs text-mist-500">{t.date}{t.type === "fee" && " · প্ল্যাটফর্ম ফি"}</p></div>
            <b className={cn("tabular-nums", t.type === "credit" ? "text-teal-700" : "text-red-600")}>{t.type === "credit" ? "+" : "−"}{taka(t.amount)}</b>
          </li>
        ))}
      </ul>
    </>
  );
}
