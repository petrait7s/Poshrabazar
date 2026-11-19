"use client";
import { useState } from "react";
import { BarChart3, Boxes, LayoutDashboard, ListChecks, PackageSearch, Tag, Plus, Wallet } from "lucide-react";
import { saleRows } from "@/data/wallet";
import { FEE, feeRateLabel, payerLabel } from "@/data/fees";
import { DashboardShell, Panel, Stat, StatusPill } from "@/components/DashboardShell";
import { BarChart } from "@/components/Viz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useApp } from "@/components/providers";
import { products, taka, bn, offersFor } from "@/data/catalog";

const me = "dhaka-fresh-trade";
const initial = products.filter((p) => offersFor(p).some((o) => o.sellerSlug === me)).map((p) => { const o = offersFor(p).find((x) => x.sellerSlug === me)!; return { slug: p.slug, name: p.bn, unit: p.unit, retail: o.retail, wholesale: o.wholesale, stock: o.stock, active: true }; });
const initOrders = [
  { id: "PB-DEMO-2210", who: "আরিফ হোসেন", item: "আলু × ৫০ কেজি", amt: 1550, st: "নতুন" }, { id: "PB-DEMO-2209", who: "রহমান স্টোর", item: "পেঁয়াজ × ৮০ কেজি", amt: 4320, st: "প্রস্তুত" },
  { id: "PB-DEMO-2204", who: "সুমি আক্তার", item: "ডিম × ২ ডজন", amt: 330, st: "পথে" }, { id: "PB-DEMO-2198", who: "ঢাকা মুদি ভাণ্ডার", item: "সরিষার তেল × ২০ লিটার", amt: 4700, st: "সম্পন্ন" },
];
const flow = ["নতুন", "প্রস্তুত", "পথে", "সম্পন্ন"];

