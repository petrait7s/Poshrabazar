"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field, Input, Select } from "./ui/form";
import { Button } from "./ui/button";
import { Logo } from "./Logo";
import { useApp, type DemoUser } from "./providers";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, toast } = useApp();
  const router = useRouter();
  const [f, setF] = useState({ name: "", phone: "", password: "", role: "buyer" });
  const [e, setE] = useState<Record<string, string>>({});
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const er: Record<string, string> = {};
    if (mode === "register" && f.name.trim().length < 3) er.name = "নাম কমপক্ষে ৩ অক্ষর";
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(f.phone.replace(/[\s-]/g, ""))) er.phone = "সঠিক মোবাইল নম্বর দিন";
    if (f.password.length < 6) er.password = "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর";
    setE(er);
    if (Object.keys(er).length) { toast("ফর্মে ভুল আছে", "err"); return; }
    const u: DemoUser = { name: f.name.trim() || "ডেমো ব্যবহারকারী", phone: f.phone, role: f.role as DemoUser["role"] };
    login(u); toast(mode === "login" ? "ডেমো লগইন সম্পন্ন (কোনো সার্ভার যাচাই নয়)" : "ডেমো অ্যাকাউন্ট তৈরি (শুধু এই ব্রাউজারে)", "info");
    router.push(u.role === "seller" ? "/seller/dashboard" : "/account");
  };
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-10">
      <form onSubmit={submit} noValidate className="w-full max-w-md surface rounded-md p-6 shadow-card sm:p-8">
        <Logo />
        <h1 className="mt-6 font-bn text-2xl font-semibold">{mode === "login" ? "লগইন করুন" : "নতুন অ্যাকাউন্ট খুলুন"}</h1>
        <p className="mt-1 font-bn text-sm text-ink/60">{mode === "login" ? "মোবাইল নম্বর ও পাসওয়ার্ড দিন।" : "ক্রেতা বা বিক্রেতা হিসেবে যোগ দিন।"}</p>
        <div className="mt-5 space-y-4">
          {mode === "register" && <Field label="পূর্ণ নাম" error={e.name}><Input invalid={!!e.name} value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} autoComplete="name" /></Field>}
          <Field label="মোবাইল নম্বর" error={e.phone}><Input invalid={!!e.phone} inputMode="tel" placeholder="01XXXXXXXXX" value={f.phone} onChange={(x) => setF({ ...f, phone: x.target.value })} autoComplete="tel" /></Field>
          <Field label="পাসওয়ার্ড" error={e.password}><Input invalid={!!e.password} type="password" value={f.password} onChange={(x) => setF({ ...f, password: x.target.value })} autoComplete={mode === "login" ? "current-password" : "new-password"} /></Field>
          {mode === "register" && <Field label="আমি যোগ দিচ্ছি"><Select className="h-11 w-full" value={f.role} onChange={(x) => setF({ ...f, role: x.target.value })}><option value="buyer">ক্রেতা হিসেবে</option><option value="seller">বিক্রেতা হিসেবে</option></Select></Field>}
        </div>
        <Button type="submit" size="lg" className="mt-6 w-full">{mode === "login" ? "লগইন" : "অ্যাকাউন্ট খুলুন"}</Button>
        <p className="mt-4 text-center font-bn text-sm text-ink/70">{mode === "login" ? <>নতুন? <Link href="/register" className="text-primary underline">নিবন্ধন করুন</Link></> : <>অ্যাকাউন্ট আছে? <Link href="/login" className="text-primary underline">লগইন</Link></>}</p>
        <p className="mt-5 rounded bg-accent-50 px-3 py-2 font-bn text-xs text-accent-700">ডেমো ফর্ম: কোনো তথ্য সার্ভারে যায় না; শুধু আপনার ব্রাউজারে থাকে।</p>
      </form>
    </div>
  );
}
