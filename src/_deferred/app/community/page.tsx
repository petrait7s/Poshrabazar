"use client";
import { useState } from "react";
import Link from "next/link";
import { PillarHero } from "@/components/PillarHero";
import { Composer } from "@/_deferred/components/Composer";
import { PostCard, Avatar } from "@/_deferred/components/PostCard";
import { FollowButton } from "@/components/FollowButton";
import { EmptyState } from "@/components/ui/misc";
import { useSocial } from "@/components/social";
import { useApp } from "@/components/providers";
import { members } from "@/data/community";
import { cn } from "@/lib/utils";

export default function Page() {
  const { posts, isFollowing, following, me } = useSocial();
  const { user } = useApp();
  const [tab, setTab] = useState<"all" | "following" | "mine">("all");
  const list = posts.filter((p) => (tab === "all" ? true : tab === "mine" ? p.author === "me" : isFollowing(p.author)));
  const suggest = members.filter((m) => !following.includes(m.slug)).slice(0, 5);
  return (
    <>
      <PillarHero pillar="marketplace" crumbs={[{ label: "হোম", href: "/" }, { label: "কমিউনিটি" }]} title="কমিউনিটি" sub="বিক্রেতা ও ক্রেতারা একে অপরকে ফলো করুন, ছবি ও ভিডিও পোস্ট করুন, পণ্যের অভিজ্ঞতা শেয়ার করুন।" />
      <div className="container-x grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Composer />
          <div role="tablist" className="flex gap-2">
            {([["all", "সবার পোস্ট"], ["following", `ফলো করছি (${following.length})`], ["mine", "আমার পোস্ট"]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-full border px-4 py-1.5 font-bn text-sm", tab === k ? "border-ink bg-ink text-white" : "border-line bg-white/60 text-ink hover:border-ink")}>{l}</button>
            ))}
          </div>
          {list.length ? list.map((p) => <PostCard key={p.id} post={p} />) : (
            <EmptyState title={tab === "following" ? "ফলো করা কারও পোস্ট নেই" : "কোনো পোস্ট নেই"} text={tab === "following" ? "ডানের তালিকা থেকে কাউকে ফলো করুন।" : user ? "প্রথম পোস্টটি আপনিই করুন।" : "লগইন করে পোস্ট করুন।"} />
          )}
        </div>
        <aside className="space-y-4">
          {me && <div className="surface flex items-center gap-3 rounded-md p-4"><Avatar name={me.name} role={me.role} size={44} /><div className="min-w-0"><p className="truncate font-bn text-ink">{me.name}</p><p className="font-bn text-xs text-muted">{following.length} জনকে ফলো করছেন</p></div></div>}
          <div className="surface rounded-md p-4">
            <h2 className="font-bn text-lg">কাকে ফলো করবেন</h2>
            <ul className="mt-3 space-y-3">{suggest.map((m) => (
              <li key={m.slug} className="flex items-center gap-3"><Avatar name={m.name} role={m.role} size={36} /><div className="min-w-0 flex-1"><Link href={`/u/${m.slug}`} className="block truncate font-bn text-sm text-ink hover:text-primary">{m.name}</Link><p className="font-bn text-[11px] text-muted">{m.role === "seller" ? "বিক্রেতা" : "ক্রেতা"} · {m.location}</p></div><FollowButton slug={m.slug} size="sm" /></li>
            ))}</ul>
          </div>
        </aside>
      </div>
    </>
  );
}
