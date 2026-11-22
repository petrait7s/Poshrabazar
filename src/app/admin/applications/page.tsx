"use client";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/misc";
import { docKinds, evidenceFor, review, sellerTypes, statusBn, useApplications, type Application, type AppStatus } from "@/lib/applications";
import { categories } from "@/data/catalog";
import { cn } from "@/lib/utils";

const tabs: { key: AppStatus | "all"; label: string }[] = [{ key: "submitted", label: "নতুন" }, { key: "in_review", label: "যাচাইয়ে" }, { key: "needs_info", label: "তথ্য চাওয়া" }, { key: "approved", label: "অনুমোদিত" }, { key: "rejected", label: "বাতিল" }, { key: "all", label: "সব" }];

export default function Page() {
  const { user, toast } = useApp();
  const { apps, ready } = useApplications();
  const [tab, setTab] = useState<AppStatus | "all">("submitted");
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");
  if (!user || user.role !== "admin") return <div className="container-x py-10 font-bn"><p>এই পাতা শুধু অ্যাডমিনের জন্য। <Link href="/login" className="text-primary underline">অ্যাডমিন (ডেমো) হিসেবে লগইন করুন</Link>।</p></div>;
  const list = apps.filter((a) => tab === "all" || a.status === tab).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const act = (a: Application, action: "start_review" | "request_info" | "approve" | "reject") => {
    try { review(a.id, user.phone, action, note); setNote(""); toast("সম্পন্ন", "ok"); } catch (x) { toast((x as Error).message, "err"); }
  };
  return (
    <div className="container-x py-8">
      <Breadcrumb items={[{ label: "অ্যাডমিন", href: "/admin" }, { label: "আবেদন" }]} />
      <h1 className="mb-1 mt-4 text-[28px]">বিক্রেতার আবেদন</h1>
      <p className="mb-4 font-bn text-sm text-muted">প্রিভিউ: আবেদন এই ব্রাউজারে জমা হয়। আসল সংস্করণে সব আবেদন এক কাতারে আসবে।</p>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">{tabs.map((t) => <button key={t.key} aria-pressed={tab === t.key} onClick={() => setTab(t.key)} className={cn("h-9 shrink-0 rounded-full border px-3.5 font-bn text-sm", tab === t.key ? "border-ink bg-ink text-white" : "border-line bg-surface")}>{t.label} ({apps.filter((a) => t.key === "all" || a.status === t.key).length})</button>)}</div>
      {ready && !list.length && <p className="font-bn text-muted">এখানে কোনো আবেদন নেই।</p>}
      <ul className="space-y-3">
        {list.map((a) => {
          const on = open === a.id; const hasId = a.docs.some((d) => d.kind === "identity");
          return (
            <li key={a.id} className="surface rounded-md font-bn">
              <button className="flex w-full items-center justify-between gap-3 p-4 text-left" aria-expanded={on} onClick={() => { setOpen(on ? null : a.id); setNote(""); }}>
                <span><b className="block text-base">{a.storeNameBn}</b><span className="text-xs text-muted">{a.fullName} · {sellerTypes.find((t) => t.key === a.sellerType)?.bn} · {a.district}</span></span>
                <span className="shrink-0 rounded-sm bg-tint px-2 py-1 text-xs">{statusBn[a.status]}</span>
              </button>
              {on && (
                <div className="space-y-4 border-t border-line p-4 text-sm">
                  <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    <div><dt className="text-xs text-muted">ফোন</dt><dd>{a.phone}</dd></div>
                    <div><dt className="text-xs text-muted">ঠিকানা</dt><dd>{a.address}, {a.upazila && `${a.upazila}, `}{a.district}</dd></div>
                    <div><dt className="text-xs text-muted">পণ্য রাখার জায়গা</dt><dd>{a.goodsLocation || "—"}</dd></div>
                    <div><dt className="text-xs text-muted">ক্যাটাগরি</dt><dd>{a.categories.map((c) => categories.find((x) => x.slug === c)?.bn).join(", ")}</dd></div>
                  </dl>
                  {a.description && <p>{a.description}</p>}
                  {a.originStory && <p className="rounded bg-tint px-3 py-2"><span className="text-xs text-muted">বিক্রেতার নিজের বিবরণ</span><br />{a.originStory}</p>}
                  <div><p className="mb-1 text-xs font-semibold">প্রমাণ</p>
                    <ul>{evidenceFor[a.sellerType].required.map((k) => { const d = a.docs.find((x) => x.kind === k); return <li key={k} className={d ? "" : "text-red-700"}>{docKinds[k]}: {d ? d.name : "নেই"}</li>; })}
                      {a.docs.filter((d) => !evidenceFor[a.sellerType].required.includes(d.kind)).map((d, i) => <li key={i}>{docKinds[d.kind]}: {d.name}</li>)}</ul>
                    {!hasId && <p className="mt-1 text-xs text-red-700">পরিচয়পত্র ছাড়া অনুমোদন করা যাবে না</p>}
                  </div>
                  {["submitted", "in_review", "needs_info"].includes(a.status) && (
                    <div className="space-y-2">
                      <textarea aria-label="মন্তব্য" placeholder="মন্তব্য (তথ্য চাইলে বা বাতিল করলে আবশ্যক)" className="min-h-16 w-full rounded-md border border-line bg-white p-2" value={note} onChange={(e) => setNote(e.target.value)} />
                      <div className="flex flex-wrap gap-2">
                        {a.status === "submitted" && <Button size="sm" onClick={() => act(a, "start_review")}>যাচাই শুরু</Button>}
                        {a.status === "in_review" && <><Button size="sm" onClick={() => act(a, "approve")}>অনুমোদন</Button><Button size="sm" variant="outline" onClick={() => act(a, "request_info")}>তথ্য চান</Button></>}
                        <Button size="sm" variant="outline" onClick={() => act(a, "reject")}>বাতিল</Button>
                      </div>
                    </div>
                  )}
                  <ol className="space-y-0.5 text-xs text-muted">{a.events.map((e, i) => <li key={i}>{new Date(e.at).toLocaleString("bn-BD")} · {statusBn[e.to]}{e.note ? ` · ${e.note}` : ""}</li>)}</ol>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
