import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export function Sparkline({ data, className, color = "#C2410C", fill = true }: { data: number[]; className?: string; color?: string; fill?: boolean }) {
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

export function Delta({ now, prev, dark }: { now: number; prev: number; dark?: boolean }) {
  const d = now - prev, pct = prev ? Math.abs((d / prev) * 100).toFixed(1) : "0";
  if (!d) return <span className="inline-flex items-center gap-0.5 text-xs text-muted"><Minus className="h-3 w-3" />0%</span>;
  const up = d > 0;
  return <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums", up ? (dark ? "text-red-300" : "text-red-600") : (dark ? "text-primary-100" : "text-primary"))}>{up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{pct}%</span>;
}

export function BarChart({ data, labels, className, height = 160 }: { data: number[]; labels: string[]; className?: string; height?: number }) {
  const max = Math.max(...data);
  return (
    <div className={cn("flex items-end gap-2", className)} style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] font-semibold tabular-nums text-ink">{v}</span>
          <div className="w-full rounded-t-sm bg-primary/85 transition-all hover:bg-primary" style={{ height: `${(v / max) * 72}%` }} />
          <span className="font-bn text-[10px] text-muted">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
