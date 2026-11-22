import Image from "next/image";
import { HomeSearch } from "@/components/home/HomeSearch";
import { NearbyProducts } from "@/components/home/NearbyProducts";
import { RegionIndex } from "@/components/home/RegionIndex";
import { StoresSection } from "@/components/home/Stores";
import { PriceCompare } from "@/components/home/PriceCompare";

const facts = ["সরাসরি উৎপাদক", "উৎস ও তারিখ স্পষ্ট", "খুচরা ও পাইকারি"];

export default function Home() {
  return (
    <>
      {/* Hero: an editorial statement, then a photograph */}
      <section aria-labelledby="hero-h" className="container-x pt-8 lg:grid lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14 lg:pb-4 lg:pt-14">
        <div>
          <p className="flex items-center gap-2 text-[12.5px] font-semibold tracking-[0.04em] text-primary"><span aria-hidden className="h-px w-5 bg-primary" />সিলেট থেকে শুরু</p>
          <h1 id="hero-h" className="mt-3 text-[32px] leading-[1.38] tracking-[-0.01em] lg:text-[52px] lg:leading-[1.3]">
            স্থানীয় পণ্য,<br />স্থানীয় মানুষের<br /><span className="text-primary">কাছ থেকে</span>
          </h1>
          <p className="mt-3 max-w-[320px] text-[15px] leading-[1.65] text-stone-600 lg:max-w-md lg:text-base">কৃষক, উৎপাদক ও শিক্ষার্থী উদ্যোক্তাদের পণ্য। উৎস দেখে, দাম মিলিয়ে কিনুন।</p>
          <div className="mt-6 lg:max-w-md"><HomeSearch /></div>
          <ol className="mt-8 hidden grid-cols-3 gap-3 lg:grid lg:max-w-md">
            {facts.map((f, i) => (
              <li key={f} className="border-t border-ink pt-3">
                <span className="block text-[11.5px] font-semibold tracking-[0.08em] text-primary">০{["১", "২", "৩"][i]}</span>
                <span className="mt-0.5 block text-[13.5px] leading-normal">{f}</span>
              </li>
            ))}
          </ol>
        </div>
        <figure className="-mx-4 mt-8 sm:-mx-6 lg:mx-0 lg:mt-0">
          <div className="relative h-[292px] w-full lg:h-[460px] lg:overflow-hidden lg:rounded">
            <Image src="/harvest.webp" alt="ভোরের আলোয় ধান কাটছেন একজন কৃষক" fill priority sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" style={{ objectPosition: "74% 50%" }} />
          </div>
          <figcaption className="px-4 pt-2 text-[12.5px] leading-normal text-muted sm:px-6 lg:px-0">ধান কাটার মৌসুম, মাঠ থেকে সরাসরি</figcaption>
        </figure>
        <ol className="mt-6 grid grid-cols-3 gap-3 lg:hidden">
          {facts.map((f, i) => (
            <li key={f} className="border-t border-ink pt-3">
              <span className="block text-[11.5px] font-semibold tracking-[0.08em] text-primary">০{["১", "২", "৩"][i]}</span>
              <span className="mt-0.5 block text-[13.5px] leading-normal">{f}</span>
            </li>
          ))}
        </ol>
      </section>

      <NearbyProducts />

      {/* Regions: an index, not cards */}
      <section aria-labelledby="reg-h" className="container-x pt-12 lg:grid lg:grid-cols-[1fr_1.4fr] lg:gap-14 lg:pt-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-semibold tracking-[0.04em] text-primary">উপজেলা অনুযায়ী</p>
          <h2 id="reg-h" className="text-[22px] leading-snug lg:text-[28px]">এলাকা ধরে খুঁজুন</h2>
          <p className="text-[13.5px] leading-normal text-muted">কোন উপজেলার মাঠ, নদী ও বাগান থেকে পণ্য আসছে</p>
        </div>
        <div className="mt-4 lg:mt-0"><RegionIndex /></div>
      </section>

      <StoresSection />

      {/* Retail & wholesale */}
      <section aria-labelledby="pr-h" className="mt-12 border-y border-line bg-surface py-10 lg:mt-20 lg:py-16">
        <div className="container-x lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div className="mb-6 lg:mb-0">
            <p className="text-xs font-semibold tracking-[0.04em] text-primary">খুচরা ও পাইকারি</p>
            <h2 id="pr-h" className="text-[22px] leading-snug lg:text-[28px]">বেশি নিলে, কম দাম</h2>
            <p className="max-w-sm text-[13.5px] leading-normal text-muted">দোকানদার, পাইকার ও বড় পরিবারের জন্য। ন্যূনতম পরিমাণ পূরণ হলেই পাইকারি দর।</p>
          </div>
          <PriceCompare />
        </div>
      </section>

      <p className="container-x py-6 text-xs leading-relaxed text-muted">এই পাতার দাম, উৎপাদক, দোকান ও দূরত্ব নমুনা (ডেমো)। পণ্যের ছবি অস্থায়ী; আসল ছবি যুক্ত হবে। আপাতত শুধু ক্যাশ অন ডেলিভারি।</p>
    </>
  );
}
