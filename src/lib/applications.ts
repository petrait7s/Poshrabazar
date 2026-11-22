"use client";
// PREVIEW data layer for seller onboarding. Mirrors the database functions in
// supabase/migrations/20261122000001_seller_onboarding.sql (same states, same rules) but stores everything in this
// browser's localStorage. When Supabase is connected, replace the bodies of these functions with RPC calls;
// the pages do not change. Nothing here is shared between devices or checked by a server.
import { useCallback, useEffect, useState } from "react";

export type SellerType = "individual" | "farmer_producer" | "youth_entrepreneur" | "business";
export type AppStatus = "draft" | "submitted" | "in_review" | "needs_info" | "approved" | "rejected" | "withdrawn";
export type DocKind = "identity" | "farm_photo" | "product_photo" | "shop_photo" | "trade_licence" | "institution_id";

export const sellerTypes: { key: SellerType; bn: string; hint: string }[] = [
  { key: "individual", bn: "ব্যক্তি", hint: "নিজে পণ্য সংগ্রহ বা তৈরি করে বিক্রি করেন" },
  { key: "farmer_producer", bn: "কৃষক / উৎপাদক", hint: "নিজের খামার, বাগান, পুকুর বা কারখানার পণ্য" },
  { key: "youth_entrepreneur", bn: "তরুণ উদ্যোক্তা", hint: "নতুন উদ্যোগ নিয়ে এসেছেন, বয়স বা পেশার শর্ত নেই" },
  { key: "business", bn: "ব্যবসা প্রতিষ্ঠান", hint: "দোকান, আড়ত, মিল বা কোম্পানি" },
];
export const docKinds: Record<DocKind, string> = { identity: "পরিচয়পত্র (ছবি)", farm_photo: "খামার / বাগানের ছবি", product_photo: "পণ্যের ছবি", shop_photo: "দোকানের ছবি", trade_licence: "ট্রেড লাইসেন্স", institution_id: "প্রতিষ্ঠানের আইডি (ঐচ্ছিক)" };
/** Evidence asked for each seller type. `required` kinds block submission; approval additionally needs an identity document (as in the database). */
export const evidenceFor: Record<SellerType, { required: DocKind[]; optional: DocKind[]; anyOf?: DocKind[] }> = {
  individual: { required: ["identity"], optional: ["product_photo"] },
  farmer_producer: { required: ["identity"], anyOf: ["farm_photo", "product_photo"], optional: ["shop_photo"] },
  youth_entrepreneur: { required: ["identity", "product_photo"], optional: ["institution_id"] },
  business: { required: ["identity"], optional: ["trade_licence", "shop_photo", "product_photo"] },
};

export type Doc = { kind: DocKind; name: string };
export type AppEvent = { at: string; from: AppStatus | null; to: AppStatus; by: string; note?: string };
export type Application = {
  id: string; owner: string; status: AppStatus; sellerType: SellerType; fullName: string; phone: string; email: string;
  district: string; upazila: string; address: string; goodsLocation: string;
  storeNameBn: string; storeNameEn: string; description: string; categories: string[]; originStory: string;
  docs: Doc[]; events: AppEvent[]; decisionNote: string; submittedAt: string; agreedAt: string;
};
export type Source = { id: string; name: string; type: "own_farm" | "local_farmers" | "other_district_supplier" | "wholesale_market" | "own_workshop"; district: string; relationship: "we_grow" | "we_buy_from"; description: string };
export type Post = { id: string; kind: "sourcing" | "production" | "new_stock" | "announcement"; title: string; body: string; at: string; hidden?: boolean };
export type Listing = { id: string; productSlug: string; retail: number; wholesale: number; moq: number; stock: number; unitCost: number | null; originDistrict: string; sourceId: string; status: "pending" | "active" | "paused" | "rejected" };
export type StoreData = { sources: Source[]; posts: Post[]; listings: Listing[]; production: string };

export const sourceTypes: Record<Source["type"], string> = { own_farm: "নিজের খামার", local_farmers: "স্থানীয় কৃষক", other_district_supplier: "অন্য জেলার সরবরাহকারী", wholesale_market: "পাইকারি বাজার", own_workshop: "নিজের কারখানা / কারখানা-ঘর" };
export const postKinds: Record<Post["kind"], string> = { sourcing: "সংগ্রহ", production: "উৎপাদন", new_stock: "নতুন মজুত", announcement: "ঘোষণা" };
export const statusBn: Record<AppStatus, string> = { draft: "খসড়া", submitted: "জমা হয়েছে", in_review: "যাচাই চলছে", needs_info: "আরও তথ্য দরকার", approved: "অনুমোদিত", rejected: "অনুমোদন হয়নি", withdrawn: "প্রত্যাহার করা" };

