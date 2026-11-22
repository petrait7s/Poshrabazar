"use client";
import { useState } from "react";
import { Check, Circle } from "lucide-react";
import { StatusPill } from "@/components/DashboardShell";
import { taka } from "@/data/catalog";
import { cn } from "@/lib/utils";

const steps = ["অর্ডার গৃহীত", "প্রস্তুত", "পথে", "ডেলিভারি সম্পন্ন"];
const orders = [
  { id: "PB-DEMO-1042", date: "১২ নভেম্বর ২০২৬", status: "পথে", step: 2, total: 842, items: ["আলু × ৫ কেজি", "পেঁয়াজ × ২ কেজি", "ডিম × ১ ডজন"], seller: "ঢাকা ফ্রেশ ট্রেড" },
  { id: "PB-DEMO-1031", date: "০৮ নভেম্বর ২০২৬", status: "সম্পন্ন", step: 3, total: 1310, items: ["মিনিকেট চাল × ১০ কেজি", "মসুর ডাল × ২ কেজি"], seller: "দিনাজপুর রাইস মিল" },
  { id: "PB-DEMO-1019", date: "০২ নভেম্বর ২০২৬", status: "বাতিল", step: 0, total: 520, items: ["খাঁটি মধু × ১ কেজি"], seller: "চট্টগ্রাম বাজার ঘর" },
];
export default function Page() {
  const [open, setOpen] = useState(orders[0].id);
  return (
    <>
      <h1 className="font-bn text-3xl font-semibold">আমার অর্ডার</h1>
      <p className="mt-1 font-bn text-sm text-accent-700">নিচের অর্ডারগুলো নমুনা (ডেমো) — প্রকৃত অর্ডার নয়।</p>
      <ul className="mt-5 space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="surface rounded-md">
            <button onClick={() => setOpen(open === o.id ? "" : o.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left" aria-expanded={open === o.id}>
              <div><p className="font-semibold text-ink">{o.id}</p><p className="font-bn text-xs text-ink/60">{o.date} · {o.seller}</p></div>
              <div className="flex items-center gap-4"><StatusPill s={o.status} /><b className="tabular-nums">{taka(o.total)}</b></div>
            </button>
            {open === o.id && (
              <div className="border-t border-tint p-4">
                <p className="font-bn text-sm text-ink/75">{o.items.join(" · ")}</p>
                {o.status !== "বাতিল" && (
                  <ol className="mt-5 grid grid-cols-4 gap-1">
                    {steps.map((s, i) => (
                      <li key={s} className="text-center">
                        <div className={cn("relative mx-auto grid h-7 w-7 place-items-center rounded-full", i <= o.step ? "bg-primary text-white" : "bg-tint text-muted")}>{i <= o.step ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}</div>
                        <p className={cn("mt-1.5 font-bn text-[11px] sm:text-xs", i <= o.step ? "text-ink" : "text-muted")}>{s}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
