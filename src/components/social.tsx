"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useApp } from "./providers";
import { getMember, members, seedPosts, type Member, type Post, type PostComment, type Media } from "@/data/community";

type SocialCtx = {
  following: string[]; isFollowing: (slug: string) => boolean; toggleFollow: (slug: string) => void;
  followerCount: (m: Member) => number; followingCount: number;
  posts: Post[]; addPost: (p: { text: string; media?: Media; productSlug?: string }) => void; deletePost: (id: string) => void;
  liked: string[]; toggleLike: (id: string) => void; likeCount: (p: Post) => number;
  addComment: (postId: string, text: string) => void; commentsOf: (p: Post) => PostComment[];
  me: Member | null;
};
const Ctx = createContext<SocialCtx | null>(null);
export const useSocial = () => { const c = useContext(Ctx); if (!c) throw new Error("no social provider"); return c; };

const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user, toast } = useApp();
  const [following, setFollowing] = useState<string[]>([]);
  const [mine, setMine] = useState<Post[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [extra, setExtra] = useState<Record<string, PostComment[]>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => { setFollowing(load("pb_follow", [])); setMine(load("pb_posts", [])); setLiked(load("pb_liked", [])); setExtra(load("pb_comments", {})); setReady(true); }, []);
  useEffect(() => { if (ready) save("pb_follow", following); }, [following, ready]);
  useEffect(() => { if (ready) save("pb_posts", mine.map((p) => (p.media?.type === "video" ? { ...p, media: { type: "video" as const } } : p))); }, [mine, ready]);
  useEffect(() => { if (ready) save("pb_liked", liked); }, [liked, ready]);
  useEffect(() => { if (ready) save("pb_comments", extra); }, [extra, ready]);

  const need = useCallback((what: string) => { if (user) return true; toast(`${what} করতে আগে লগইন করুন`, "info"); return false; }, [user, toast]);
  const me: Member | null = user ? { slug: "me", name: user.name, role: user.role === "seller" ? "seller" : "buyer", location: "", verified: false, bio: "", followers: 0 } : null;

  const value = useMemo<SocialCtx>(() => ({
    following, isFollowing: (s) => following.includes(s),
    toggleFollow: (s) => { if (!need("ফলো")) return; setFollowing((f) => { const on = f.includes(s); toast(on ? "ফলো বাতিল" : `${getMember(s)?.name ?? ""} কে ফলো করছেন`, on ? "info" : "ok"); return on ? f.filter((x) => x !== s) : [...f, s]; }); },
    followerCount: (m) => m.followers + (following.includes(m.slug) ? 1 : 0), followingCount: following.length,
    posts: [...mine, ...seedPosts],
    addPost: (p) => { if (!need("পোস্ট")) return; setMine((m) => [{ id: `m${Date.now()}`, author: "me", text: p.text, media: p.media, productSlug: p.productSlug, ago: "এইমাত্র", likes: 0, comments: [], mine: true }, ...m]); toast("পোস্ট হয়েছে (ডেমো — শুধু আপনার ব্রাউজারে)"); },
    deletePost: (id) => { setMine((m) => m.filter((p) => p.id !== id)); toast("পোস্ট মুছে ফেলা হয়েছে", "info"); },
    liked, toggleLike: (id) => { if (!need("লাইক")) return; setLiked((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id])); },
    likeCount: (p) => p.likes + (liked.includes(p.id) ? 1 : 0),
    addComment: (id, text) => { if (!need("মন্তব্য")) return; setExtra((e) => ({ ...e, [id]: [...(e[id] ?? []), { id: `c${Date.now()}`, author: "me", text }] })); },
    commentsOf: (p) => [...p.comments, ...(extra[p.id] ?? [])],
    me,
  }), [following, mine, liked, extra, need, toast, user]); // eslint-disable-line react-hooks/exhaustive-deps
  void members;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
