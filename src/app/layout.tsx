import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Rajdhani } from "next/font/google";
import Link from "next/link";
import { BottomTabBar } from "@/components/BottomTabBar";
import { NavbarBrand } from "@/components/brand/NavbarBrand";
import { SportAwareDesktopNav } from "@/components/SportAwareDesktopNav";
import { SportAwareFooter } from "@/components/SportAwareFooter";
import { SportPreferenceProvider } from "@/components/SportPreferenceProvider";
import { SportSwitcher } from "@/components/SportSwitcher";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const rajdhani = Rajdhani({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://pitwall-apex.vercel.app"
  ),
  title: {
    default: "PitWall Apex — Motorsport Weekend Hub",
    template: "%s | PitWall Apex",
  },
  description:
    "Your motorsport weekend hub. Live timing, session schedules, championship standings, and race intelligence for Formula 1 and MotoGP.",
  applicationName: "PitWall Apex",
  keywords: [
    "Formula 1",
    "F1",
    "MotoGP",
    "live timing",
    "race schedule",
    "standings",
    "Grand Prix",
    "race strategy",
  ],
  authors: [{ name: "PitWall Apex" }],
  openGraph: {
    title: "PitWall Apex — Motorsport Weekend Hub",
    description:
      "Your motorsport weekend hub. Live timing, session schedules, championship standings, and race intelligence for Formula 1 and MotoGP.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PitWall Apex — Motorsport Weekend Hub",
    description:
      "Your motorsport weekend hub. Live timing, session schedules, championship standings, and race intelligence for Formula 1 and MotoGP.",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} scroll-smooth antialiased`}
    >
      <body className="pb-16 md:pb-0">
        <SportPreferenceProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-amber-300 focus:px-4 focus:py-2 focus:text-slate-950 focus:outline-none"
          >
            Skip to main content
          </a>
          <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07090f]/80 backdrop-blur-xl">
            <div className="layout-shell flex h-16 items-center justify-between sm:h-[4.5rem]">
              <Link
                href="/"
                aria-label="PitWall Apex home"
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <NavbarBrand />
              </Link>

              <div className="hidden md:flex">
                <SportAwareDesktopNav />
              </div>
              <div className="md:hidden">
                <SportSwitcher />
              </div>
            </div>
          </header>

          <main id="main-content" aria-label="Main content">
            {children}
          </main>

          <SportAwareFooter />

          <BottomTabBar />
        </SportPreferenceProvider>
      </body>
    </html>
  );
}