export default function Page() {
  const { toast } = useApp();
  const [tab, setTab] = useState("overview");
  const [list, setList] = useState(initial);
  const [orders, setOrders] = useState(initOrders);
  const nav = [{ id: "overview", label: "ওভারভিউ", icon: LayoutDashboard }, { id: "listings", label: "পণ্য তালিকা", icon: ListChecks }, { id: "prices", label: "দাম হালনাগাদ", icon: Tag }, { id: "inventory", label: "ইনভেন্টরি", icon: Boxes }, { id: "orders", label: "অর্ডার", icon: PackageSearch, badge: orders.filter((o) => o.st === "নতুন").length }, { id: "sales", label: "বিক্রয় সারসংক্ষেপ", icon: BarChart3 }, { id: "wallet", label: "ওয়ালেট ও ফি", icon: Wallet }];
  const upd = (slug: string, patch: Partial<(typeof initial)[0]>) => setList((l) => l.map((x) => (x.slug === slug ? { ...x, ...patch } : x)));
  const num = (v: string) => Math.max(0, parseInt(v.replace(/\D/g, ""), 10) || 0);

  return (
    <DashboardShell title="বিক্রেতা ড্যাশবোর্ড" sub="ঢাকা ফ্রেশ ট্রেড (ডেমো অ্যাকাউন্ট)" nav={nav} active={tab} onChange={setTab} actions={<Button size="sm" onClick={() => toast("নতুন পণ্য যোগ — শীঘ্রই", "info")}><Plus className="h-4 w-4" />নতুন পণ্য</Button>}>
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="এই মাসের বিক্রি" value="৳৪,২৮,৫০০" delta="+১২%" hint="গত মাসের তুলনায়" /><Stat label="অর্ডার" value={bn(orders.length * 31)} delta="+৮%" /><Stat label="সক্রিয় পণ্য" value={bn(list.filter((l) => l.active).length)} /><Stat label="গড় রেটিং" value="৪.৫" hint="১২৮ রিভিউ" /></div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="সাপ্তাহিক বিক্রি (হাজার ৳)"><BarChart data={[42, 58, 51, 73, 66, 89, 61]} labels={["শনি", "রবি", "সোম", "মঙ্গ", "বুধ", "বৃহ", "শুক্র"]} /></Panel>
            <Panel title="সাম্প্রতিক অর্ডার" action={<button onClick={() => setTab("orders")} className="font-bn text-sm text-teal">সব</button>}>
              <ul className="divide-y divide-mist">{orders.slice(0, 4).map((o) => <li key={o.id} className="flex items-center justify-between py-2.5 font-bn text-sm"><span>{o.who}<span className="block text-xs text-mist-500">{o.item}</span></span><span className="flex items-center gap-3"><b className="tabular-nums">{taka(o.amt)}</b><StatusPill s={o.st} /></span></li>)}</ul>
            </Panel>
          </div>
          <Panel title="পণ্যে আপনার র‍্যাংক (ডেমো)"><ul className="grid gap-2 sm:grid-cols-3">{list.slice(0, 3).map((l, i) => <li key={l.slug} className="rounded border border-mist-300 p-3 font-bn text-sm">{l.name}<b className="block text-xl text-navy">#{bn(i + 1)} <span className="text-xs font-normal text-mist-500">/ ৪ জন বিক্রেতা</span></b></li>)}</ul></Panel>
        </div>
      )}
      {tab === "listings" && (
        <Panel title="পণ্য তালিকা"><div className="overflow-x-auto"><table className="tbl w-full min-w-[560px]"><thead><tr><th>পণ্য</th><th>খুচরা</th><th>পাইকারি</th><th>স্টক</th><th>স্ট্যাটাস</th><th /></tr></thead><tbody>{list.map((l) => <tr key={l.slug}><td className="font-bn text-[15px]">{l.name}</td><td className="tabular-nums">{taka(l.retail)}/{l.unit}</td><td className="tabular-nums">{taka(l.wholesale)}/{l.unit}</td><td className="font-bn tabular-nums">{bn(l.stock)}</td><td><StatusPill s={l.active ? "সক্রিয়" : "বিরতি"} /></td><td className="text-right"><Button size="sm" variant="outline" onClick={() => { upd(l.slug, { active: !l.active }); toast(l.active ? `${l.name} বিরতিতে` : `${l.name} সক্রিয়`, "info"); }}>{l.active ? "বিরতি" : "সক্রিয়"}</Button></td></tr>)}</tbody></table></div></Panel>
      )}
      {tab === "prices" && (
        <Panel title="দৈনিক দাম হালনাগাদ" action={<Button size="sm" onClick={() => toast("দাম হালনাগাদ হয়েছে (ডেমো, সংরক্ষিত নয়)")}>সংরক্ষণ</Button>}>
          <div className="grid gap-3 md:grid-cols-2">{list.map((l) => <div key={l.slug} className="rounded-md border border-mist-300 p-3"><p className="font-bn text-navy">{l.name} <span className="text-xs text-mist-500">/{l.unit}</span></p><div className="mt-2 grid grid-cols-2 gap-2"><label className="font-bn text-xs text-ink/60">খুচরা ৳<Input inputMode="numeric" value={l.retail} onChange={(e) => upd(l.slug, { retail: num(e.target.value) })} /></label><label className="font-bn text-xs text-ink/60">পাইকারি ৳<Input inputMode="numeric" value={l.wholesale} onChange={(e) => upd(l.slug, { wholesale: num(e.target.value) })} /></label></div></div>)}</div>
        </Panel>
      )}
      {tab === "inventory" && (
        <Panel title="ইনভেন্টরি"><ul className="divide-y divide-mist">{list.map((l) => <li key={l.slug} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0 flex-1"><p className="font-bn">{l.name}</p><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist"><div className={l.stock < 150 ? "h-full bg-red-500" : "h-full bg-teal"} style={{ width: `${Math.min(100, l.stock / 10)}%` }} /></div>{l.stock < 150 && <p className="mt-1 font-bn text-xs text-red-600">স্টক কম</p>}</div><div className="flex items-center gap-1"><Button size="icon" variant="outline" onClick={() => upd(l.slug, { stock: Math.max(0, l.stock - 10) })} aria-label="-10">−</Button><span className="w-16 text-center font-semibold tabular-nums">{l.stock}</span><Button size="icon" variant="outline" onClick={() => upd(l.slug, { stock: l.stock + 10 })} aria-label="+10">+</Button></div></li>)}</ul></Panel>
      )}
      {tab === "orders" && (
        <Panel title="অর্ডার"><div className="overflow-x-auto"><table className="tbl w-full min-w-[520px]"><thead><tr><th>অর্ডার</th><th>ক্রেতা</th><th>পণ্য</th><th>মোট</th><th>স্ট্যাটাস</th><th /></tr></thead><tbody>{orders.map((o) => <tr key={o.id}><td className="text-xs">{o.id}</td><td className="font-bn">{o.who}</td><td className="font-bn">{o.item}</td><td className="tabular-nums">{taka(o.amt)}</td><td><StatusPill s={o.st} /></td><td className="text-right">{o.st !== "সম্পন্ন" && <Button size="sm" onClick={() => { const n = flow[flow.indexOf(o.st) + 1]; setOrders(orders.map((x) => (x.id === o.id ? { ...x, st: n } : x))); toast(`অবস্থা: ${n}`); }}>পরবর্তী ধাপ</Button>}</td></tr>)}</tbody></table></div></Panel>
      )}
      {tab === "sales" && (
        <div className="space-y-5"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="আজকের বিক্রি" value="৳৬১,২০০" /><Stat label="সাপ্তাহিক" value="৳৪,৪০,০০০" /><Stat label="গড় অর্ডার মূল্য" value="৳১,৩৮০" /><Stat label="ফেরত হার" value="১.৮%" /></div>
          <Panel title="মাসিক বিক্রি (লাখ ৳)"><BarChart height={200} data={[2.1, 2.6, 3.0, 2.8, 3.6, 4.3]} labels={["জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে"]} /></Panel></div>
      )}
      {tab === "wallet" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="মোট বিক্রয়" value={taka(saleRows.reduce((a, r) => a + r.gross, 0))} /><Stat label="প্ল্যাটফর্ম ফি" value={taka(Math.round(saleRows.reduce((a, r) => a + r.sellerFee, 0) * 100) / 100)} hint={feeRateLabel} /><Stat label="নিট আয়" value={taka(Math.round(saleRows.reduce((a, r) => a + r.net, 0) * 100) / 100)} /><Stat label="উত্তোলন" value="গেটওয়ের পর" /></div>
          <Panel title="ফি নীতি"><p className="font-bn text-sm text-ink/80">একই বিক্রেতার অর্ডার <b>৳{bn(FEE.threshold)}</b>-এর বেশি হলে <b>{feeRateLabel}</b> প্ল্যাটফর্ম ফি পেট্রা সফটওয়্যার সলিউশনস পায় ({payerLabel})। ৳{bn(FEE.threshold)} বা কমে কোনো ফি নেই।</p></Panel>
          <Panel title="অর্ডারভিত্তিক হিসাব" action={<button onClick={() => toast("টাকা তোলা — পেমেন্ট গেটওয়ে যুক্ত হলে চালু হবে", "info")} className="font-bn text-sm text-teal">টাকা তুলুন</button>}>
            <div className="overflow-x-auto"><table className="tbl w-full min-w-[520px]"><thead><tr><th>অর্ডার</th><th className="text-right">মোট</th><th className="text-right">ফি</th><th className="text-right">নিট</th></tr></thead><tbody>{saleRows.map((r) => <tr key={r.id}><td className="text-xs">{r.id}<span className="block font-bn text-mist-500">{r.who}</span></td><td className="text-right tabular-nums">{taka(r.gross)}</td><td className="text-right tabular-nums">{r.sellerFee ? <span className="text-gold-700">−{taka(r.sellerFee)}</span> : <span className="text-mist-500">—</span>}</td><td className="text-right font-bold tabular-nums">{taka(r.net)}</td></tr>)}</tbody></table></div>
          </Panel>
        </div>
      )}
    </DashboardShell>
  );
}
