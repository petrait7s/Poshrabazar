import Link from "next/link";
import { Clock } from "lucide-react";
import { ProductArt } from "./ProductArt";
import { kCategories, type Article } from "@/data/knowledge";
import type { Motif } from "@/data/catalog";
import { cn } from "@/lib/utils";

const motifFor: Record<string, [Motif, string]> = { farming: ["leaf", "#5a9a4c"], storage: ["tuber", "#b88b4a"], selling: ["jar", "#c79b1b"], business: ["grain", "#c9b27a"], digital: ["round", "#5b3f8c"], "livestock-fisheries": ["fish", "#4f7da1"] };

export function ArticleCover({ a, className }: { a: Article; className?: string }) {
  const [m, c] = motifFor[a.cat] ?? ["round", "#167C78"];
  return <ProductArt motif={m} bg={a.color} accent={c} seed={a.slug} className={className} />;
}

export function ArticleCard({ a, featured, row, className }: { a: Article; featured?: boolean; row?: boolean; className?: string }) {
  const cat = kCategories.find((c) => c.slug === a.cat);
  return (
    <Link href={`/knowledge/${a.slug}`} className={cn("group flex flex-col", featured ? "" : row ? "flex-row gap-4" : "sm:flex-row lg:flex-col", className)}>
      <div className={cn("overflow-hidden rounded-md", featured ? "aspect-[16/10]" : row ? "aspect-square w-28 shrink-0 sm:w-36" : "aspect-[16/10] sm:aspect-square sm:w-32 sm:shrink-0 lg:aspect-[16/10] lg:w-full")}>
        <ArticleCover a={a} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className={cn(featured ? "pt-4" : row ? "" : "pt-3 sm:pl-4 sm:pt-0 lg:pl-0 lg:pt-3")}>
        <p className="eyebrow !text-[10px]">{cat?.en}</p>
        <h3 className={cn("mt-1 font-bn text-navy group-hover:text-teal", featured ? "text-2xl" : "text-lg")}>{a.bn}</h3>
        <p className="mt-1.5 line-clamp-2 font-bn text-sm text-ink/70">{a.excerpt}</p>
        <p className="mt-2 flex items-center gap-1 text-xs text-mist-500"><Clock className="h-3 w-3" />{a.minutes} min · {a.date}</p>
      </div>
    </Link>
  );
}
