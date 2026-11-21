"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Video, X } from "lucide-react";
import { Avatar } from "./PostCard";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers";
import { useSocial } from "@/components/social";
import { products } from "@/data/catalog";
import type { Media } from "@/data/community";

const MAX_IMG = 8 * 1024 * 1024, MAX_VID = 60 * 1024 * 1024;

/** Downscale to a small JPEG so it fits in localStorage for the demo. */
async function shrink(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, 900 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.78);
}

export function Composer() {
  const { user, toast } = useApp();
  const { addPost, me } = useSocial();
  const [text, setText] = useState("");
  const [media, setMedia] = useState<Media | null>(null);
  const [product, setProduct] = useState("");
  const [busy, setBusy] = useState(false);
  const img = useRef<HTMLInputElement>(null), vid = useRef<HTMLInputElement>(null);

  if (!user || !me) return (
    <div className="surface rounded-md p-5 text-center font-bn">
      <p className="text-ink">পোস্ট করতে, ফলো করতে ও মন্তব্য করতে লগইন করুন।</p>
      <div className="mt-3 flex justify-center gap-2"><Link href="/login" className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm text-white hover:bg-primary-700">লগইন</Link><Link href="/register" className="inline-flex h-10 items-center rounded-md border border-ink/25 bg-white/70 px-5 text-sm text-ink hover:bg-white">নিবন্ধন</Link></div>
    </div>
  );

  const pick = async (f: File | undefined, type: "image" | "video") => {
    if (!f) return;
    if (type === "image") {
      if (!f.type.startsWith("image/")) { toast("শুধু ছবি বাছাই করুন", "err"); return; }
      if (f.size > MAX_IMG) { toast("ছবি সর্বোচ্চ ৮ MB", "err"); return; }
      try { setBusy(true); setMedia({ type: "image", src: await shrink(f) }); } catch { toast("ছবিটি পড়া যায়নি", "err"); } finally { setBusy(false); }
    } else {
      if (!f.type.startsWith("video/")) { toast("শুধু ভিডিও বাছাই করুন", "err"); return; }
      if (f.size > MAX_VID) { toast("ভিডিও সর্বোচ্চ ৬০ MB", "err"); return; }
      setMedia({ type: "video", src: URL.createObjectURL(f) });
    }
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 3 && !media) { toast("কিছু লিখুন বা ছবি/ভিডিও যোগ করুন", "err"); return; }
    addPost({ text: text.trim(), media: media ?? undefined, productSlug: product || undefined });
    setText(""); setMedia(null); setProduct("");
  };

  return (
    <form onSubmit={submit} className="surface rounded-md p-4">
      <div className="flex gap-3">
        <Avatar name={me.name} role={me.role} />
        <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 600))} rows={3} placeholder={me.role === "seller" ? "আপনার পণ্য, নতুন সংগ্রহ বা দাম নিয়ে লিখুন…" : "কেমন লাগলো কোনো পণ্য? অন্যদের জানান…"} className="min-h-[84px] flex-1 resize-none rounded-md border border-line bg-white/80 p-3 font-bn text-[15px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>
      {media && (
        <div className="relative mt-3 overflow-hidden rounded">
          {media.type === "image" ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={media.src} alt="" className="max-h-72 w-full object-cover" /> : <video src={media.src} controls className="max-h-72 w-full bg-black" />}
          <button type="button" aria-label="Remove" onClick={() => setMedia(null)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink/80 text-white"><X className="h-4 w-4" /></button>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input ref={img} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0], "image"); e.target.value = ""; }} />
        <input ref={vid} type="file" accept="video/*" hidden onChange={(e) => { pick(e.target.files?.[0], "video"); e.target.value = ""; }} />
        <button type="button" onClick={() => img.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-white/70 px-3 font-bn text-sm hover:bg-white"><ImagePlus className="h-4 w-4 text-primary" />ছবি</button>
        <button type="button" onClick={() => vid.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-white/70 px-3 font-bn text-sm hover:bg-white"><Video className="h-4 w-4 text-primary" />ভিডিও</button>
        <select value={product} onChange={(e) => setProduct(e.target.value)} aria-label="Tag product" className="h-9 min-w-0 max-w-[10rem] rounded-md border border-line bg-white/70 px-2 font-bn text-sm sm:max-w-[14rem]"><option value="">পণ্য ট্যাগ (ঐচ্ছিক)</option>{products.map((p) => <option key={p.slug} value={p.slug}>{p.bn}</option>)}</select>
        <span className="ml-auto font-bn text-xs text-muted">{text.length}/600</span>
        <Button type="submit" size="sm" disabled={busy}>পোস্ট করুন</Button>
      </div>
      <p className="mt-2 font-bn text-[11px] text-muted">ডেমো: পোস্ট শুধু আপনার ব্রাউজারে থাকে; ভিডিও পেজ রিফ্রেশ করলে থাকবে না। ক্রয়-বিক্রয়ের লেনদেন পোস্টে নয়, মার্কেটপ্লেসে হয়।</p>
    </form>
  );
}
