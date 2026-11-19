import Link from "next/link";
import { Logo } from "./Logo";
import { categories } from "@/data/catalog";

const col = (title: string, links: [string, string][]) => (
  <div>
    <h4 className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">{title}</h4>
    <ul className="space-y-2">{links.map(([l, h]) => <li key={h + l}><Link href={h} className="font-bn text-[14px] text-white/75 transition-colors hover:text-white">{l}</Link></li>)}</ul>
  </div>
);

export function Footer() {
  return (
    <footer className="mt-8 bg-navy-900 pb-20 text-white lg:pb-0">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="white" />
          <p className="mt-4 font-sans text-sm font-semibold text-gold">Buy. Sell. Learn. Grow.</p>
          <p className="mt-2 max-w-xs font-bn text-[14px] leading-relaxed text-white/70">কৃষক, ব্যবসায়ী, পাইকার ও ক্রেতা — সবাই এক বাজারে। One Platform. Every Seller. Every Buyer.</p>
          <p className="mt-5 text-xs text-white/50">Powered by Petra Software Solutions</p>
        </div>
        {col("Marketplace", [["সব ক্যাটাগরি", "/categories"], ["পাইকারি বাজার", "/wholesale"], ["বিক্রেতা নিবন্ধন", "/seller/register"], ...categories.slice(0, 3).map((c) => [c.bn, `/category/${c.slug}`] as [string, string])])}
        {col("Learn & Understand", [["নলেজ হাব", "/knowledge"], ["আজকের বাজারদর", "/market-prices"], ["মার্কেট ইন্টেলিজেন্স", "/market-intelligence"]])}
        {col("Business Solutions", [["PetraPOS", "/business-solutions/petrapos"], ["PetraPMS", "/business-solutions/petrapms"], ["PetraDMS", "/business-solutions/petradms"], ["Khata Lite (বিনামূল্যে)", "/business-solutions"]])}
        {col("Account", [["লগইন", "/login"], ["নিবন্ধন", "/register"], ["কার্ট", "/cart"], ["আমার অর্ডার", "/account/orders"], ["বিক্রেতা ড্যাশবোর্ড", "/seller/dashboard"], ["অ্যাডমিন", "/admin"]])}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PosraBazar · পসরাবাজার. Powered by Petra Software Solutions.</p>
          <p>Preview build: product data, prices and sellers are demonstration values. No real orders or payments.</p>
        </div>
      </div>
    </footer>
  );
}
