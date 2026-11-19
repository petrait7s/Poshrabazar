"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Grid2x2, Home, Languages, LayoutDashboard, LogOut, Menu, ShoppingCart, Store, User, X, Search, Package, Heart } from "lucide-react";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { AreaButton } from "./AreaPicker";
import { T, useApp } from "./providers";
import { categories } from "@/data/catalog";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/marketplace", bn: "মার্কেটপ্লেস", en: "Marketplace", tag: "Buy & Sell" },
  { href: "/famous", bn: "বিখ্যাত পণ্য", en: "Famous Products", tag: "Nationwide" },
  { href: "/wholesale", bn: "পাইকারি", en: "Wholesale", tag: "Bulk" },
  { href: "/community", bn: "কমিউনিটি", en: "Community", tag: "Follow" },
  { href: "/knowledge", bn: "নলেজ হাব", en: "Knowledge Hub", tag: "Learn" },
  { href: "/market-intelligence", bn: "মার্কেট ইন্টেলিজেন্স", en: "Market Intelligence", tag: "Understand" },
  { href: "/business-solutions", bn: "বিজনেস সলিউশন", en: "Business Solutions", tag: "Grow" },
];

function useOutside(cb: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) cb(); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); });
  return ref;
}

export function Header() {
  const { lang, setLang, cart, user, logout, toast, hydrated } = useApp();
  const path = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [cats, setCats] = useState(false);
  const [acct, setAcct] = useState(false);
  const catRef = useOutside(() => setCats(false));
  const acctRef = useOutside(() => setAcct(false));
  const count = cart.reduce((a, l) => a + l.qty, 0);
  useEffect(() => { setMenu(false); setCats(false); setAcct(false); }, [path]);
  useEffect(() => { document.body.style.overflow = menu ? "hidden" : ""; }, [menu]);

  return (
    <>
      <div className="relative bg-gradient-to-r from-navy-900 via-navy to-[#0f4a49] text-[12px] text-white/90">
        <div className="container-x flex h-8 items-center justify-between gap-3">
          <p className="truncate font-bn"><span className="text-gold">●</span> <T bn="প্রতিটি বিক্রেতার জন্য বিনামূল্যে Khata Lite" en="Free Khata Lite for every seller" /></p>
          <div className="flex items-center gap-4">
            <Link href="/market-prices" className="hidden font-bn hover:text-white sm:inline"><T bn="আজকের বাজারদর" en="Today's prices" /></Link>
            <Link href="/seller/register" className="hidden font-bn hover:text-white sm:inline"><T bn="বিক্রেতা হোন" en="Become a seller" /></Link>
            <div className="flex items-center overflow-hidden rounded-sm border border-white/25" role="group" aria-label="Language">
              <Languages className="mx-1.5 h-3.5 w-3.5 text-white/70" />
              {(["bn", "en"] as const).map((l) => (
                <button key={l} onClick={() => { setLang(l); toast(l === "bn" ? "ভাষা: বাংলা" : "Language: English", "info"); }} aria-pressed={lang === l}
                  className={cn("px-2 py-0.5 text-[11px] font-semibold", lang === l ? "bg-white text-navy" : "text-white/80 hover:bg-white/10")}>{l === "bn" ? "বাং" : "EN"}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/70 bg-paper/65 shadow-[0_8px_30px_-18px_rgba(20,43,69,.35)] backdrop-blur-xl">
        <div className="container-x flex h-16 items-center gap-3 lg:gap-6">
          <button aria-label="Menu" onClick={() => setMenu(true)} className="grid h-10 w-10 place-items-center rounded-md hover:bg-mist lg:hidden"><Menu className="h-5 w-5" /></button>
          <Link href="/" aria-label="PosraBazar home" className="shrink-0"><Logo /></Link>
          <AreaButton className="hidden w-48 shrink-0 lg:flex" />
          <SearchBar className="hidden max-w-2xl flex-1 lg:block" />
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link href="/seller/register" className="hidden items-center gap-1.5 rounded-md border border-gold/70 bg-gold-50 px-3 py-2 font-bn text-sm font-medium text-gold-700 transition-colors hover:bg-gold hover:text-navy xl:flex"><Store className="h-4 w-4" /><T bn="বিক্রেতা নিবন্ধন" en="Sell on PosraBazar" /></Link>
            <div ref={acctRef} className="relative hidden lg:block">
              <button onClick={() => setAcct((v) => !v)} className="flex items-center gap-2 rounded-md px-3 py-2 font-bn text-sm hover:bg-mist" aria-expanded={acct}>
                <User className="h-5 w-5" /><span className="max-w-[110px] truncate">{hydrated && user ? user.name : <T bn="অ্যাকাউন্ট" en="Account" />}</span><ChevronDown className="h-3.5 w-3.5" />
              </button>
              {acct && (
                <div className="absolute right-0 top-full mt-1 w-60 overflow-hidden glass rounded-md py-1 shadow-lift">
                  {user ? (
                    <>
                      <p className="border-b border-mist px-4 py-2 font-bn text-xs text-mist-500">{user.phone} · {user.role}</p>
                      <MenuLink href="/account" icon={<User className="h-4 w-4" />}>আমার অ্যাকাউন্ট</MenuLink>
                      <MenuLink href="/account/orders" icon={<Package className="h-4 w-4" />}>অর্ডার ও ট্র্যাকিং</MenuLink>
                      <MenuLink href="/seller/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>বিক্রেতা ড্যাশবোর্ড</MenuLink>
                      <MenuLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>অ্যাডমিন প্যানেল</MenuLink>
                      <button onClick={() => { logout(); toast("লগআউট হয়েছে", "info"); router.push("/"); }} className="flex w-full items-center gap-2.5 border-t border-mist px-4 py-2.5 text-left font-bn text-sm text-red-700 hover:bg-paper"><LogOut className="h-4 w-4" />লগআউট</button>
                    </>
                  ) : (
                    <>
                      <MenuLink href="/login" icon={<User className="h-4 w-4" />}>লগইন</MenuLink>
                      <MenuLink href="/register" icon={<User className="h-4 w-4" />}>নতুন অ্যাকাউন্ট</MenuLink>
                      <div className="mt-1 border-t border-mist px-4 pb-1.5 pt-2 text-[11px] uppercase tracking-wider text-mist-500">Demo areas</div>
                      <MenuLink href="/seller/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>বিক্রেতা ড্যাশবোর্ড</MenuLink>
                      <MenuLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>অ্যাডমিন প্যানেল</MenuLink>
                    </>
                  )}
                </div>
              )}
            </div>
            <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-md hover:bg-mist" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {hydrated && count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-teal px-1 text-[10px] font-bold text-white">{count}</span>}
            </Link>
          </div>
        </div>
        <div className="container-x space-y-2 pb-3 lg:hidden"><AreaButton className="w-full !py-1.5" /><SearchBar /></div>

        <nav className="hidden border-t border-white/70 bg-white/55 backdrop-blur-xl lg:block" aria-label="Primary">
          <div className="container-x flex h-11 items-center gap-1">
            <div ref={catRef} className="relative">
              <button onClick={() => setCats((v) => !v)} className="mr-2 flex h-8 items-center gap-2 rounded bg-navy px-3 font-bn text-sm text-white hover:bg-navy-700" aria-expanded={cats}><Grid2x2 className="h-4 w-4" /><T bn="সব ক্যাটাগরি" en="All categories" /><ChevronDown className="h-3.5 w-3.5" /></button>
              {cats && (
                <div className="absolute left-0 top-full z-50 mt-1.5 w-72 overflow-hidden glass rounded-md py-1 shadow-lift">
                  {categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-paper"><span className="font-bn text-[15px] text-navy">{c.bn}</span><span className="text-xs text-mist-500">{c.en}</span></Link>)}
                  <Link href="/categories" className="block border-t border-mist px-4 py-2.5 font-bn text-sm font-medium text-teal hover:bg-paper"><T bn="সব ক্যাটাগরি দেখুন →" en="View all categories →" /></Link>
                </div>
              )}
            </div>
            {nav.map((n) => {
              const active = path === n.href || path.startsWith(n.href + "/");
              return (
                <Link key={n.href} href={n.href} className={cn("group relative flex h-11 flex-col items-start justify-center px-3 font-bn text-[14px]", active ? "text-teal" : "text-navy hover:text-teal")}>
                  <T bn={n.bn} en={n.en} />
                  <span className={cn("absolute inset-x-3 bottom-0 h-0.5 bg-teal transition-transform", active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} />
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {menu && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setMenu(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[84%] max-w-sm animate-rise flex-col bg-paper shadow-lift">
            <div className="flex h-16 items-center justify-between border-b border-mist-300 px-4"><Logo /><button aria-label="Close" onClick={() => setMenu(false)} className="grid h-10 w-10 place-items-center"><X className="h-5 w-5" /></button></div>
            <div className="flex-1 overflow-y-auto px-2 py-3">
              {nav.map((n) => <Link key={n.href} href={n.href} className="flex items-center justify-between rounded-md px-3 py-3 font-bn text-[16px] text-navy hover:bg-mist"><span><T bn={n.bn} en={n.en} /></span><span className="text-[11px] uppercase tracking-wider text-teal">{n.tag}</span></Link>)}
              <p className="eyebrow px-3 pb-1 pt-5">ক্যাটাগরি</p>
              {categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className="block rounded-md px-3 py-2.5 font-bn text-[15px] text-ink hover:bg-mist">{c.bn}</Link>)}
              <p className="eyebrow px-3 pb-1 pt-5">অ্যাকাউন্ট</p>
              {user ? <button onClick={() => { logout(); setMenu(false); }} className="block w-full rounded-md px-3 py-2.5 text-left font-bn text-[15px] text-red-700 hover:bg-mist">লগআউট</button> : <><Link href="/login" className="block rounded-md px-3 py-2.5 font-bn text-[15px] hover:bg-mist">লগইন</Link><Link href="/register" className="block rounded-md px-3 py-2.5 font-bn text-[15px] hover:bg-mist">নিবন্ধন</Link></>}
              <Link href="/seller/register" className="block rounded-md px-3 py-2.5 font-bn text-[15px] text-gold-700 hover:bg-mist">বিক্রেতা হিসেবে যোগ দিন</Link>
              <Link href="/seller/dashboard" className="block rounded-md px-3 py-2.5 font-bn text-[15px] hover:bg-mist">বিক্রেতা ড্যাশবোর্ড (ডেমো)</Link>
              <Link href="/admin" className="block rounded-md px-3 py-2.5 font-bn text-[15px] hover:bg-mist">অ্যাডমিন (ডেমো)</Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-2.5 px-4 py-2.5 font-bn text-sm text-navy hover:bg-paper"><span className="text-mist-500">{icon}</span>{children}</Link>;
}

export function BottomNav() {
  const path = usePathname();
  const { cart, wishlist, hydrated } = useApp();
  const count = cart.reduce((a, l) => a + l.qty, 0);
  const items = [
    { href: "/", label: "হোম", icon: Home },
    { href: "/categories", label: "ক্যাটাগরি", icon: Grid2x2 },
    { href: "/search", label: "খুঁজুন", icon: Search },
    { href: "/cart", label: "কার্ট", icon: ShoppingCart, badge: count },
    { href: "/account", label: "আমি", icon: User },
  ];
  void wishlist; void Heart;
  return (
    <nav aria-label="Bottom" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link href={it.href} className={cn("relative flex h-14 flex-col items-center justify-center gap-0.5 font-bn text-[11px]", active ? "text-teal" : "text-ink/60")}>
                <it.icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                {it.label}
                {hydrated && !!it.badge && <span className="absolute right-[28%] top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-teal px-1 text-[9px] font-bold text-white">{it.badge}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
