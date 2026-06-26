import Link from "next/link";
import { BottomTabBar } from "@/components/BottomTabBar";
import { NavbarBrand } from "@/components/brand/NavbarBrand";
import { SportAwareDesktopNav } from "@/components/SportAwareDesktopNav";
import { SportAwareFooter } from "@/components/SportAwareFooter";
import { SportPreferenceProvider } from "@/components/SportPreferenceProvider";
import { SportSwitcher } from "@/components/SportSwitcher";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SportPreferenceProvider>
      <AnalyticsBeacon />
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
  );
}
