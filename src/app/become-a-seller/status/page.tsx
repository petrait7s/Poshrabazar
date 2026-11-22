"use client";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { Button, LinkButton } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { Breadcrumb } from "@/components/ui/misc";
import { docKinds, resubmit, sellerTypes, statusBn, useApplications, withdraw, type DocKind } from "@/lib/applications";
import { cn } from "@/lib/utils";

const tone: Record<string, string> = { approved: "border-primary/40 bg-primary-50", rejected: "border-red-300 bg-red-50", needs_info: "border-accent/50 bg-accent-50" };

export default function Page() {
  const { user, toast } = useApp();
  const { apps, ready } = useApplications();
  const [more, setMore] = useState({ text: "", doc: "" as DocKind | "", file: "" });
  const mine = apps.filter((a) => a.owner === user?.phone).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const a = mine[0];
  const run = (fn: () => void, ok: string) => { try { fn(); toast(ok, "ok"); } catch (x) { toast((x as Error).message, "err"); } };

  return (
    <div className="container-x max-w-2xl py-8">
      <Breadcrumb items={[{ label: "হোম", href: "/" }, { label: "বিক্রেতা হোন", href: "/become-a-seller" }, { label: "আবেদনের অবস্থা" }]} />
      <h1 className="mb-4 mt-4 text-[28px]">আবেদনের অবস্থা</h1>
      {!user && <p className="font-bn">আবেদনের অবস্থা দেখতে <Link href="/login" className="text-primary underline">লগইন</Link> করুন।</p>}
      {user && ready && !a && <div className="surface rounded-md p-6 font-bn"><p>আপনার কোনো আবেদন নেই।</p><LinkButton href="/become-a-seller" className="mt-4">বিক্রেতা হওয়ার আবেদন করুন</LinkButton></div>}
      {a && (
        <>
          <section className={cn("rounded-md border p-5 font-bn", tone[a.status] ?? "border-line bg-surface")} aria-live="polite">
            <p className="text-xs text-muted">{a.storeNameBn} · {sellerTypes.find((t) => t.key === a.sellerType)?.bn}</p>
            <h2 className="text-2xl">{statusBn[a.status]}</h2>
            <p className="mt-1 text-[15px] text-ink/80">
              {a.status === "submitted" && "আপনার আবেদন লাইনে আছে। অ্যাডমিন শিগগিরই যাচাই শুরু করবেন।"}
              {a.status === "in_review" && "অ্যাডমিন আপনার তথ্য ও প্রমাণ দেখছেন।"}
              {a.status === "needs_info" && <>আরও তথ্য দরকার: <b>{a.decisionNote}</b></>}
              {a.status === "approved" && "আপনার দোকান অনুমোদিত। এখন পণ্য যোগ করে প্রকাশ করতে পারবেন।"}
              {a.status === "rejected" && <>অনুমোদন হয়নি: <b>{a.decisionNote}</b></>}
              {a.status === "withdrawn" && "আপনি এই আবেদন প্রত্যাহার করেছেন।"}
            </p>
            {a.status === "approved" && <LinkButton href="/seller/dashboard" className="mt-4">বিক্রেতা ড্যাশবোর্ড</LinkButton>}
            {(a.status === "rejected" || a.status === "withdrawn") && <LinkButton href="/become-a-seller" variant="outline" className="mt-4">নতুন আবেদন</LinkButton>}
          </section>

          {a.status === "needs_info" && (
            <section className="mt-5 surface rounded-md p-5 font-bn">
              <h3 className="text-lg">তথ্য দিন</h3>
              <Field label="উত্তর বা সংশোধন"><textarea className="min-h-20 w-full rounded-md border border-line bg-white p-3 text-[15px]" value={more.text} onChange={(e) => setMore({ ...more, text: e.target.value })} /></Field>
              <Field label="নতুন প্রমাণ (প্রিভিউতে শুধু নাম রাখা হয়)" className="mt-3"><input type="file" onChange={(e) => setMore({ ...more, file: e.target.files?.[0]?.name ?? "" })} className="block w-full text-sm" /></Field>
              <Button className="mt-4" onClick={() => run(() => resubmit(a.id, user!.phone, more.text ? { originStory: `${a.originStory}\n${more.text}`.trim() } : {}, more.file ? [{ kind: "identity" as DocKind, name: more.file }] : []), "আবার জমা হয়েছে")}>আবার জমা দিন</Button>
            </section>
          )}

          {["submitted", "in_review", "needs_info"].includes(a.status) && <Button variant="outline" className="mt-4" onClick={() => run(() => withdraw(a.id, user!.phone), "আবেদন প্রত্যাহার হয়েছে")}>আবেদন প্রত্যাহার করুন</Button>}

          <section className="mt-6 font-bn"><h3 className="mb-2 text-lg">জমা দেওয়া প্রমাণ</h3>
            <ul className="text-sm">{a.docs.map((d, i) => <li key={i} className="border-b border-line py-1.5">{docKinds[d.kind]}: <span className="text-muted">{d.name}</span></li>)}</ul></section>
          <section className="mt-6 font-bn"><h3 className="mb-2 text-lg">ইতিহাস</h3>
            <ol className="space-y-1 text-sm">{a.events.map((e, i) => <li key={i} className="text-ink/80">{new Date(e.at).toLocaleString("bn-BD")} · {statusBn[e.to]}{e.note ? ` · ${e.note}` : ""}</li>)}</ol></section>
        </>
      )}
    </div>
  );
}
