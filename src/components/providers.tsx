"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { noArea, type Area } from "@/data/locations";
import { CheckCircle2, Info, X, AlertTriangle } from "lucide-react";

export type Lang = "bn" | "en";
export type CartLine = { productSlug: string; sellerSlug: string; mode: "retail" | "wholesale"; qty: number };
export type DemoUser = { name: string; phone: string; role: "buyer" | "seller" | "admin" };
type ToastAction = { label: string; href: string };
type Toast = { id: number; msg: string; kind: "ok" | "info" | "err"; action?: ToastAction };

type Ctx = {
  lang: Lang; setLang: (l: Lang) => void;
  cart: CartLine[]; addToCart: (l: CartLine) => void; setQty: (i: number, q: number) => void; removeLine: (i: number) => void; clearCart: () => void;
  wishlist: string[]; toggleWish: (slug: string) => void;
  user: DemoUser | null; login: (u: DemoUser) => void; logout: () => void;
  toast: (msg: string, kind?: Toast["kind"], action?: ToastAction) => void;
  area: Area; setArea: (a: Area) => void;
  hydrated: boolean;
};
const C = createContext<Ctx | null>(null);
export const useApp = () => { const c = useContext(C); if (!c) throw new Error("no provider"); return c; };

function load<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } }
function save(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangS] = useState<Lang>("bn");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWish] = useState<string[]>([]);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [area, setAreaS] = useState<Area>(noArea);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLangS(load("pb_lang", "bn")); setCart(load("pb_cart", [])); setWish(load("pb_wish", [])); setUser(load("pb_user", null)); setAreaS(load("pb_area", noArea)); setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) save("pb_cart", cart); }, [cart, hydrated]);
  useEffect(() => { if (hydrated) save("pb_wish", wishlist); }, [wishlist, hydrated]);
  useEffect(() => { if (hydrated) save("pb_user", user); }, [user, hydrated]);
  useEffect(() => { document.documentElement.lang = lang === "bn" ? "bn" : "en"; }, [lang]);

  const toast = useCallback((msg: string, kind: Toast["kind"] = "ok", action?: ToastAction) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg, kind, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const value = useMemo<Ctx>(() => ({
    lang, setLang: (l) => { setLangS(l); save("pb_lang", l); },
    cart,
    addToCart: (l) => setCart((c) => {
      const i = c.findIndex((x) => x.productSlug === l.productSlug && x.sellerSlug === l.sellerSlug && x.mode === l.mode);
      if (i >= 0) return c.map((x, k) => (k === i ? { ...x, qty: x.qty + l.qty } : x));
      return [...c, l];
    }),
    setQty: (i, q) => setCart((c) => c.map((x, k) => (k === i ? { ...x, qty: Math.max(1, q) } : x))),
    removeLine: (i) => setCart((c) => c.filter((_, k) => k !== i)),
    clearCart: () => setCart([]),
    wishlist, toggleWish: (s) => setWish((w) => (w.includes(s) ? w.filter((x) => x !== s) : [...w, s])),
    user, login: setUser, logout: () => setUser(null),
    area, setArea: (a) => { setAreaS(a); save("pb_area", a); },
    toast, hydrated,
  }), [lang, cart, wishlist, user, area, toast, hydrated]);

  return (
    <C.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-sm animate-rise items-center gap-2.5 rounded-lg bg-ink px-4 py-3 text-sm text-white shadow-lift">
            {t.kind === "ok" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" /> : t.kind === "err" ? <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" /> : <Info className="h-4 w-4 shrink-0 text-stone-300" />}
            <span className="font-bn">{t.msg}</span>
            {t.action && <a href={t.action.href} className="ml-1 shrink-0 py-2 font-bn font-semibold text-accent hover:underline">{t.action.label}</a>}
            <button aria-label="Close" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="-mr-2 grid h-9 w-9 shrink-0 place-items-center text-stone-300 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </C.Provider>
  );
}

/** Inline bilingual text driven by the language switcher. */
export function T({ bn, en }: { bn: ReactNode; en: ReactNode }) {
  const { lang } = useApp();
  return <>{lang === "bn" ? bn : en}</>;
}
