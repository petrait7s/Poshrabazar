import Link from "next/link";
import { Logo } from "./Logo";
import { categories } from "@/data/catalog";

const col = (title: string, links: [string, string][]) => (
  <div>
    <h4 className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{title}</h4>
    <ul className="space-y-2">{links.map(([l, h]) => <li key={h + l}><Link href={h} className="font-bn text-[14px] text-white/75 transition-colors hover:text-white">{l}</Link></li>)}</ul>
  </div>
);

export function Footer() {
  return (
    <footer className="relative mt-12 overflow-hidden bg-ink-800 pb-20 text-white lg:pb-0">
      <div className="container-x relative grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="white" withBangla />
          <p className="mt-4 max-w-xs font-bn text-[14px] leading-relaxed text-white/70">সিলেটের কৃষক, উৎপাদক, শিক্ষার্থী উদ্যোক্তা ও ক্রেতাদের মার্কেটপ্লেস।</p>
        </div>
        {col("Marketplace", [["সব ক্যাটাগরি", "/categories"], ["আঞ্চলিক পণ্য", "/famous"], ["পাইকারি বাজার", "/wholesale"], ["বিক্রেতা নিবন্ধন", "/seller/register"], ...categories.slice(0, 3).map((c) => [c.bn, `/category/${c.slug}`] as [string, string])])}
        {col("বাজার", [["বাজারদর", "/market-prices"], ["বিক্রেতা নিবন্ধন", "/seller/register"]])}
        {col("Account", [["লগইন", "/login"], ["নিবন্ধন", "/register"], ["কার্ট", "/cart"], ["আমার অর্ডার", "/account/orders"], ["বিক্রেতা ড্যাশবোর্ড", "/seller/dashboard"], ["অ্যাডমিন", "/admin"]])}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PosraBazar · পসরাবাজার</p>
          <p className="font-bn text-white/70">প্রদর্শনী সংস্করণ: পণ্য, দাম ও বিক্রেতার তথ্য ডেমো। কোনো বাস্তব অর্ডার বা পেমেন্ট হয় না। <span className="font-sans text-white/45">Preview build — demo data, no real orders or payments.</span></p>
        </div>
      </div>
    </footer>
  );
}
