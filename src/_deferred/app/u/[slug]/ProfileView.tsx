"use client";
import Link from "next/link";
import { MapPin, Store } from "lucide-react";
import { Avatar, PostCard } from "@/_deferred/components/PostCard";
import { FollowButton } from "@/components/FollowButton";
import { VerifiedBadge } from "@/components/Commerce";
import { Breadcrumb, EmptyState } from "@/components/ui/misc";
import { useSocial } from "@/components/social";
import { getMember } from "@/data/community";
import { bn, getSeller } from "@/data/catalog";

export function ProfileView({ slug }: { slug: string }) {
  const { posts, followerCount } = useSocial();
  const m = getMember(slug)!;
  const mine = posts.filter((p) => p.author === slug);
  const shop = m.role === "seller" ? getSeller(slug) : undefined;
  return (
    <>
      <section className="surface-band">
        <div className="container-x py-8">
          <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: "কমিউনিটি", href: "/community" }, { label: m.name }]} />
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={m.name} role={m.role} size={80} />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3"><h1 className="font-bn text-3xl font-semibold">{m.name}</h1>{m.verified && <VerifiedBadge />}<span className="rounded-sm bg-ink/10 px-2 py-0.5 font-bn text-xs text-ink">{m.role === "seller" ? "বিক্রেতা" : "ক্রেতা"}</span></div>
              <p className="mt-1 font-bn text-ink/70">{m.bio}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 font-bn text-sm text-ink/70"><span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{m.location}</span><span><b className="text-ink">{bn(followerCount(m))}</b> ফলোয়ার</span><span><b className="text-ink">{bn(mine.length)}</b> পোস্ট</span></p>
            </div>
            <div className="flex gap-2"><FollowButton slug={m.slug} />{shop && <Link href={`/seller/${shop.slug}`} className="inline-flex h-10 items-center gap-1.5 rounded-md border border-ink/25 bg-white/70 px-4 font-bn text-sm text-ink hover:bg-white"><Store className="h-4 w-4" />দোকান</Link>}</div>
          </div>
        </div>
      </section>
      <div className="container-x max-w-3xl space-y-4 py-8">{mine.length ? mine.map((p) => <PostCard key={p.id} post={p} />) : <EmptyState title="এখনো কোনো পোস্ট নেই" />}</div>
    </>
  );
}