const K_APPS = "pb_apps", K_STORES = "pb_store_data";
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); window.dispatchEvent(new Event("pb-apps")); } catch { /* storage unavailable */ } };
const now = () => new Date().toISOString();
const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random()).slice(2));
const PHONE = /^(\+?88)?01[3-9][0-9]{8}$/;
const fail = (m: string): never => { throw new Error(m); };

export const allApps = () => read<Application[]>(K_APPS, []);
const save = (a: Application[]) => write(K_APPS, a);
const patch = (id: string, fn: (a: Application) => Application) => save(allApps().map((a) => (a.id === id ? fn(a) : a)));
const log = (a: Application, to: AppStatus, by: string, note?: string): Application => ({ ...a, status: to, events: [...a.events, { at: now(), from: a.status, to, by, note }] });

export type Draft = Omit<Application, "id" | "owner" | "status" | "events" | "decisionNote" | "submittedAt" | "agreedAt"> & { agreeTerms: boolean; agreeDelivery: boolean };

/** Same checks as submit_seller_application() plus the evidence rules for the seller type. */
export function validateDraft(d: Draft): Record<string, string> {
  const e: Record<string, string> = {};
  if (d.fullName.trim().length < 3) e.fullName = "পূর্ণ নাম লিখুন";
  if (!PHONE.test(d.phone.replace(/[\s-]/g, ""))) e.phone = "সঠিক মোবাইল নম্বর দিন";
  if (!d.district) e.district = "জেলা বাছুন";
  if (d.address.trim().length < 6) e.address = "ঠিকানা লিখুন";
  if (d.storeNameBn.trim().length < 2) e.storeNameBn = "দোকানের নাম লিখুন";
  if (!d.categories.length) e.categories = "অন্তত একটি ক্যাটাগরি বাছুন";
  const ev = evidenceFor[d.sellerType]; const have = new Set(d.docs.map((x) => x.kind));
  const miss = ev.required.filter((k) => !have.has(k));
  if (miss.length) e.docs = `প্রয়োজন: ${miss.map((k) => docKinds[k]).join(", ")}`;
  else if (ev.anyOf && !ev.anyOf.some((k) => have.has(k))) e.docs = `এর একটি দিন: ${ev.anyOf.map((k) => docKinds[k]).join(" বা ")}`;
  if (!d.agreeTerms || !d.agreeDelivery) e.agree = "শর্ত ও ডেলিভারি ব্যবস্থায় সম্মতি দিতে হবে";
  return e;
}

export function submitApplication(owner: string, d: Draft): string {
  if (allApps().some((a) => a.owner === owner && ["submitted", "in_review", "needs_info"].includes(a.status))) fail("আপনার একটি আবেদন আগে থেকেই চলছে");
  const e = validateDraft(d); if (Object.keys(e).length) fail(Object.values(e)[0]);
  const { agreeTerms: _t, agreeDelivery: _d, ...rest } = d; void _t; void _d;
  const a: Application = { ...rest, id: uid(), owner, status: "submitted", events: [], decisionNote: "", submittedAt: now(), agreedAt: now(), phone: d.phone.replace(/[\s-]/g, "") };
  a.events = [{ at: now(), from: null, to: "submitted", by: owner }];
  save([...allApps(), a]);
  return a.id;
}
export function resubmit(id: string, owner: string, changes: Partial<Pick<Application, "description" | "originStory" | "goodsLocation" | "address">>, docs: Doc[]) {
  const a = allApps().find((x) => x.id === id);
  if (!a || a.owner !== owner) fail("অনুমতি নেই");
  if (a!.status !== "needs_info") fail("শুধু ‘আরও তথ্য দরকার’ অবস্থার আবেদন আবার জমা দেওয়া যায়");
  patch(id, (x) => ({ ...log(x, "submitted", owner, "আবেদনকারী আবার জমা দিয়েছেন"), ...changes, docs: [...x.docs, ...docs], submittedAt: now() }));
}
export function withdraw(id: string, owner: string) {
  const a = allApps().find((x) => x.id === id);
  if (!a || a.owner !== owner) fail("অনুমতি নেই");
  if (!["draft", "submitted", "in_review", "needs_info"].includes(a!.status)) fail("এই আবেদন আর প্রত্যাহার করা যায় না");
  patch(id, (x) => log(x, "withdrawn", owner));
}
/** Same rules as review_application(): start review first; approval needs an identity document; request and reject need a note. */
export function review(id: string, admin: string, action: "start_review" | "request_info" | "approve" | "reject", note = "") {
  const a = allApps().find((x) => x.id === id); if (!a) fail("আবেদন পাওয়া যায়নি");
  const A = a as Application;
  if (action === "start_review") { if (A.status !== "submitted") fail("শুধু জমা-হওয়া আবেদন যাচাইয়ে নেওয়া যায়"); patch(id, (x) => log(x, "in_review", admin)); return; }
  if (action === "request_info") { if (A.status !== "in_review") fail("আগে যাচাই শুরু করুন"); if (!note.trim()) fail("কী তথ্য দরকার তা লিখুন"); patch(id, (x) => ({ ...log(x, "needs_info", admin, note), decisionNote: note })); return; }
  if (action === "approve") {
    if (A.status !== "in_review") fail("আগে যাচাই শুরু করুন");
    if (!A.docs.some((d) => d.kind === "identity")) fail("অনুমোদনের আগে পরিচয়পত্র দরকার");
    patch(id, (x) => ({ ...log(x, "approved", admin, note || undefined), decisionNote: note })); return;
  }
  if (!["submitted", "in_review", "needs_info"].includes(A.status)) fail("এই আবেদন এখন বাতিল করা যায় না");
  if (!note.trim()) fail("কারণ লিখুন");
  patch(id, (x) => ({ ...log(x, "rejected", admin, note), decisionNote: note }));
}

