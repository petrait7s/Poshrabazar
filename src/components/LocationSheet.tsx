"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Crosshair, Search, X } from "lucide-react";
import { useApp } from "./providers";
import { upazilas } from "@/data/locations";
import { cn } from "@/lib/utils";

const LIST = upazilas["সিলেট"];

/** Delivery-area chooser: upazilas of Sylhet district (the launch area). Bottom sheet on phones, centred dialog on larger screens. */
export function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { area, setArea, toast } = useApp();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);
  const current = sel || area.upazila || "সিলেট সদর";

  useEffect(() => {
    if (!open) return;
    setQ(""); setSel("");
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => ref.current?.querySelector("input")?.focus(), 50);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [open, onClose]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return LIST.filter((u) => !t || u.bn.includes(q.trim()) || u.en.toLowerCase().includes(t));
  }, [q]);

  if (!open) return null;
  const confirm = () => { setArea({ division: "সিলেট", district: "সিলেট", upazila: current }); toast(`ডেলিভারি এলাকা: ${current}`, "info"); onClose(); };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="loc-title">
      <button type="button" aria-label="বন্ধ করুন" onClick={onClose} className="absolute inset-0 animate-[fade_200ms_ease-out_both] bg-ink/45" />
      <div ref={ref} className="relative flex max-h-[85vh] w-full max-w-md animate-rise flex-col rounded-t-2xl bg-cream px-4 pb-4 pt-2 shadow-lift sm:rounded-xl">
        <div aria-hidden className="mx-auto h-1 w-9 rounded-full bg-line sm:hidden" />
        <div className="flex items-start justify-between gap-3 pt-4">
          <div>
            <h2 id="loc-title" className="text-[22px] leading-snug">ডেলিভারি এলাকা</h2>
            <p className="text-[13.5px] leading-normal text-muted">সিলেট বিভাগ · সিলেট জেলা। পণ্য ও দাম আপনার উপজেলা অনুযায়ী দেখাবে।</p>
          </div>
          <button type="button" aria-label="বন্ধ করুন" onClick={onClose} className="-mr-2.5 -mt-1.5 grid h-11 w-11 shrink-0 place-items-center text-ink"><X className="h-5 w-5" /></button>
        </div>

        <label className="mt-4 flex h-12 items-center gap-2 rounded-lg border border-line bg-surface px-3.5 focus-within:border-primary">
          <Search className="h-[18px] w-[18px] text-muted" aria-hidden />
          <span className="sr-only">উপজেলা খুঁজুন</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="উপজেলা খুঁজুন" className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
        </label>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
          {rows.map((u) => {
            const on = u.bn === current;
            return (
              <button key={u.bn} type="button" aria-pressed={on} onClick={() => setSel(u.bn)} className="flex min-h-14 w-full items-center justify-between border-b border-line text-left">
                <span className="flex flex-col"><span className="text-base leading-snug">{u.bn}</span><span className="text-[10.5px] leading-snug tracking-[0.1em] text-muted">{u.en.toUpperCase()}</span></span>
                <span className={cn("grid h-[22px] w-[22px] place-items-center rounded-full border-[1.5px]", on ? "border-primary bg-primary text-white" : "border-stone-300")}>{on && <Check className="h-3 w-3" strokeWidth={3.2} />}</span>
              </button>
            );
          })}
          {rows.length === 0 && <p className="py-6 text-center text-sm text-muted">এই নামে কোনো উপজেলা পাওয়া যায়নি</p>}
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
          <button type="button" onClick={() => toast("অবস্থান শনাক্তকরণ এখনো চালু হয়নি", "info")} className="flex h-11 items-center justify-center gap-2 text-sm font-semibold text-primary"><Crosshair className="h-[18px] w-[18px]" />আমার বর্তমান অবস্থান ব্যবহার করুন</button>
          <button type="button" onClick={confirm} className="h-[52px] rounded-lg bg-primary text-base font-semibold text-white hover:bg-primary-700">{current} নির্বাচন করুন</button>
        </div>
      </div>
    </div>
  );
}
