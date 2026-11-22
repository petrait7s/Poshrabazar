"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, ListChecks, Newspaper, PackageSearch, Store } from "lucide-react";
import { DashboardShell, Panel, Stat } from "@/components/DashboardShell";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/misc";
import { useApp } from "@/components/providers";
import { bn, getProduct, products, taka } from "@/data/catalog";
import { divisions } from "@/data/locations";
import { originDistrict } from "@/data/market";
import { addListing, addPost, getStore, postKinds, setListingStatus, sourceTypes, statusBn, updateStore, useApplications, type Post, type Source } from "@/lib/applications";

const districts = divisions.flatMap((d) => d.districts);
const num = (v: string) => Math.max(0, parseInt(v.replace(/\D/g, ""), 10) || 0);
const listingBn = { pending: "খসড়া", active: "প্রকাশিত", paused: "বিরতি", rejected: "মডারেটর বাতিল" } as const;

export default function Page() {
  const { user, toast } = useApp();
  const { apps, ready } = useApplications();
  const [tab, setTab] = useState("overview");
  const [, bump] = useState(0);
  const mine = useMemo(() => apps.filter((a) => a.owner === user?.phone).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)), [apps, user]);
  const a = mine.find((x) => x.status === "approved") ?? mine[0];
  const approved = a?.status === "approved";
  const run = (fn: () => void, ok?: string) => { try { fn(); bump((n) => n + 1); if (ok) toast(ok, "ok"); } catch (x) { toast((x as Error).message, "err"); } };

  const [pf, setPf] = useState({ slug: "", retail: "", wholesale: "", moq: "1", stock: "", cost: "", origin: "", source: "" });
  const [sf, setSf] = useState<Omit<Source, "id">>({ name: "", type: "own_farm", district: "", relationship: "we_grow", description: "" });
  const [post, setPost] = useState<Pick<Post, "kind" | "title" | "body">>({ kind: "sourcing", title: "", body: "" });
  const [prod, setProd] = useState<string | null>(null);

  if (!user) return <div className="container-x py-10 font-bn">ড্যাশবোর্ড দেখতে <Link href="/login" className="text-primary underline">লগইন</Link> করুন।</div>;
  if (ready && !a) return <div className="container-x max-w-xl py-10"><EmptyState title="আপনার এখনো দোকান নেই" text="বিক্রেতা হতে আবেদন করুন। অনুমোদনের পর এখানে নিজের দোকান চালাবেন।" action={<LinkButton href="/become-a-seller">বিক্রেতা হওয়ার আবেদন</LinkButton>} /></div>;
  if (!a) return null;

  const s = getStore(a.id);
  const nav = [{ id: "overview", label: "ওভারভিউ", icon: LayoutDashboard }, { id: "products", label: "পণ্য", icon: ListChecks }, { id: "profile", label: "দোকানের পরিচিতি", icon: Store }, { id: "updates", label: "আপডেট", icon: Newspaper }, { id: "orders", label: "অর্ডার", icon: PackageSearch }];
  const prodChoice = getProduct(pf.slug);

  return (
    <DashboardShell title={a.storeNameBn} sub={`${statusBn[a.status]} · শুধু আপনার দোকানের তথ্য`} nav={nav} active={tab} onChange={setTab}>
      {!approved && <div className="mb-5 rounded-md border border-accent/50 bg-accent-50 p-4 font-bn text-sm text-accent-700">দোকান এখনো অনুমোদিত নয় ({statusBn[a.status]})। পণ্য খসড়া করতে পারবেন, কিন্তু প্রকাশ করতে পারবেন না। <Link href="/become-a-seller/status" className="underline">আবেদনের অবস্থা</Link></div>}

      {tab === "overview" && <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="পণ্য" value={bn(s.listings.length)} /><Stat label="প্রকাশিত" value={bn(s.listings.filter((l) => l.status === "active").length)} />
          <Stat label="সংগ্রহের উৎস" value={bn(s.sources.length)} /><Stat label="আপডেট" value={bn(s.posts.length)} />
        </div>
        <Panel title="পরের ধাপ"><ol className="list-decimal space-y-1 pl-5 font-bn text-sm">
          <li className={s.listings.length ? "text-muted line-through" : ""}>পণ্য যোগ করুন (দাম, মজুত, কোন জেলা থেকে আসে)</li>
          <li className={s.sources.length ? "text-muted line-through" : ""}>পণ্য কোথা থেকে সংগ্রহ করেন তা লিখুন</li>
          <li className={s.listings.some((l) => l.status === "active") ? "text-muted line-through" : ""}>অনুমোদনের পর পণ্য প্রকাশ করুন</li>
        </ol></Panel>
      </div>}

      {tab === "products" && <div className="space-y-5">
        <Panel title="নতুন পণ্য">
          <form className="grid gap-3 p-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); run(() => { addListing(a.id, { productSlug: pf.slug, retail: num(pf.retail) * 100, wholesale: num(pf.wholesale) * 100, moq: Math.max(1, num(pf.moq)), stock: num(pf.stock), unitCost: pf.cost ? num(pf.cost) * 100 : null, originDistrict: pf.origin, sourceId: pf.source }); setPf({ slug: "", retail: "", wholesale: "", moq: "1", stock: "", cost: "", origin: "", source: "" }); }, "পণ্য খসড়া হিসেবে যোগ হয়েছে"); }}>
            <Field label="পণ্য"><Select className="h-11 w-full" value={pf.slug} onChange={(e) => { const p = getProduct(e.target.value); setPf({ ...pf, slug: e.target.value, origin: p ? originDistrict(p) : "" }); }}><option value="">বাছুন</option>{products.map((p) => <option key={p.slug} value={p.slug}>{p.bn}</option>)}</Select></Field>
            <Field label={`পণ্য কোন জেলা থেকে আসে${prodChoice ? "" : ""}`}><Select className="h-11 w-full" value={pf.origin} onChange={(e) => setPf({ ...pf, origin: e.target.value })}><option value="">বাছুন</option>{districts.map((d) => <option key={d}>{d}</option>)}</Select></Field>
            <Field label={`খুচরা দাম (৳${prodChoice ? `/${prodChoice.unit}` : ""})`}><Input inputMode="numeric" value={pf.retail} onChange={(e) => setPf({ ...pf, retail: e.target.value })} /></Field>
            <Field label="পাইকারি দাম (ঐচ্ছিক)"><Input inputMode="numeric" value={pf.wholesale} onChange={(e) => setPf({ ...pf, wholesale: e.target.value })} /></Field>
            <Field label="পাইকারির ন্যূনতম পরিমাণ"><Input inputMode="numeric" value={pf.moq} onChange={(e) => setPf({ ...pf, moq: e.target.value })} /></Field>
            <Field label="মজুত"><Input inputMode="numeric" value={pf.stock} onChange={(e) => setPf({ ...pf, stock: e.target.value })} /></Field>
            <Field label="কেনা দাম (৳, ঐচ্ছিক)" hint="লাভ-ক্ষতির হিসাবের জন্য"><Input inputMode="numeric" value={pf.cost} onChange={(e) => setPf({ ...pf, cost: e.target.value })} /></Field>
            <Field label="সংগ্রহের উৎস (ঐচ্ছিক)"><Select className="h-11 w-full" value={pf.source} onChange={(e) => setPf({ ...pf, source: e.target.value })}><option value="">—</option>{s.sources.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
            <div className="sm:col-span-2"><Button type="submit">খসড়ায় যোগ করুন</Button></div>
          </form>
        </Panel>
        <Panel title={`আপনার পণ্য (${bn(s.listings.length)})`}>
          {!s.listings.length ? <p className="p-4 font-bn text-sm text-muted">এখনো কোনো পণ্য নেই।</p> : (
            <ul className="divide-y divide-tint">{s.listings.map((l) => { const p = getProduct(l.productSlug)!; return (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 p-4 font-bn text-sm">
                <span><b className="text-base">{p.bn}</b><span className="block text-xs text-muted">{taka(l.retail / 100)}/{p.unit} · মজুত {bn(l.stock)} · উৎস {l.originDistrict}{l.unitCost != null && ` · কেনা ${taka(l.unitCost / 100)}`}</span></span>
                <span className="flex items-center gap-2"><span className="rounded-sm bg-tint px-2 py-1 text-xs">{listingBn[l.status]}</span>
                  {l.status !== "active" && l.status !== "rejected" && <Button size="sm" onClick={() => run(() => setListingStatus(a.id, l.id, "active", approved), "প্রকাশিত")}>প্রকাশ</Button>}
                  {l.status === "active" && <Button size="sm" variant="outline" onClick={() => run(() => setListingStatus(a.id, l.id, "paused", approved))}>বিরতি</Button>}</span>
              </li>); })}</ul>)}
        </Panel>
      </div>}

      {tab === "profile" && <div className="space-y-5">
        <Panel title="পণ্য কোথা থেকে আসে (সংগ্রহের উৎস)">
          <ul className="divide-y divide-tint">{s.sources.map((x) => <li key={x.id} className="flex items-center justify-between gap-3 p-4 font-bn text-sm"><span><b>{x.name}</b><span className="block text-xs text-muted">{sourceTypes[x.type]} · {x.district || "—"} · {x.relationship === "we_grow" ? "আমরা ফলাই" : "যাদের কাছ থেকে কিনি"}</span></span><Button size="sm" variant="outline" onClick={() => run(() => updateStore(a.id, (st) => ({ ...st, sources: st.sources.filter((y) => y.id !== x.id) })))}>মুছুন</Button></li>)}</ul>
          <form className="grid gap-3 border-t border-tint p-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (sf.name.trim().length < 2) { toast("উৎসের নাম দিন", "err"); return; } run(() => { updateStore(a.id, (st) => ({ ...st, sources: [...st.sources, { ...sf, id: crypto.randomUUID() }] })); setSf({ ...sf, name: "", description: "" }); }, "যোগ হয়েছে"); }}>
            <Field label="উৎসের নাম"><Input value={sf.name} onChange={(e) => setSf({ ...sf, name: e.target.value })} /></Field>
            <Field label="ধরন"><Select className="h-11 w-full" value={sf.type} onChange={(e) => setSf({ ...sf, type: e.target.value as Source["type"] })}>{Object.entries(sourceTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
            <Field label="জেলা"><Select className="h-11 w-full" value={sf.district} onChange={(e) => setSf({ ...sf, district: e.target.value })}><option value="">বাছুন</option>{districts.map((d) => <option key={d}>{d}</option>)}</Select></Field>
            <Field label="সম্পর্ক"><Select className="h-11 w-full" value={sf.relationship} onChange={(e) => setSf({ ...sf, relationship: e.target.value as Source["relationship"] })}><option value="we_grow">আমরা ফলাই / তৈরি করি</option><option value="we_buy_from">এদের কাছ থেকে কিনি</option></Select></Field>
            <div className="sm:col-span-2"><Button type="submit">উৎস যোগ করুন</Button></div>
          </form>
        </Panel>
        <Panel title="কীভাবে ফলানো বা তৈরি হয়">
          <div className="space-y-3 p-4"><textarea className="min-h-28 w-full rounded-md border border-line bg-white p-3 font-bn text-[15px]" value={prod ?? s.production} onChange={(e) => setProd(e.target.value)} />
            <p className="font-bn text-xs text-muted">এটি “বিক্রেতার নিজের বিবরণ” হিসেবে দেখানো হবে। জৈব, রাসায়নিকমুক্ত, ফরমালিনমুক্ত ইত্যাদি দাবি প্রমাণ ছাড়া লিখবেন না।</p>
            <Button onClick={() => run(() => updateStore(a.id, (st) => ({ ...st, production: prod ?? st.production })), "সংরক্ষিত")}>সংরক্ষণ</Button></div>
        </Panel>
      </div>}

      {tab === "updates" && <div className="space-y-5">
        <Panel title="নতুন আপডেট">
          <form className="space-y-3 p-4" onSubmit={(e) => { e.preventDefault(); if (!approved) { toast("অনুমোদনের পর আপডেট দিতে পারবেন", "err"); return; } run(() => { addPost(a.id, post); setPost({ kind: post.kind, title: "", body: "" }); }, "আপডেট প্রকাশিত"); }}>
            <Field label="ধরন"><Select className="h-11 w-full" value={post.kind} onChange={(e) => setPost({ ...post, kind: e.target.value as Post["kind"] })}>{Object.entries(postKinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
            <Field label="শিরোনাম"><Input value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} /></Field>
            <Field label="বিবরণ"><textarea className="min-h-24 w-full rounded-md border border-line bg-white p-3 font-bn text-[15px]" value={post.body} onChange={(e) => setPost({ ...post, body: e.target.value })} /></Field>
            <p className="font-bn text-xs text-muted">দিনে সর্বোচ্চ ৫টি। প্রিভিউতে ছবি যোগ করা যায় না। আপডেট শুধু আপনার দোকানের পাতায় দেখা যায়।</p>
            <Button type="submit" disabled={!approved}>প্রকাশ করুন</Button>
          </form>
        </Panel>
        <Panel title={`আপনার আপডেট (${bn(s.posts.length)})`}>{!s.posts.length ? <p className="p-4 font-bn text-sm text-muted">এখনো কোনো আপডেট নেই।</p> : <ul className="divide-y divide-tint">{s.posts.map((p) => <li key={p.id} className="p-4 font-bn text-sm"><span className="text-xs text-muted">{postKinds[p.kind]} · {new Date(p.at).toLocaleString("bn-BD")}</span><b className="block text-base">{p.title}</b>{p.body && <p>{p.body}</p>}</li>)}</ul>}</Panel>
      </div>}

      {tab === "orders" && <Panel title="অর্ডার"><div className="p-4"><EmptyState title="এখনো কোনো অর্ডার নেই" text="অর্ডার এলে এখানে ক্রেতার প্রথম নাম, এলাকা ও পণ্য দেখবেন। ফোন নম্বর ও ঠিকানা আপনি দেখবেন না, কারণ ডেলিভারি পসরাবাজার করে। আপনি পণ্য প্রস্তুত করে পসরাবাজারের হাতে তুলে দেবেন।" /></div></Panel>}
    </DashboardShell>
  );
}
