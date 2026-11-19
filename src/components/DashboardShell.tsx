"use client";
import { cn } from "@/lib/utils";
import { DemoBadge } from "./ui/misc";
import type { LucideIcon } from "lucide-react";
import { ShieldAlert } from "lucide-react";

export type DashNav = { id: string; label: string; icon: LucideIcon; badge?: number };

export function DashboardShell({ title, sub, nav, active, onChange, children, actions }: { title: string; sub?: string; nav: DashNav[]; active: string; onChange: (id: string) => void; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="bg-paper">
      <div className="border-b border-gold/40 bg-gold-50"><p className="container-x flex items-center gap-2 py-2 font-bn text-xs text-gold-700"><ShieldAlert className="h-4 w-4 shrink-0" />ডেমো ইন্টারফেস — সব তথ্য নমুনা, পরিবর্তন শুধু এই পাতায় থাকে; কোনো ব্যাকএন্ডে সংরক্ষিত হয় না।</p></div>
      <div className="container-x grid gap-6 py-6 lg:grid-cols-[230px_1fr] lg:py-8">
        <aside className="min-w-0">
          <nav aria-label="Dashboard" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-32 lg:mx-0 lg:flex-col lg:overflow-visible lg:rounded-md lg:border lg:border-mist-300 lg:bg-white lg:p-2">
            {nav.map((n) => (
              <button key={n.id} onClick={() => onChange(n.id)} aria-current={active === n.id}
                className={cn("flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 font-bn text-sm transition-colors", active === n.id ? "bg-navy text-white" : "text-navy hover:bg-mist max-lg:bg-white max-lg:border max-lg:border-mist-300")}>
                <n.icon className="h-4 w-4" strokeWidth={1.75} />{n.label}
                {!!n.badge && <span className={cn("ml-auto rounded-full px-1.5 text-[10px] font-bold", active === n.id ? "bg-gold text-navy" : "bg-teal text-white")}>{n.badge}</span>}
              </button>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><h1 className="font-bn text-2xl font-normal sm:text-3xl">{title}</h1>{sub && <p className="mt-1 font-bn text-sm text-ink/60">{sub}</p>}</div>
            <div className="flex items-center gap-2"><DemoBadge />{actions}</div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Stat({ label, value, delta, hint }: { label: string; value: string; delta?: string; hint?: string }) {
  return (
    <div className="rounded-md border border-mist-300 bg-white p-4">
      <p className="font-bn text-xs text-ink/60">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-navy">{value}</p>
      {(delta || hint) && <p className="mt-1 font-bn text-xs"><span className="font-semibold text-teal">{delta}</span> <span className="text-mist-500">{hint}</span></p>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md border border-mist-300 bg-white", className)}>
      {title && <header className="flex items-center justify-between border-b border-mist px-4 py-3"><h2 className="font-bn text-lg">{title}</h2>{action}</header>}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatusPill({ s }: { s: string }) {
  const map: Record<string, string> = { "নতুন": "bg-gold-50 text-gold-700", "প্রস্তুত": "bg-navy/10 text-navy", "পথে": "bg-teal-50 text-teal-700", "সম্পন্ন": "bg-teal text-white", "বাতিল": "bg-red-50 text-red-700", "সক্রিয়": "bg-teal-50 text-teal-700", "বিরতি": "bg-mist text-ink/70", "অপেক্ষমাণ": "bg-gold-50 text-gold-700", "যাচাইকৃত": "bg-teal-50 text-teal-700", "প্রত্যাখ্যাত": "bg-red-50 text-red-700", "প্রকাশিত": "bg-teal-50 text-teal-700", "খসড়া": "bg-mist text-ink/70" };
  return <span className={cn("inline-block whitespace-nowrap rounded-sm px-2 py-0.5 font-bn text-xs font-medium", map[s] ?? "bg-mist")}>{s}</span>;
}
