import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { BottomTabBar } from "@/components/BottomTabBar";
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

export const metadata: Metadata = {
  title: {
    default: "Pit Wall — F1 Race Companion",
    template: "%s | Pit Wall",
  },
  description:
    "Your Formula 1 race weekend companion. Live timing, session schedules, championship standings, and race intelligence for every Grand Prix.",
  applicationName: "Pit Wall",
  keywords: [
    "Formula 1",
    "F1",
    "live timing",
    "race schedule",
    "F1 standings",
    "Grand Prix",
    "race strategy",
    "telemetry",
  ],
  authors: [{ name: "Pit Wall" }],
  openGraph: {
    title: "Pit Wall — F1 Race Companion",
    description:
      "Live timing, session schedules, championship standings, and race intelligence for every Grand Prix.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // enables safe-area-inset for notched iPhones
};

const desktopNavLinks = [
  { href: "/live", label: "Live" },
  { href: "/standings", label: "Standings" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} scroll-smooth antialiased`}
    >
      <body className="pb-16 md:pb-0">
        {/* ─── Desktop header ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07090f]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-300 text-lg font-black text-slate-950 shadow-lg shadow-amber-500/20">
                PW
              </span>
              <span>
                <span className="block text-base font-semibold tracking-tight text-white">
                  Pit Wall
                </span>
                <span className="block text-xs uppercase tracking-[0.22em] text-slate-400">
                  F1 race companion
                </span>
              </span>
            </Link>

            {/* Desktop nav — hidden on mobile (bottom tab bar handles mobile) */}
            <nav
              aria-label="Primary navigation"
              className="hidden items-center gap-7 md:flex"
            >
              {desktopNavLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-slate-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* ─── Page content ─────────────────────────────────────────────── */}
        <main>{children}</main>

        {/* ─── Footer (desktop only — mobile has bottom tab bar) ────────── */}
        <footer className="hidden border-t border-white/10 py-8 md:block">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
            <p>© {new Date().getFullYear()} Pit Wall. F1 race companion.</p>
            <p>Data provided by OpenF1 &amp; Jolpica. Not affiliated with Formula 1.</p>
          </div>
        </footer>

        {/* ─── Mobile bottom tab bar ───────────────────────────────────── */}
        <BottomTabBar />
      </body>
    </html>
  );
}
