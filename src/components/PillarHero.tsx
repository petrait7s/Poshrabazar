import { cn } from "@/lib/utils";
import { Breadcrumb } from "./ui/misc";

const tones = {
  marketplace: { tag: "MARKETPLACE", bar: "bg-primary" },
  knowledge: { tag: "MARKETPLACE", bar: "bg-accent" },
  intelligence: { tag: "MARKET PRICES", bar: "bg-primary" },
  solutions: { tag: "MARKETPLACE", bar: "bg-accent" },
} as const;

export function PillarHero({ pillar, title, sub, crumbs, children, dark = true }: { pillar: keyof typeof tones; title: React.ReactNode; sub?: React.ReactNode; crumbs: { label: string; href?: string }[]; children?: React.ReactNode; dark?: boolean }) {
  const t = tones[pillar];
  return (
    <section className={cn("relative overflow-hidden border-b", dark ? "border-ink bg-ink text-white" : "border-line bg-white")}>
      <div className={cn("absolute inset-y-0 left-0 w-1", t.bar)} />
      <div className="container-x relative py-8 sm:py-12">
        <div className={dark ? "[&_*]:!text-white/60 [&_a:hover]:!text-white" : ""}><Breadcrumb items={crumbs} /></div>
        <p className="eyebrow mt-4 !text-accent">{t.tag}</p>
        <h1 className={cn("mt-2 max-w-3xl font-bn text-3xl font-semibold sm:text-5xl", dark ? "!text-white" : "")}>{title}</h1>
        {sub && <p className={cn("mt-3 max-w-2xl font-bn text-base sm:text-lg", dark ? "text-white/75" : "text-ink/70")}>{sub}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
