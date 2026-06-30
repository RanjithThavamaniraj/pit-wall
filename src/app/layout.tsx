import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Rajdhani } from "next/font/google";
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
      <body className="pb-[4.75rem] md:pb-0">{children}</body>
    </html>
  );
}
