"use client";
import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Heart, MessageCircle, Play, Share2, Trash2, Tag } from "lucide-react";
import { ProductArt } from "./ProductArt";
import { FollowButton } from "./FollowButton";
import { useSocial } from "./social";
import { useApp } from "./providers";
import { getMember, type Post } from "@/data/community";
import { getProduct } from "@/data/catalog";
import { bn } from "@/data/catalog";
import { cn } from "@/lib/utils";

export function Avatar({ name, role, size = 40 }: { name: string; role: "seller" | "buyer"; size?: number }) {
  return <span style={{ width: size, height: size }} className={cn("grid shrink-0 place-items-center rounded-full font-bn text-white", role === "seller" ? "bg-navy" : "bg-teal")}><span style={{ fontSize: size * 0.42 }}>{name[0]}</span></span>;
}

export function PostCard({ post }: { post: Post }) {
  const { toast, user } = useApp();
  const { liked, toggleLike, likeCount, commentsOf, addComment, deletePost, me, isFollowing } = useSocial();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const author = post.author === "me" ? me : getMember(post.author);
  const prod = post.productSlug ? getProduct(post.productSlug) : undefined;
  const comments = commentsOf(post);
  const on = liked.includes(post.id);
  if (!author && post.author === "me") return null;
  const a = author!;
  const m = post.media;

  return (
    <article className="glass rounded-md">
      <header className="flex items-center gap-3 p-4 pb-3">
        <Avatar name={a.name} role={a.role} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5">
            {post.author === "me" ? <span className="font-bn text-[15px] font-medium text-navy">{a.name} <span className="text-xs text-mist-500">(আপনি)</span></span> : <Link href={`/u/${a.slug}`} className="font-bn text-[15px] font-medium text-navy hover:text-teal">{a.name}</Link>}
            {a.verified && <BadgeCheck className="h-4 w-4 text-teal" />}
            <span className={cn("rounded-sm px-1.5 py-0.5 font-bn text-[10px]", a.role === "seller" ? "bg-navy/10 text-navy" : "bg-teal-50 text-teal-700")}>{a.role === "seller" ? "বিক্রেতা" : "ক্রেতা"}</span>
          </p>
          <p className="font-bn text-xs text-mist-500">{post.ago}{a.location && ` · ${a.location}`}</p>
        </div>
        {post.author !== "me" && !isFollowing(a.slug) && <FollowButton slug={a.slug} size="sm" />}
        {post.mine && <button aria-label="Delete" onClick={() => deletePost(post.id)} className="grid h-8 w-8 place-items-center rounded text-mist-500 hover:bg-mist hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
      </header>
      <p className="whitespace-pre-line px-4 pb-3 font-bn text-[15px] leading-relaxed text-ink/90">{post.text}</p>

      {m && (
        <div className="relative mx-4 mb-3 aspect-[4/3] overflow-hidden rounded bg-mist sm:aspect-[16/9]">
          {m.type === "image" && (m.src ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.src} alt="" className="h-full w-full object-cover" /> : prod && <ProductArt motif={prod.motif} bg={prod.color} accent={prod.accent} seed={post.id} className="h-full w-full" />)}
          {m.type === "video" && (m.src ? <video src={m.src} controls playsInline className="h-full w-full bg-black object-contain" /> : (
            <>
              {prod && <ProductArt motif={prod.motif} bg={prod.color} accent={prod.accent} seed={post.id + "v"} className="h-full w-full" />}
              <button onClick={() => toast("ডেমো ভিডিও — আসল ভিডিও আপলোড ব্যাকএন্ড যুক্ত হলে চলবে", "info")} className="absolute inset-0 grid place-items-center bg-navy/25 transition-colors hover:bg-navy/35" aria-label="Play">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-navy shadow-lift"><Play className="ml-1 h-7 w-7 fill-current" /></span>
              </button>
              <span className="absolute bottom-2 left-2 rounded-sm bg-navy/85 px-2 py-0.5 font-bn text-[11px] text-white">ভিডিও</span>
            </>
          ))}
        </div>
      )}

      {prod && (
        <Link href={`/product/${prod.slug}`} className="mx-4 mb-3 flex items-center gap-2 rounded border border-teal/25 bg-teal-50/70 px-3 py-2 font-bn text-sm text-teal-700 hover:bg-teal-50">
          <Tag className="h-4 w-4" />{prod.bn} — পণ্য দেখুন
        </Link>
      )}

      <footer className="border-t border-navy/[.07] px-2 py-1.5">
        <div className="flex items-center gap-1">
          <button onClick={() => toggleLike(post.id)} aria-pressed={on} className={cn("flex items-center gap-1.5 rounded px-3 py-2 font-bn text-sm hover:bg-mist", on ? "text-red-600" : "text-ink/70")}><Heart className={cn("h-4 w-4", on && "fill-current")} />{bn(likeCount(post))}</button>
          <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-1.5 rounded px-3 py-2 font-bn text-sm text-ink/70 hover:bg-mist"><MessageCircle className="h-4 w-4" />{bn(comments.length)}</button>
          <button onClick={() => { try { navigator.clipboard?.writeText(`${location.origin}/community#${post.id}`); } catch {} toast("লিংক কপি হয়েছে", "info"); }} className="ml-auto flex items-center gap-1.5 rounded px-3 py-2 font-bn text-sm text-ink/70 hover:bg-mist"><Share2 className="h-4 w-4" />শেয়ার</button>
        </div>
        {open && (
          <div className="space-y-2 px-2 pb-3 pt-1">
            {comments.map((c) => { const ca = c.author === "me" ? me : getMember(c.author); return <p key={c.id} className="rounded bg-white/60 px-3 py-2 font-bn text-sm"><b className="text-navy">{ca?.name ?? "ব্যবহারকারী"}</b> {c.text}</p>; })}
            <form onSubmit={(e) => { e.preventDefault(); if (!user) { toast("মন্তব্য করতে আগে লগইন করুন", "info"); return; } if (text.trim().length < 2) return; addComment(post.id, text.trim()); setText(""); }} className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="মন্তব্য লিখুন…" className="h-10 min-w-0 flex-1 rounded-md border border-mist-300 bg-white/80 px-3 font-bn text-sm focus:border-teal focus:outline-none" />
              <button className="rounded-md bg-teal px-4 font-bn text-sm text-white hover:bg-teal-600">পাঠান</button>
            </form>
          </div>
        )}
      </footer>
    </article>
  );
}
