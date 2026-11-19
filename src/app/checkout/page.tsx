"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Banknote, Smartphone } from "lucide-react";
import { Field, Input } from "@/components/ui/form";
import { AreaSelect } from "@/components/AreaPicker";
import { Button, LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { useApp } from "@/components/providers";
import { resolve, totals } from "@/components/cartUtil";
import { taka } from "@/data/catalog";
import { FeeRow } from "@/components/FeeNote";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type Errs = Partial<Record<"name" | "phone" | "address" | "district", string>>;

export default function Checkout() {
  const { cart, hydrated, toast, clearCart, area } = useApp();
  const [f, setF] = useState({ name: "", phone: "", address: "", district: "", note: "" });
  const [loc, setLoc] = useState(area);
  useEffect(() => { setLoc(area); }, [area]);
  const [pay, setPay] = useState("cod");
  const [err, setErr] = useState<Errs>({});
  const [done, setDone] = useState(false);
  const t = totals(cart);

  const validate = () => {
    const e: Errs = {};
    if (f.name.trim().length < 3) e.name = "পূর্ণ নাম লিখুন (কমপক্ষে ৩ অক্ষর)";
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(f.phone.replace(/[\s-]/g, ""))) e.phone = "সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)";
    if (f.address.trim().length < 8) e.address = "বিস্তারিত ঠিকানা লিখুন";
    if (!loc.district) e.district = "বিভাগ ও জেলা নির্বাচন করুন";
    setErr(e); return !Object.keys(e).length;
  };
  const submit = (ev: React.FormEvent) => { ev.preventDefault(); if (!validate()) { toast("ফর্মের ভুলগুলো ঠিক করুন", "err"); return; } setDone(true); window.scrollTo({ top: 0, behavior: "smooth" }); };

  if (!hydrated) return <div className="container-x py-16" />;
  if (done) return (
    <div className="container-x max-w-2xl py-12">
      <div className="rounded-md border-2 border-gold bg-gold-50 p-6">
        <p className="flex items-center gap-2 font-bn text-lg text-gold-700"><ShieldAlert className="h-5 w-5" />ডেমো পর্যালোচনা — কোনো অর্ডার দেওয়া হয়নি</p>
        <p className="mt-2 font-bn text-[15px] text-ink/80">এটি প্রিভিউ সংস্করণ। কোনো অর্ডার তৈরি হয়নি, কোনো টাকা কাটা হয়নি এবং বিক্রেতাকে কিছু পাঠানো হয়নি। ব্যাকএন্ড সংযুক্ত হলে এই ধাপে বাস্তব অর্ডার তৈরি হবে।</p>
      </div>
      <div className="mt-6 glass rounded-md p-5 font-bn">
        <h2 className="text-lg">আপনার দেওয়া তথ্য</h2>
        <p className="mt-2 text-sm text-ink/75">{f.name} · {f.phone}<br />{f.address}, {loc.district}, {loc.division}<br />পেমেন্ট: ক্যাশ অন ডেলিভারি · মোট {taka(t.total)}</p>
      </div>
      <div className="mt-6 flex gap-3"><Button variant="outline" onClick={() => setDone(false)}>তথ্য সম্পাদনা</Button><Button onClick={() => { clearCart(); }}>ডেমো কার্ট খালি করুন</Button><LinkButton href="/" variant="ghost">হোম</LinkButton></div>
    </div>
  );
  if (!cart.length) return <div className="container-x py-12"><EmptyState title="চেকআউটের জন্য কার্ট খালি" action={<LinkButton href="/marketplace">পণ্য দেখুন</LinkButton>} /></div>;

  return (
    <div className="container-x py-8">
      <h1 className="font-bn text-3xl font-normal">চেকআউট</h1>
      <form onSubmit={submit} noValidate className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="glass rounded-md p-5">
            <h2 className="mb-4 font-bn text-xl">ডেলিভারি তথ্য</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="পূর্ণ নাম" error={err.name}><Input invalid={!!err.name} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></Field>
              <Field label="মোবাইল নম্বর" error={err.phone}><Input invalid={!!err.phone} inputMode="tel" placeholder="01XXXXXXXXX" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" /></Field>
              <div className="sm:col-span-2"><AreaSelect value={loc} onChange={setLoc} allLabel="নির্বাচন করুন" error={err.district} /></div>
              <Field label="বিস্তারিত ঠিকানা" error={err.address} className="sm:col-span-2"><Input invalid={!!err.address} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} autoComplete="street-address" /></Field>
              <Field label="বিক্রেতার জন্য নোট (ঐচ্ছিক)" className="sm:col-span-2"><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
            </div>
          </section>
          <section className="glass rounded-md p-5">
            <h2 className="mb-4 font-bn text-xl">পেমেন্ট পদ্ধতি</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[["cod", "ক্যাশ অন ডেলিভারি", Banknote, false], ["wallet", "ওয়ালেট", Wallet, true], ["bkash", "bKash", Smartphone, true], ["nagad", "Nagad", Smartphone, true]].map(([id, label, I, off]) => { const Icon = I as typeof Banknote; return (
                <label key={id as string} className={cn("flex items-center gap-3 rounded-md border p-3 font-bn", off ? "cursor-not-allowed opacity-50" : "cursor-pointer", pay === id ? "border-teal bg-teal-50" : "border-mist-300")}>
                  <input type="radio" name="pay" disabled={off as boolean} checked={pay === id} onChange={() => setPay(id as string)} className="accent-teal" />
                  <Icon className="h-4 w-4 text-teal" /><span className="text-sm">{label as string}{off ? <span className="block text-[10px] text-mist-500">শীঘ্রই (গেটওয়ে যুক্ত হয়নি)</span> : null}</span>
                </label>); })}
            </div>
          </section>
        </div>
        <aside className="h-fit glass rounded-md p-5 lg:sticky lg:top-32">
          <h2 className="font-bn text-xl">আপনার অর্ডার</h2>
          <ul className="mt-3 divide-y divide-mist text-sm">{cart.map((l) => { const r = resolve(l); return <li key={l.productSlug + l.sellerSlug + l.mode} className="flex justify-between gap-3 py-2 font-bn"><span>{r.p.bn} × {l.qty}<span className="block text-xs text-mist-500">{r.s.bn}</span></span><b className="tabular-nums">{taka(r.total)}</b></li>; })}</ul>
          <div className="mt-3"><FeeRow fee={t.fee} buyerPays={t.buyerFee} /></div>
          <dl className="mt-3 space-y-1.5 border-t border-mist pt-3 font-bn text-sm"><div className="flex justify-between"><dt>ডেলিভারি</dt><dd>{taka(t.delivery)}</dd></div><div className="flex justify-between text-lg font-bold text-navy"><dt>মোট</dt><dd>{taka(t.total)}</dd></div></dl>
          <Button type="submit" size="lg" className="mt-5 w-full">তথ্য যাচাই করুন (ডেমো)</Button>
          <p className="mt-3 font-bn text-xs text-mist-500">এই বোতাম কোনো অর্ডার বা পেমেন্ট সম্পন্ন করে না। <Link href="/cart" className="text-teal underline">কার্টে ফিরুন</Link></p>
        </aside>
      </form>
    </div>
  );
}
