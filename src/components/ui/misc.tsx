"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, PackageOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const Skeleton = ({ className }: { className?: string }) => <div className={cn("skeleton rounded", className)} />;

export function Tabs({ tabs, defaultTab, className }: { tabs: { id: string; label: React.ReactNode; content: React.ReactNode }[]; defaultTab?: string; className?: string }) {
  const [a, setA] = useState(defaultTab ?? tabs[0].id);
  return (
    <div className={className}>
      <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={a === t.id} onClick={() => setA(t.id)}
            className={cn("relative whitespace-nowrap px-4 py-3 font-bn text-sm font-medium transition-colors", a === t.id ? "text-ink after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-primary" : "text-muted hover:text-ink")}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-5">{tabs.find((t) => t.id === a)?.content}</div>
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {it.href ? <Link href={it.href} className="font-bn hover:text-primary">{it.label}</Link> : <span className="font-bn text-ink">{it.label}</span>}
          {i < items.length - 1 && <ChevronRight className="h-3 w-3" />}
        </span>
      ))}
    </nav>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-md border border-dashed border-primary/30 bg-white/55 px-6 py-14 text-center">
      <PackageOpen className="h-10 w-10 text-muted" strokeWidth={1.25} />
      <h3 className="mt-3 font-bn text-lg text-ink">{title}</h3>
      {text && <p className="mt-1 max-w-sm font-bn text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stars({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", className)}>
      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
      <b className="font-semibold text-ink">{value.toFixed(1)}</b>
      {count !== undefined && <span className="text-muted">({count})</span>}
    </span>
  );
}

export function SectionHead({ eyebrow, title, sub, href, cta, className }: { eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; href?: string; cta?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-6 flex items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="h-section">{title}</h2>
        {sub && <p className="mt-1.5 max-w-2xl font-bn text-[15px] text-ink/70">{sub}</p>}
      </div>
      {href && <Link href={href} className="hidden shrink-0 items-center gap-1 font-bn text-sm font-medium text-primary hover:underline sm:flex">{cta}<ChevronRight className="h-4 w-4" /></Link>}
    </div>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return <span className={cn("inline-flex items-center rounded-sm bg-accent-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-700", className)}>Demo data</span>;
}
