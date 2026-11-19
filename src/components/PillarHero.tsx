import { cn } from "@/lib/utils";
import { Breadcrumb } from "./ui/misc";

const tones = {
  marketplace: { tag: "01 · BUY & SELL", bar: "bg-teal" },
  knowledge: { tag: "02 · LEARN", bar: "bg-gold" },
  intelligence: { tag: "03 · UNDERSTAND", bar: "bg-teal" },
  solutions: { tag: "04 · GROW", bar: "bg-gold" },
} as const;

export function PillarHero({ pillar, title, sub, crumbs, children, dark = true }: { pillar: keyof typeof tones; title: React.ReactNode; sub?: React.ReactNode; crumbs: { label: string; href?: string }[]; children?: React.ReactNode; dark?: boolean }) {
  const t = tones[pillar];
  return (
    <section className={cn("relative overflow-hidden border-b", dark ? "border-navy bg-navy text-white" : "border-mist-300 bg-white")}>
      <div className={cn("absolute inset-y-0 left-0 w-1", t.bar)} />
      <div className="container-x relative py-8 sm:py-12">
        <div className={dark ? "[&_*]:!text-white/60 [&_a:hover]:!text-white" : ""}><Breadcrumb items={crumbs} /></div>
        <p className="eyebrow mt-4 !text-gold">{t.tag}</p>
        <h1 className={cn("mt-2 max-w-3xl font-bn text-3xl font-normal sm:text-5xl", dark ? "!text-white" : "")}>{title}</h1>
        {sub && <p className={cn("mt-3 max-w-2xl font-bn text-base sm:text-lg", dark ? "text-white/75" : "text-ink/70")}>{sub}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
