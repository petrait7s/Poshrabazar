"use client";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
export function QtyStepper({ value, onChange, min = 1, className, compact }: { value: number; onChange: (n: number) => void; min?: number; className?: string; compact?: boolean }) {
  return (
    <div className={cn("inline-flex items-center overflow-hidden surface rounded-md", className)}>
      <button type="button" aria-label="Decrease" onClick={() => onChange(Math.max(min, value - 1))} className={cn("grid place-items-center hover:bg-tint", compact ? "h-8 w-8" : "h-10 w-10")}><Minus className="h-3.5 w-3.5" /></button>
      <input aria-label="Quantity" inputMode="numeric" value={value} onChange={(e) => { const n = parseInt(e.target.value.replace(/\D/g, ""), 10); onChange(isNaN(n) ? min : Math.max(min, n)); }} className={cn("border-x border-line text-center text-sm font-semibold tabular-nums focus:outline-none", compact ? "h-8 w-11" : "h-10 w-14")} />
      <button type="button" aria-label="Increase" onClick={() => onChange(value + 1)} className={cn("grid place-items-center hover:bg-tint", compact ? "h-8 w-8" : "h-10 w-10")}><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );
}
