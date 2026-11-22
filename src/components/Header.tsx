"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Grid2x2, Home, Store, MapPin, Package, Search, ShoppingBag, User } from "lucide-react";
import { Logo } from "./Logo";
import { bn } from "@/data/catalog";
import { LocationSheet } from "./LocationSheet";
import { useApp } from "./providers";
import { cn } from "@/lib/utils";

const links = [
  { href: "/categories", label: "ক্যাটাগরি" },
  { href: "/stores", label: "দোকান" },
  { href: "/seller/register", label: "বিক্রেতা হোন" },
];

export function Header() {
  const path = usePathname();
  const { area, cart, user, hydrated, toast, lang, setLang } = useApp();
  const [sheet, setSheet] = useState(false);
  const place = hydrated ? area.upazila || area.district || area.division || "সিলেট" : "সিলেট";
  const count = cart.reduce((a, l) => a + l.qty, 0);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-cream">
        <div className="container-x flex h-14 items-center justify-between gap-2 !pr-1 sm:!pr-4 lg:!pr-8">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="PosraBazar হোম" className="shrink-0"><Logo /></Link>
            <nav aria-label="প্রধান" className="hidden items-center lg:flex">
              {links.map((l) => {
                const on = path === l.href || path.startsWith(l.href + "/");
                return <Link key={l.href} href={l.href} className={cn("relative flex h-14 items-center px-3.5 text-[15px]", on ? "text-ink" : "text-muted hover:text-ink")}>{l.label}{on && <span className="absolute inset-x-3.5 bottom-0 h-0.5 bg-primary" />}</Link>;
              })}
            </nav>
          </div>
          <div className="flex items-center">
            <button type="button" onClick={() => setSheet(true)} aria-label={`ডেলিভারি এলাকা বদলান, এখন ${place}`} className="flex h-11 items-center px-1">
              <span className="flex h-[34px] items-center gap-1.5 rounded-lg border border-line bg-surface pl-2 pr-2.5 text-[13.5px] font-semibold">
                <MapPin className="h-[15px] w-[15px] text-primary" strokeWidth={2.2} />{place}<ChevronDown className="h-[13px] w-[13px] text-muted" strokeWidth={2.4} />
              </span>
            </button>
            {path !== "/" && <Link href="/search" aria-label="খুঁজুন" className="grid h-11 w-11 place-items-center text-ink"><Search className="h-[22px] w-[22px]" strokeWidth={1.75} /></Link>}
            <button type="button" aria-label="নোটিফিকেশন" onClick={() => toast("নোটিফিকেশন এখনো চালু হয়নি", "info")} className="grid h-11 w-11 place-items-center text-ink"><Bell className="h-[22px] w-[22px]" strokeWidth={1.75} /></button>
            <Link href="/cart" aria-label={`কার্ট${hydrated && count ? `, ${bn(count)}টি` : ""}`} className="relative hidden h-11 w-11 place-items-center text-ink lg:grid"><ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.75} />{hydrated && count > 0 && <span className="absolute right-1 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10.5px] font-bold text-white">{bn(count)}</span>}</Link>
            <Link href={user ? "/account" : "/login"} aria-label="অ্যাকাউন্ট" className="hidden h-11 w-11 place-items-center text-ink lg:grid"><User className="h-[22px] w-[22px]" strokeWidth={1.75} /></Link>
            <div className="ml-2 hidden items-center overflow-hidden rounded-md border border-line text-[11px] font-semibold lg:flex" role="group" aria-label="ভাষা">
              {(["bn", "en"] as const).map((l) => <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l} className={cn("px-2 py-1", lang === l ? "bg-ink text-white" : "text-muted hover:text-ink")}>{l === "bn" ? "বাং" : "EN"}</button>)}
            </div>
          </div>
        </div>
      </header>
      <LocationSheet open={sheet} onClose={() => setSheet(false)} />
    </>
  );
}

export function BottomNav() {
  const path = usePathname();
  const { cart, hydrated } = useApp();
  const count = cart.reduce((a, l) => a + l.qty, 0);
  const cats = ["/categories", "/category", "/product", "/search", "/marketplace", "/wholesale", "/famous"].some((p) => path.startsWith(p));
  const items = [
    { href: "/", label: "হোম", icon: Home, on: path === "/" },
    { href: "/categories", label: "ক্যাটাগরি", icon: Grid2x2, on: cats },
    { href: "/stores", label: "দোকান", icon: Store, on: path.startsWith("/stores") || path.startsWith("/seller/") },
    { href: "/cart", label: "কার্ট", icon: ShoppingBag, on: path.startsWith("/cart") || path.startsWith("/checkout"), badge: hydrated ? count : 0 },
    { href: "/account/orders", label: "অর্ডার", icon: Package, on: path.startsWith("/account/orders") },
    { href: "/account", label: "প্রোফাইল", icon: User, on: path === "/account" || path.startsWith("/login") || path.startsWith("/register") },
  ];
  return (
    <nav aria-label="মোবাইল মেনু" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid h-14 grid-cols-6">
        {items.map((it) => (
          <li key={it.href}>
            <Link href={it.href} aria-current={it.on ? "page" : undefined} className={cn("relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px]", it.on ? "font-semibold text-primary" : "text-muted")}>
              {it.on && <span className="absolute left-1/2 top-[-1px] h-0.5 w-6 -translate-x-1/2 bg-primary" />}
              <span className="relative"><it.icon className="h-[22px] w-[22px]" strokeWidth={it.on ? 2 : 1.75} />{!!it.badge && <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10.5px] font-bold text-white">{bn(it.badge)}</span>}</span>
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
