"use client";
import { useState } from "react";
import { Check, ShieldAlert } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/form";
import { Button, LinkButton } from "@/components/ui/button";
import { PillarHero } from "@/components/PillarHero";
import { useApp } from "@/components/providers";
import { categories } from "@/data/catalog";
import { cn } from "@/lib/utils";

const kinds = ["কৃষক", "খামারি", "পাইকার", "আড়তদার", "দোকানদার"];
const steps = ["ব্যবসার ধরন", "যোগাযোগ ও ঠিকানা", "পণ্য ও যাচাই"];

export default function Page() {
  const { toast } = useApp();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ kind: "", biz: "", name: "", phone: "", district: "", address: "", cats: [] as string[], nid: false, terms: false });
  const [e, setE] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const check = (s: number) => {
    const er: Record<string, string> = {};
    if (s === 0) { if (!f.kind) er.kind = "ধরন নির্বাচন করুন"; if (f.biz.trim().length < 3) er.biz = "ব্যবসা/খামারের নাম দিন"; }
    if (s === 1) { if (f.name.trim().length < 3) er.name = "মালিকের নাম দিন"; if (!/^(\+?88)?01[3-9]\d{8}$/.test(f.phone.replace(/[\s-]/g, ""))) er.phone = "সঠিক মোবাইল নম্বর দিন"; if (!f.district.trim()) er.district = "জেলা লিখুন"; if (f.address.trim().length < 6) er.address = "ঠিকানা লিখুন"; }
    if (s === 2) { if (!f.cats.length) er.cats = "কমপক্ষে একটি ক্যাটাগরি বেছে নিন"; if (!f.terms) er.terms = "শর্তে সম্মতি দিন"; }
    setE(er); return !Object.keys(er).length;
  };
  const next = () => { if (!check(step)) { toast("ফর্মের ভুলগুলো ঠিক করুন", "err"); return; } if (step < 2) setStep(step + 1); else setDone(true); };

  return (
    <>
      <PillarHero pillar="marketplace" crumbs={[{ label: "হোম", href: "/" }, { label: "বিক্রেতা নিবন্ধন" }]} title="বিক্রেতা হিসেবে যোগ দিন" sub="কৃষক, খামারি, পাইকার, আড়তদার বা দোকানদার — সাথী এজেন্ট আপনাকে যাচাই ও অনবোর্ড করতে সাহায্য করবে।" />
      <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_340px]">
        {done ? (
          <div className="rounded-md border-2 border-gold bg-gold-50 p-6">
            <p className="flex items-center gap-2 font-bn text-lg text-gold-700"><ShieldAlert className="h-5 w-5" />ডেমো — আবেদন জমা হয়নি</p>
            <p className="mt-2 font-bn text-[15px]">ফর্মটি সফলভাবে যাচাই হয়েছে, তবে এটি প্রিভিউ সংস্করণ — কোনো তথ্য সার্ভারে পাঠানো বা সংরক্ষণ হয়নি।</p>
            <div className="mt-5 flex gap-3"><LinkButton href="/seller/dashboard">ডেমো ড্যাশবোর্ড দেখুন</LinkButton><Button variant="outline" onClick={() => { setDone(false); setStep(0); }}>আবার শুরু</Button></div>
          </div>
        ) : (
          <form onSubmit={(ev) => { ev.preventDefault(); next(); }} noValidate className="rounded-md border border-mist-300 bg-white p-5 sm:p-7">
            <ol className="mb-7 grid grid-cols-3 gap-2">{steps.map((s, i) => <li key={s} className={cn("border-t-4 pt-2 font-bn text-xs sm:text-sm", i <= step ? "border-teal text-navy" : "border-mist text-mist-500")}><span className="text-[10px] font-semibold">ধাপ {i + 1}</span><br />{s}</li>)}</ol>
            {step === 0 && <div className="space-y-4">
              <Field label="আপনি কে?" error={e.kind}><div className="flex flex-wrap gap-2">{kinds.map((k) => <button type="button" key={k} onClick={() => setF({ ...f, kind: k })} aria-pressed={f.kind === k} className={cn("rounded-md border px-4 py-2 font-bn text-sm", f.kind === k ? "border-teal bg-teal-50 text-teal-700" : "border-mist-300 hover:border-navy")}>{k}</button>)}</div></Field>
              <Field label="ব্যবসা / খামারের নাম" error={e.biz}><Input invalid={!!e.biz} value={f.biz} onChange={(x) => setF({ ...f, biz: x.target.value })} /></Field></div>}
            {step === 1 && <div className="grid gap-4 sm:grid-cols-2">
              <Field label="মালিকের নাম" error={e.name}><Input invalid={!!e.name} value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} /></Field>
              <Field label="মোবাইল নম্বর" error={e.phone}><Input invalid={!!e.phone} inputMode="tel" value={f.phone} onChange={(x) => setF({ ...f, phone: x.target.value })} /></Field>
              <Field label="জেলা" error={e.district}><Input invalid={!!e.district} value={f.district} onChange={(x) => setF({ ...f, district: x.target.value })} /></Field>
              <Field label="ঠিকানা" error={e.address}><Input invalid={!!e.address} value={f.address} onChange={(x) => setF({ ...f, address: x.target.value })} /></Field></div>}
            {step === 2 && <div className="space-y-4">
              <Field label="কোন ক্যাটাগরিতে বিক্রি করবেন?" error={e.cats}><div className="flex flex-wrap gap-2">{categories.map((c) => { const on = f.cats.includes(c.slug); return <button type="button" key={c.slug} aria-pressed={on} onClick={() => setF({ ...f, cats: on ? f.cats.filter((x) => x !== c.slug) : [...f.cats, c.slug] })} className={cn("inline-flex items-center gap-1 rounded-md border px-3 py-2 font-bn text-sm", on ? "border-teal bg-teal-50 text-teal-700" : "border-mist-300")}>{on && <Check className="h-3.5 w-3.5" />}{c.bn}</button>; })}</div></Field>
              <label className="flex items-start gap-2 font-bn text-sm"><input type="checkbox" className="mt-1 accent-teal" checked={f.nid} onChange={(x) => setF({ ...f, nid: x.target.checked })} />সাথী এজেন্ট দিয়ে যাচাইয়ের জন্য যোগাযোগ চাই</label>
              <label className="flex items-start gap-2 font-bn text-sm"><input type="checkbox" className="mt-1 accent-teal" checked={f.terms} onChange={(x) => setF({ ...f, terms: x.target.checked })} />আমি বিক্রেতার শর্তাবলিতে সম্মত{e.terms && <span className="ml-2 text-xs text-red-600">{e.terms}</span>}</label></div>}
            <div className="mt-7 flex justify-between"><Button type="button" variant="ghost" disabled={!step} onClick={() => setStep(step - 1)}>পিছনে</Button><Button type="submit">{step < 2 ? "পরবর্তী" : "আবেদন যাচাই করুন (ডেমো)"}</Button></div>
          </form>
        )}
        <aside className="space-y-3">
          {[["বিনামূল্যে Khata Lite", "প্রতিটি বিক্রেতার জন্য সহজ হিসাব-খাতা।"], ["কমিশন", "খুচরা ২–৫%, পাইকারি ১–২%।"], ["সাথী এজেন্ট", "ক্রেতা আসার আগে বিক্রেতা যাচাই ও অনবোর্ডিং।"], ["র‍্যাংক", "একই পণ্যের বিক্রেতাদের মধ্যে আপনার অবস্থান দেখুন।"]].map(([t, d]) => <div key={t} className="rounded-md border border-mist-300 bg-white p-4"><h3 className="font-bn text-lg">{t}</h3><p className="mt-1 font-bn text-sm text-ink/65">{d}</p></div>)}
        </aside>
      </div>
    </>
  );
}
