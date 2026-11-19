"use client";
import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers";

export function DemoForm({ product }: { product: string }) {
  const { toast } = useApp();
  const [f, setF] = useState({ name: "", phone: "", biz: "", size: "" });
  const [e, setE] = useState<Record<string, string>>({});
  return (
    <form noValidate className="space-y-4" onSubmit={(ev) => {
      ev.preventDefault(); const er: Record<string, string> = {};
      if (f.name.trim().length < 3) er.name = "নাম দিন";
      if (!/^(\+?88)?01[3-9]\d{8}$/.test(f.phone.replace(/[\s-]/g, ""))) er.phone = "সঠিক মোবাইল নম্বর দিন";
      if (!f.biz.trim()) er.biz = "ব্যবসার নাম দিন";
      setE(er); if (Object.keys(er).length) { toast("ফর্মে ভুল আছে", "err"); return; }
      toast(`${product} ডেমো অনুরোধ যাচাই হয়েছে — প্রিভিউ সংস্করণে কিছু পাঠানো হয়নি`, "info");
    }}>
      <Field label="আপনার নাম" error={e.name}><Input invalid={!!e.name} value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} /></Field>
      <Field label="মোবাইল" error={e.phone}><Input invalid={!!e.phone} inputMode="tel" value={f.phone} onChange={(x) => setF({ ...f, phone: x.target.value })} /></Field>
      <Field label="ব্যবসার নাম" error={e.biz}><Input invalid={!!e.biz} value={f.biz} onChange={(x) => setF({ ...f, biz: x.target.value })} /></Field>
      <Field label="ব্যবসার আকার"><Select className="h-11 w-full" value={f.size} onChange={(x) => setF({ ...f, size: x.target.value })}><option value="">নির্বাচন করুন</option><option>ছোট (১–৩ জন)</option><option>মাঝারি (৪–২০ জন)</option><option>বড় (২০+)</option></Select></Field>
      <Button type="submit" size="lg" variant="navy" className="w-full">ডেমো অনুরোধ করুন</Button>
    </form>
  );
}
