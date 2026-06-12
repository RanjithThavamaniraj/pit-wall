import type { Metadata } from "next";
import Link from "next/link";
import { Container, GlassCard } from "@/components/ui";

export const metadata: Metadata = {
  title: "Live Timing",
  description:
    "Real-time Formula 1 session timing, positions, gaps, and race control messages.",
};

export default function LivePage() {
  return (
    <section className="relative isolate flex min-h-[70vh] items-center overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(248,113,113,0.08),transparent_60%)]"
      />
      <Container>
        <div className="mx-auto max-w-xl">
          <GlassCard className="text-center">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-red-400/10 ring-1 ring-red-400/20">
              <span className="text-2xl" aria-hidden="true">🏁</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-300">
              Coming soon
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              Live timing is on its way
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Real-time positions, gaps, sector times, tyre data, and race
              control messages — powered by OpenF1. Check back for the next race
              weekend.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/races"
                className="rounded-full bg-amber-300 px-6 py-3 text-center text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                View race schedule
              </Link>
              <Link
                href="/standings"
                className="rounded-full border border-white/15 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                Championship standings
              </Link>
            </div>
          </GlassCard>
        </div>
      </Container>
    </section>
  );
}
