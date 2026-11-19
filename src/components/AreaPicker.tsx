"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, MapPin, X, ChevronDown } from "lucide-react";
import { divisions, areaLabel, type Area, noArea } from "@/data/locations";
import { Select } from "./ui/form";
import { Button } from "./ui/button";
import { useApp } from "./providers";
import { cn } from "@/lib/utils";

/** Two native selects: বিভাগ → জেলা. For forms and sidebars. */
export function AreaSelect({ value, onChange, className, allLabel = "সব বিভাগ", error }: { value: Area; onChange: (a: Area) => void; className?: string; allLabel?: string; error?: string }) {
  const d = divisions.find((x) => x.bn === value.division);
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <label className="block"><span className="mb-1.5 block font-bn text-sm font-medium text-navy">বিভাগ</span>
        <Select className="h-11 w-full" value={value.division} onChange={(e) => onChange({ division: e.target.value, district: "" })}>
          <option value="">{allLabel}</option>{divisions.map((x) => <option key={x.bn} value={x.bn}>{x.bn}</option>)}
        </Select></label>
      <label className="block"><span className="mb-1.5 block font-bn text-sm font-medium text-navy">জেলা</span>
        <Select className="h-11 w-full" value={value.district} disabled={!d} onChange={(e) => onChange({ ...value, district: e.target.value })}>
          <option value="">{d ? "পুরো বিভাগ" : "আগে বিভাগ বাছুন"}</option>{d?.districts.map((x) => <option key={x} value={x}>{x}</option>)}
        </Select></label>
      {error && <span className="text-xs text-red-600 sm:col-span-2" role="alert">{error}</span>}
    </div>
  );
}

/** Visual two-step picker modal (বিভাগ, then জেলা). */
export function AreaModal({ open, onClose, title = "আপনার এলাকা বাছুন", onPick }: { open: boolean; onClose: () => void; title?: string; onPick?: (a: Area) => void }) {
  const { area, setArea, toast } = useApp();
  const [div, setDiv] = useState<string>("");
  useEffect(() => { if (open) setDiv(area.division); }, [open, area.division]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  if (!open) return null;
  const d = divisions.find((x) => x.bn === div);
  const pick = (a: Area) => { setArea(a); onPick?.(a); toast(`এলাকা: ${areaLabel(a)}`, "info"); onClose(); };
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal aria-label={title}>
      <div className="absolute inset-0 bg-navy/55" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-full max-w-xl animate-rise flex-col overflow-hidden rounded-t-lg bg-paper/95 shadow-lift backdrop-blur-xl sm:rounded-lg">
        <header className="flex items-center gap-2 border-b border-mist-300 px-5 py-4">
          {d && <button onClick={() => setDiv("")} aria-label="Back" className="grid h-8 w-8 place-items-center rounded hover:bg-mist"><ArrowLeft className="h-4 w-4" /></button>}
          <div className="flex-1"><h2 className="font-bn text-lg text-navy">{d ? `${d.bn} বিভাগ — জেলা বাছুন` : title}</h2><p className="font-bn text-xs text-ink/60">{d ? "জেলা বা পুরো বিভাগ" : "প্রথমে বিভাগ, তারপর জেলা"}</p></div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded hover:bg-mist"><X className="h-4 w-4" /></button>
        </header>
        <div className="overflow-y-auto p-4">
          {!d ? (
            <>
              <button onClick={() => pick(noArea)} className={cn("mb-2 flex w-full items-center justify-between rounded-md border px-4 py-3 font-bn", !area.division ? "border-teal bg-teal-50 text-teal-700" : "border-mist-300 hover:bg-paper")}>সারা বাংলাদেশ{!area.division && <Check className="h-4 w-4" />}</button>
              <div className="grid grid-cols-2 gap-2">
                {divisions.map((x) => <button key={x.bn} onClick={() => setDiv(x.bn)} className={cn("rounded-md border px-4 py-3 text-left transition-colors hover:border-navy", area.division === x.bn ? "border-teal bg-teal-50" : "border-mist-300")}><span className="block font-bn text-[16px] text-navy">{x.bn}</span><span className="text-[11px] text-mist-500">{x.en} · {x.districts.length} জেলা</span></button>)}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => pick({ division: d.bn, district: "" })} className={cn("mb-2 flex w-full items-center justify-between rounded-md border px-4 py-3 font-bn", area.division === d.bn && !area.district ? "border-teal bg-teal-50 text-teal-700" : "border-mist-300 hover:bg-paper")}>পুরো {d.bn} বিভাগ{area.division === d.bn && !area.district && <Check className="h-4 w-4" />}</button>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {d.districts.map((x) => <button key={x} onClick={() => pick({ division: d.bn, district: x })} className={cn("rounded-md border px-3 py-2.5 text-left font-bn text-[15px] hover:border-navy", area.district === x ? "border-teal bg-teal-50 text-teal-700" : "border-mist-300 text-navy")}>{x}</button>)}
              </div>
            </>
          )}
        </div>
        <footer className="border-t border-mist-300 p-3 text-right"><Button variant="ghost" size="sm" onClick={onClose}>বন্ধ করুন</Button></footer>
      </div>
    </div>
  );
}

/** Trigger button showing the current area. */
export function AreaButton({ className, label }: { className?: string; label?: string }) {
  const { area, hydrated } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={cn("flex items-center gap-2 glass rounded-md px-3 py-2 text-left hover:border-navy", className)} aria-haspopup="dialog">
        <MapPin className="h-4 w-4 shrink-0 text-teal" />
        <span className="min-w-0 leading-tight"><span className="block font-bn text-[10px] text-mist-500">{label ?? "এলাকা"}</span><span className="block truncate font-bn text-sm text-navy">{hydrated ? areaLabel(area) : "সারা বাংলাদেশ"}</span></span>
        <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-mist-500" />
      </button>
      <AreaModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
