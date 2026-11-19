import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export function Sparkline({ data, className, color = "#167C78", fill = true }: { data: number[]; className?: string; color?: string; fill?: boolean }) {
  const w = 100, h = 32, min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / rng) * (h - 6)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-8 w-24", className)} aria-hidden>
      {fill && <path d={`${d} L${w} ${h} L0 ${h}Z`} fill={color} opacity=".1" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={color} />
    </svg>
  );
}

export function Delta({ now, prev }: { now: number; prev: number }) {
  const d = now - prev, pct = prev ? Math.abs((d / prev) * 100).toFixed(1) : "0";
  if (!d) return <span className="inline-flex items-center gap-0.5 text-xs text-mist-500"><Minus className="h-3 w-3" />0%</span>;
  const up = d > 0;
  return <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums", up ? "text-red-600" : "text-teal")}>{up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{pct}%</span>;
}

export function BarChart({ data, labels, className, height = 160 }: { data: number[]; labels: string[]; className?: string; height?: number }) {
  const max = Math.max(...data);
  return (
    <div className={cn("flex items-end gap-2", className)} style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] font-semibold tabular-nums text-navy">{v}</span>
          <div className="w-full rounded-t-sm bg-teal/85 transition-all hover:bg-teal" style={{ height: `${(v / max) * 72}%` }} />
          <span className="font-bn text-[10px] text-mist-500">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

/** Illustrative software screens (not real screenshots). */
export function SoftwareMock({ kind, className }: { kind: "petrapos" | "petrapms" | "petradms"; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-md border border-white/15 bg-white shadow-lift", className)} aria-hidden>
      <div className="flex items-center gap-1.5 border-b border-mist bg-mist/70 px-3 py-2">
        <i className="h-2 w-2 rounded-full bg-red-400" /><i className="h-2 w-2 rounded-full bg-gold" /><i className="h-2 w-2 rounded-full bg-teal" />
        <span className="ml-2 text-[10px] font-semibold text-navy/70">{kind === "petrapos" ? "PetraPOS · Billing" : kind === "petrapms" ? "PetraPMS · Rooms" : "PetraDMS · Routes"}</span>
      </div>
      {kind === "petrapos" && (
        <div className="grid grid-cols-[1.4fr_1fr] gap-0 text-[10px]">
          <div className="grid grid-cols-3 gap-1.5 bg-paper p-2.5">
            {["আলু ৳৩৬", "পেঁয়াজ ৳৬২", "টমেটো ৳৪৮", "মরিচ ৳৯০", "চাল ৳৭২", "ডাল ৳১২৫", "ডিম ৳১৬৫", "তেল ৳২৬০", "মধু ৳৬৫০"].map((x, i) => <div key={i} className={cn("rounded-sm border border-mist-300 bg-white px-1.5 py-2 font-bn text-navy", i === 1 && "border-teal bg-teal-50")}>{x}</div>)}
          </div>
          <div className="flex flex-col p-2.5">
            {[["আলু ২ কেজি", "৭২"], ["পেঁয়াজ ১ কেজি", "৬২"], ["ডিম ১ ডজন", "১৬৫"]].map(([a, b]) => <div key={a} className="flex justify-between border-b border-mist py-1.5 font-bn"><span>{a}</span><b>৳{b}</b></div>)}
            <div className="mt-auto flex justify-between pt-3 font-bn text-sm font-bold text-navy"><span>মোট</span><span>৳২৯৯</span></div>
            <div className="mt-2 rounded-sm bg-teal py-1.5 text-center font-bn text-white">বিল করুন</div>
          </div>
        </div>
      )}
      {kind === "petrapms" && (
        <div className="p-2.5 text-[10px]">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-mist-500">{["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র"].map((d) => <span key={d} className="font-bn">{d}</span>)}</div>
          {[[1, 3, 0], [0, 2, 5], [2, 2, 1], [0, 4, 0]].map((r, i) => (
            <div key={i} className="mb-1 grid grid-cols-7 gap-1"><span className="col-span-7 font-bn text-navy/70">রুম {101 + i}</span>
              {[...Array(7)].map((_, k) => <span key={k} className={cn("h-4 rounded-sm", (k + i) % 4 === 0 ? "bg-teal" : (k + i) % 5 === 1 ? "bg-gold" : "bg-mist")} />)}</div>
          ))}
        </div>
      )}
      {kind === "petradms" && (
        <div className="p-2.5 text-[10px]">
          {[["রুট ১ · ঢাকা উত্তর", "১২ ডিলার", 78], ["রুট ২ · গাজীপুর", "৯ ডিলার", 54], ["রুট ৩ · নারায়ণগঞ্জ", "১৪ ডিলার", 91]].map(([a, b, p]) => (
            <div key={a as string} className="mb-2.5"><div className="mb-1 flex justify-between font-bn text-navy"><span>{a}</span><span className="text-mist-500">{b}</span></div><div className="h-2 rounded-full bg-mist"><div className="h-2 rounded-full bg-teal" style={{ width: `${p}%` }} /></div></div>
          ))}
          <div className="mt-3 flex gap-2"><span className="rounded-sm bg-navy px-2 py-1 font-bn text-white">অর্ডার ৩৫</span><span className="rounded-sm bg-gold-50 px-2 py-1 font-bn text-gold-700">বকেয়া ৳২.১ লাখ</span></div>
        </div>
      )}
    </div>
  );
}