// ───── store data (sourcing, updates, products) of an approved application ─────
const emptyStore: StoreData = { sources: [], posts: [], listings: [], production: "" };
export const getStore = (appId: string): StoreData => ({ ...emptyStore, ...(read<Record<string, StoreData>>(K_STORES, {})[appId] ?? {}) });
const putStore = (appId: string, s: StoreData) => write(K_STORES, { ...read<Record<string, StoreData>>(K_STORES, {}), [appId]: s });
export const updateStore = (appId: string, fn: (s: StoreData) => StoreData) => putStore(appId, fn(getStore(appId)));

export function addPost(appId: string, p: Omit<Post, "id" | "at">) {
  if (p.title.trim().length < 3) fail("শিরোনাম লিখুন");
  const s = getStore(appId);
  if (s.posts.filter((x) => Date.now() - Date.parse(x.at) < 864e5).length >= 5) fail("দিনে সর্বোচ্চ ৫টি আপডেট দেওয়া যায়");
  putStore(appId, { ...s, posts: [{ ...p, id: uid(), at: now() }, ...s.posts] });
}
export function addListing(appId: string, l: Omit<Listing, "id" | "status">) {
  if (!l.productSlug) fail("পণ্য বাছুন");
  if (!l.originDistrict) fail("পণ্য কোন জেলা থেকে আসে তা বলুন");
  if (l.retail <= 0) fail("খুচরা দাম দিন");
  if (l.wholesale > 0 && l.wholesale > l.retail) fail("পাইকারি দাম খুচরার চেয়ে বেশি হতে পারে না");
  const s = getStore(appId);
  if (s.listings.some((x) => x.productSlug === l.productSlug)) fail("এই পণ্য আগেই যোগ করা আছে");
  putStore(appId, { ...s, listings: [...s.listings, { ...l, id: uid(), status: "pending" }] });
}
/** Publishing needs an approved store and a stated origin, like guard_listing_status(). */
export function setListingStatus(appId: string, listingId: string, to: Listing["status"], approved: boolean) {
  const s = getStore(appId); const l = s.listings.find((x) => x.id === listingId); if (!l) return;
  if (l.status === "rejected") fail("এই পণ্য মডারেটর বাতিল করেছেন");
  if (to === "active" && !approved) fail("দোকান অনুমোদিত না হলে পণ্য প্রকাশ করা যায় না");
  if (to === "active" && !l.originDistrict) fail("প্রকাশের আগে পণ্যের উৎস জেলা দিন");
  putStore(appId, { ...s, listings: s.listings.map((x) => (x.id === listingId ? { ...x, status: to } : x)) });
}

export function useApplications() {
  const [apps, setApps] = useState<Application[]>([]); const [ready, setReady] = useState(false);
  const sync = useCallback(() => { setApps(allApps()); setReady(true); }, []);
  useEffect(() => { sync(); window.addEventListener("pb-apps", sync); window.addEventListener("storage", sync); return () => { window.removeEventListener("pb-apps", sync); window.removeEventListener("storage", sync); }; }, [sync]);
  return { apps, ready };
}
