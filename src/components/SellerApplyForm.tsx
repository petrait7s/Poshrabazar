"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field, Input, Select } from "./ui/form";
import { Button, LinkButton } from "./ui/button";
import { useApp } from "./providers";
import { categories } from "@/data/catalog";
import { divisions, upazilas } from "@/data/locations";
import { docKinds, evidenceFor, sellerTypes, submitApplication, validateDraft, type Doc, type DocKind, type Draft, type SellerType } from "@/lib/applications";
import { cn } from "@/lib/utils";

const steps = ["আপনি কে", "কোথায়", "কী বিক্রি করবেন", "প্রমাণ", "সম্মতি"];
const districts = divisions.flatMap((d) => d.districts);
const blank: Draft = { sellerType: "individual", fullName: "", phone: "", email: "", district: "সিলেট", upazila: "", address: "", goodsLocation: "", storeNameBn: "", storeNameEn: "", description: "", categories: [], originStory: "", docs: [], agreeTerms: false, agreeDelivery: false };

export function SellerApplyForm() {
  const { user, toast } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(blank);
  const [err, setErr] = useState<Record<string, string>>({});
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  if (!user) return (
    <div className="surface rounded-md p-6 font-bn">
      <h2 className="text-xl">আগে অ্যাকাউন্ট খুলুন</h2>
      <p className="mt-1 text-sm text-ink/70">যে কেউ প্রথমে ক্রেতা হিসেবে নিবন্ধন করে, তারপর বিক্রেতা হওয়ার আবেদন করতে পারেন।</p>
      <div className="mt-4 flex gap-3"><LinkButton href="/register">নিবন্ধন</LinkButton><LinkButton href="/login" variant="outline">লগইন</LinkButton></div>
    </div>
  );

  const ev = evidenceFor[d.sellerType];
  const kinds: DocKind[] = [...ev.required, ...(ev.anyOf ?? []), ...ev.optional.filter((k) => !ev.anyOf?.includes(k))];
  const addDoc = (kind: DocKind, f?: File) => { if (!f) return; const docs: Doc[] = [...d.docs.filter((x) => x.kind !== kind), { kind, name: f.name }]; set("docs", docs); };
  const stepErr = (s: number) => {
    const all = validateDraft(d); const keys = [["fullName", "phone"], ["district", "address"], ["storeNameBn", "categories"], ["docs"], ["agree"]][s];
    return Object.fromEntries(keys.filter((k) => all[k]).map((k) => [k, all[k]]));
  };
  const next = () => { const e = stepErr(step); setErr(e); if (Object.keys(e).length) { toast("ফর্মে ভুল আছে", "err"); return; } setStep(step + 1); window.scrollTo({ top: 0 }); };
  const submit = () => {
    const e = stepErr(4); setErr(e); if (Object.keys(e).length) return;
    try { submitApplication(user.phone, d); toast("আবেদন জমা হয়েছে (প্রিভিউ: শুধু এই ব্রাউজারে)", "ok"); router.push("/become-a-seller/status"); }
    catch (x) { toast((x as Error).message, "err"); }
  };
  const ups = upazilas[d.district];

  return (
    <div className="surface rounded-md p-5 sm:p-7">
      <ol className="mb-6 flex gap-1" aria-label="ধাপ">
        {steps.map((s, i) => <li key={s} aria-current={i === step ? "step" : undefined} className={cn("flex-1 border-t-2 pt-2 font-bn text-xs", i <= step ? "border-primary text-ink" : "border-line text-muted")}>{i + 1}. {s}</li>)}
      </ol>

      {step === 0 && <div className="space-y-4">
        <fieldset><legend className="mb-2 font-bn text-sm font-semibold">বিক্রেতার ধরন</legend>
          <div className="grid gap-2 sm:grid-cols-2">{sellerTypes.map((t) => (
            <label key={t.key} className={cn("cursor-pointer rounded-md border p-3 font-bn", d.sellerType === t.key ? "border-primary bg-primary-50" : "border-line")}>
              <input type="radio" name="st" className="sr-only" checked={d.sellerType === t.key} onChange={() => set("sellerType", t.key as SellerType)} />
              <b className="block text-[15px]">{t.bn}</b><span className="text-xs text-muted">{t.hint}</span>
            </label>))}</div>
        </fieldset>
        <Field label="পূর্ণ নাম" error={err.fullName}><Input invalid={!!err.fullName} value={d.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" /></Field>
        <Field label="মোবাইল নম্বর" error={err.phone}><Input invalid={!!err.phone} inputMode="tel" placeholder="01XXXXXXXXX" value={d.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" /></Field>
        <Field label="ইমেইল (ঐচ্ছিক)"><Input type="email" value={d.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" /></Field>
      </div>}

      {step === 1 && <div className="space-y-4">
        <Field label="জেলা" error={err.district}><Select className="h-11 w-full" value={d.district} onChange={(e) => { set("district", e.target.value); set("upazila", ""); }}>{districts.map((x) => <option key={x}>{x}</option>)}</Select></Field>
        <Field label="উপজেলা">{ups
          ? <Select className="h-11 w-full" value={d.upazila} onChange={(e) => set("upazila", e.target.value)}><option value="">বাছুন</option>{ups.map((u) => <option key={u.bn}>{u.bn}</option>)}</Select>
          : <Input value={d.upazila} onChange={(e) => set("upazila", e.target.value)} />}</Field>
        <Field label="ঠিকানা" error={err.address}><Input invalid={!!err.address} value={d.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" /></Field>
        <Field label="পণ্য কোথায় রাখেন" hint="খামার, গুদাম বা দোকান। এটি ক্রেতাকে দেখানো হয় না।"><Input value={d.goodsLocation} onChange={(e) => set("goodsLocation", e.target.value)} /></Field>
      </div>}

      {step === 2 && <div className="space-y-4">
        <Field label="দোকানের নাম (বাংলা)" error={err.storeNameBn}><Input invalid={!!err.storeNameBn} value={d.storeNameBn} onChange={(e) => set("storeNameBn", e.target.value)} /></Field>
        <Field label="দোকানের নাম (ইংরেজি, ঐচ্ছিক)"><Input value={d.storeNameEn} onChange={(e) => set("storeNameEn", e.target.value)} /></Field>
        <Field label="দোকান সম্পর্কে সংক্ষেপে"><Input value={d.description} onChange={(e) => set("description", e.target.value)} /></Field>
        <fieldset><legend className="mb-2 font-bn text-sm font-semibold">কোন ক্যাটাগরির পণ্য বিক্রি করবেন</legend>
          <div className="flex flex-wrap gap-2">{categories.map((c) => { const on = d.categories.includes(c.slug); return (
            <button key={c.slug} type="button" aria-pressed={on} onClick={() => set("categories", on ? d.categories.filter((x) => x !== c.slug) : [...d.categories, c.slug])} className={cn("h-9 rounded-full border px-3 font-bn text-sm", on ? "border-ink bg-ink text-white" : "border-line bg-surface")}>{c.bn}</button>); })}</div>
          {err.categories && <p className="mt-1 font-bn text-xs text-red-700">{err.categories}</p>}
        </fieldset>
        <Field label="পণ্য কোথা থেকে আসে, কীভাবে তৈরি হয়" hint="আপনার নিজের বিবরণ হিসেবে দোকানের পাতায় দেখানো হবে। জৈব, ফরমালিনমুক্ত ইত্যাদি দাবি প্রমাণ ছাড়া লিখবেন না।"><textarea className="min-h-24 w-full rounded-md border border-line bg-white p-3 font-bn text-[15px]" value={d.originStory} onChange={(e) => set("originStory", e.target.value)} /></Field>
      </div>}

      {step === 3 && <div className="space-y-4">
        <p className="rounded-md border border-accent/40 bg-accent-50 px-3 py-2 font-bn text-sm text-accent-700">প্রিভিউ সংস্করণ: ফাইল সার্ভারে যায় না, শুধু ফাইলের নাম এই ব্রাউজারে থাকে। আসল সংস্করণে পরিচয়পত্র একটি ব্যক্তিগত স্টোরেজে যাবে, যা শুধু আপনি ও অ্যাডমিন দেখতে পাবেন।</p>
        {kinds.map((k) => { const need = ev.required.includes(k); const got = d.docs.find((x) => x.kind === k); return (
          <Field key={k} label={`${docKinds[k]}${need ? " (আবশ্যক)" : ev.anyOf?.includes(k) ? " (এর একটি আবশ্যক)" : " (ঐচ্ছিক)"}`}>
            <input type="file" accept="image/*,.pdf" onChange={(e) => addDoc(k, e.target.files?.[0])} className="block w-full font-bn text-sm" />
            {got && <p className="mt-1 font-bn text-xs text-primary-700">নির্বাচিত: {got.name}</p>}
          </Field>); })}
        {err.docs && <p className="font-bn text-sm text-red-700">{err.docs}</p>}
      </div>}

      {step === 4 && <div className="space-y-4 font-bn text-[15px]">
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={d.agreeTerms} onChange={(e) => set("agreeTerms", e.target.checked)} /><span>আমি বিক্রেতার শর্ত ও পণ্য নীতি পড়েছি ও মানব। <span className="text-xs text-muted">(শর্তের চূড়ান্ত লেখা এখনো প্রস্তুত নয়)</span></span></label>
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={d.agreeDelivery} onChange={(e) => set("agreeDelivery", e.target.checked)} /><span>আমি জানি ডেলিভারি করে পসরাবাজার; অর্ডারের পণ্য আমি পসরাবাজারের হাতে তুলে দেব।</span></label>
        {err.agree && <p className="text-sm text-red-700">{err.agree}</p>}
        <p className="rounded-md bg-tint px-3 py-2 text-sm text-ink/80">জমা দিলে অ্যাডমিন আপনার তথ্য ও প্রমাণ যাচাই করবেন। অনুমোদনের আগে দোকান ও পণ্য সবার কাছে দেখা যাবে না।</p>
      </div>}

      <div className="mt-7 flex justify-between gap-3">
        {step > 0 ? <Button variant="outline" onClick={() => setStep(step - 1)}>পিছনে</Button> : <Link href="/stores" className="inline-flex h-11 items-center font-bn text-sm text-muted">বাতিল</Link>}
        {step < 4 ? <Button onClick={next}>পরের ধাপ</Button> : <Button onClick={submit}>আবেদন জমা দিন</Button>}
      </div>
    </div>
  );
}
