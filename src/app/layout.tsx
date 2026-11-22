import type { Metadata, Viewport } from "next";
import { Inter, Tiro_Bangla } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SocialProvider } from "@/components/social";
import { Header, BottomNav } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Tiro Bangla ships a single weight (400). Hierarchy for Bengali therefore comes from size, colour and spacing.
const bangla = Tiro_Bangla({ subsets: ["bengali"], weight: "400", variable: "--font-bangla", display: "swap" });

export const metadata: Metadata = {
  title: { default: "PosraBazar · পসরাবাজার", template: "%s · PosraBazar" },
  description: "সিলেটের কৃষক, উৎপাদক, শিক্ষার্থী উদ্যোক্তা ও ক্রেতাদের মার্কেটপ্লেস। A community marketplace for farmers, producers and local entrepreneurs in Sylhet, Bangladesh.",
};
export const viewport: Viewport = { themeColor: "#C2410C", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${inter.variable} ${bangla.variable}`}>
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
