"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LogOut, Package, User } from "lucide-react";
import { useApp } from "@/components/providers";
import { ProductCard } from "@/components/Commerce";
import { Button, LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { products } from "@/data/catalog";
import { cn } from "@/lib/utils";

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useApp();
  const path = usePathname();
  if (!hydrated) return <div className="container-x py-16" />;
  if (!user) return <div className="container-x py-12"><EmptyState title="অ্যাকাউন্ট দেখতে লগইন করুন" text="ডেমো লগইনে যেকোনো বৈধ ফর্ম তথ্য চলবে।" action={<LinkButton href="/login">লগইন</LinkButton>} /></div>;
  const items = [["/account", "প্রোফাইল", User], ["/account/orders", "অর্ডার ও ট্র্যাকিং", Package]] as const;
  return (
    <div className="container-x grid gap-6 py-8 lg:grid-cols-[230px_1fr]">
      <nav className="flex gap-2 lg:flex-col">{items.map(([h, l, I]) => <Link key={h} href={h} className={cn("flex items-center gap-2 rounded-md px-3 py-2.5 font-bn text-sm", path === h ? "bg-navy text-white" : "border border-mist-300 bg-white text-navy hover:bg-mist")}><I className="h-4 w-4" />{l}</Link>)}</nav>
      <div>{children}</div>
    </div>
  );
}

export function ProfileView() {
  const { user, logout, wishlist, toast } = useApp();
  const router = useRouter();
  const wished = products.filter((p) => wishlist.includes(p.slug));
  return (
    <>
      <h1 className="font-bn text-3xl font-normal">আমার অ্যাকাউন্ট</h1>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-md border border-mist-300 bg-white p-5">
        <div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-full bg-navy font-bn text-2xl text-white">{user?.name[0]}</div><div><p className="font-bn text-lg text-navy">{user?.name}</p><p className="text-sm text-ink/60">{user?.phone} · {user?.role}</p></div></div>
        <Button variant="outline" onClick={() => { logout(); toast("লগআউট হয়েছে", "info"); router.push("/"); }}><LogOut className="h-4 w-4" />লগআউট</Button>
      </div>
      <h2 className="mb-4 mt-8 flex items-center gap-2 font-bn text-xl"><Heart className="h-5 w-5 text-red-500" />পছন্দের তালিকা</h2>
      {wished.length ? <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">{wished.map((p) => <ProductCard key={p.slug} p={p} />)}</div> : <EmptyState title="কোনো পছন্দের পণ্য নেই" text="পণ্যের কার্ডে হৃদয় চিহ্নে ক্লিক করে যোগ করুন।" action={<LinkButton href="/marketplace" variant="outline">পণ্য দেখুন</LinkButton>} />}
    </>
  );
}
