"use client";
import { useState } from "react";
import { Tabs } from "@/components/ui/misc";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/providers";
import { priceRows } from "@/data/prices";
import { taka } from "@/data/catalog";
import { cn } from "@/lib/utils";

const n = (v: string) => parseFloat(v) || 0;

function Profit() {
  const [f, setF] = useState({ land: "33", yield: "400", price: "32", cost: "9500" });
  const revenue = (n(f.land) / 33) * n(f.yield) * n(f.price); // land in shatak (33 = 1 bigha)
  const cost = n(f.cost) * n(f.land) / 33;
  const profit = revenue - cost;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="grid grid-cols-2 gap-4">
        <Field label="জমি (শতাংশ)"><Input inputMode="decimal" value={f.land} onChange={(e) => setF({ ...f, land: e.target.value })} /></Field>
        <Field label="ফলন (কেজি / বিঘা)"><Input inputMode="decimal" value={f.yield} onChange={(e) => setF({ ...f, yield: e.target.value })} /></Field>
        <Field label="বিক্রয়মূল্য (৳/কেজি)"><Input inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
        <Field label="খরচ (৳ / বিঘা)"><Input inputMode="decimal" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} /></Field>
      </div>
      <Result rows={[["আনুমানিক আয়", taka(Math.round(revenue))], ["মোট খরচ", taka(Math.round(cost))]]} total={["আনুমানিক মুনাফা", taka(Math.round(profit))]} good={profit >= 0} note="১ বিঘা = ৩৩ শতাংশ ধরা হয়েছে। এটি আনুমানিক হিসাব।" />
    </div>
  );
}
function Margin() {
  const [f, setF] = useState({ buy: "31", sell: "36", qty: "100", other: "400" });
  const profit = (n(f.sell) - n(f.buy)) * n(f.qty) - n(f.other);
  const pct = n(f.buy) * n(f.qty) ? (profit / (n(f.buy) * n(f.qty))) * 100 : 0;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="grid grid-cols-2 gap-4">
        <Field label="ক্রয় (৳/একক)"><Input inputMode="decimal" value={f.buy} onChange={(e) => setF({ ...f, buy: e.target.value })} /></Field>
        <Field label="বিক্রয় (৳/একক)"><Input inputMode="decimal" value={f.sell} onChange={(e) => setF({ ...f, sell: e.target.value })} /></Field>
        <Field label="পরিমাণ"><Input inputMode="decimal" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></Field>
        <Field label="অন্যান্য খরচ (৳)"><Input inputMode="decimal" value={f.other} onChange={(e) => setF({ ...f, other: e.target.value })} /></Field>
      </div>
      <Result rows={[["মোট ক্রয়", taka(Math.round(n(f.buy) * n(f.qty)))], ["মোট বিক্রয়", taka(Math.round(n(f.sell) * n(f.qty)))]]} total={["নিট মুনাফা", `${taka(Math.round(profit))} (${pct.toFixed(1)}%)`]} good={profit >= 0} />
    </div>
  );
}
function Alert() {
  const { toast } = useApp();
  const [f, setF] = useState({ product: priceRows[0].slug, dir: "below", price: "" });
  const cur = priceRows.find((r) => r.slug === f.product)!;
  return (
    <form className="grid max-w-xl gap-4 sm:grid-cols-3" noValidate onSubmit={(e) => { e.preventDefault(); if (!n(f.price)) { toast("লক্ষ্য দাম লিখুন", "err"); return; } toast(`অ্যালার্ট সেট (ডেমো): ${cur.bn} ${f.dir === "below" ? "≤" : "≥"} ${taka(n(f.price))} — বাস্তব বিজ্ঞপ্তি পাঠানো হবে না`, "info"); }}>
      <Field label="পণ্য"><Select className="h-11 w-full" value={f.product} onChange={(e) => setF({ ...f, product: e.target.value })}>{priceRows.map((r) => <option key={r.slug} value={r.slug}>{r.bn}</option>)}</Select></Field>
      <Field label="শর্ত"><Select className="h-11 w-full" value={f.dir} onChange={(e) => setF({ ...f, dir: e.target.value })}><option value="below">দাম কমলে</option><option value="above">দাম বাড়লে</option></Select></Field>
      <Field label={`লক্ষ্য দাম (এখন ${taka(cur.today)})`}><Input inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
      <Button type="submit" className="sm:col-span-3 sm:w-fit">অ্যালার্ট সেট করুন</Button>
    </form>
  );
}
function Calendar() {
  const months = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
  const crops: [string, number[], string][] = [["আলু", [7, 8, 9, 10], "bg-teal"], ["ফুলকপি", [6, 7, 8, 9], "bg-teal"], ["আম", [1, 2, 3], "bg-gold"], ["টমেটো", [8, 9, 10, 11], "bg-navy"], ["বোরো ধান", [9, 10, 11, 0, 1], "bg-gold"]];
  return (
    <div className="overflow-x-auto"><div className="min-w-[640px]"><div className="mb-2 grid grid-cols-[90px_repeat(12,1fr)] gap-1 text-center font-bn text-[11px] text-mist-500"><span />{months.map((m) => <span key={m}>{m}</span>)}</div>
      {crops.map(([c, ms, col]) => <div key={c} className="mb-1.5 grid grid-cols-[90px_repeat(12,1fr)] items-center gap-1"><span className="font-bn text-sm">{c}</span>{months.map((_, i) => <span key={i} className={cn("h-5 rounded-sm", ms.includes(i) ? col : "bg-mist")} />)}</div>)}
      <p className="mt-3 font-bn text-xs text-mist-500">ডেমো ক্যালেন্ডার — স্থানীয় আবহাওয়া ও জাতভেদে সময় বদলায়।</p></div></div>
  );
}
function Result({ rows, total, good, note }: { rows: string[][]; total: string[]; good: boolean; note?: string }) {
  return (
    <div className="rounded-md bg-navy p-5 text-white">
      {rows.map(([a, b]) => <div key={a} className="flex justify-between border-b border-white/15 py-2 font-bn text-sm"><span className="text-white/70">{a}</span><b className="tabular-nums">{b}</b></div>)}
      <div className="mt-3 flex items-baseline justify-between font-bn"><span>{total[0]}</span><b className={cn("text-2xl tabular-nums", good ? "text-gold" : "text-red-300")}>{total[1]}</b></div>
      {note && <p className="mt-3 text-xs text-white/55">{note}</p>}
    </div>
  );
}
export function Tools() {
  return <div className="glass rounded-md p-5"><Tabs tabs={[{ id: "p", label: "ফসল-মুনাফা", content: <Profit /> }, { id: "m", label: "ব্যবসার মার্জিন", content: <Margin /> }, { id: "a", label: "প্রাইস অ্যালার্ট", content: <Alert /> }, { id: "c", label: "ফসল ক্যালেন্ডার", content: <Calendar /> }]} /></div>;
}
