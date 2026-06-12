import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Pit Wall — Premium motorsport companion",
  description:
    "A premium motorsport companion app for live timing, race strategy, telemetry insight, and intelligent Grand Prix briefings.",
  applicationName: "Pit Wall",
  keywords: ["motorsport", "Formula 1", "live timing", "telemetry", "race strategy", "Grand Prix"],
  authors: [{ name: "Pit Wall" }],
  openGraph: {
    title: "Pit Wall — Premium motorsport companion",
    description: "Live timing, strategy intelligence, telemetry narratives, and race-control context for every racing weekend.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} scroll-smooth antialiased`}>
      <body>{children}</body>
    </html>
  );
}
