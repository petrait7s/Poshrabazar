import type { Metadata, Viewport } from "next";
import { Montserrat, Tiro_Bangla } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SocialProvider } from "@/components/social";
import { Header, BottomNav } from "@/components/Header";
import { Footer } from "@/components/Footer";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
const bangla = Tiro_Bangla({ subsets: ["bengali", "latin"], weight: "400", variable: "--font-bangla", display: "swap" });

export const metadata: Metadata = {
  title: { default: "PosraBazar · পসরাবাজার — Buy. Sell. Learn. Grow.", template: "%s · PosraBazar" },
  description: "বাংলার উন্মুক্ত ডিজিটাল বাজার — কৃষক, ব্যবসায়ী, পাইকার ও ক্রেতা সবাই এক বাজারে। Open marketplace & business ecosystem for Bangladesh.",
};
export const viewport: Viewport = { themeColor: "#142B45", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${montserrat.variable} ${bangla.variable}`}>
      <body>
        <Providers>
          <SocialProvider>
            <Header />
            <main id="main" className="min-h-[60vh]">{children}</main>
            <Footer />
            <BottomNav />
          </SocialProvider>
        </Providers>
      </body>
    </html>
  );
}
