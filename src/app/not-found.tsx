import Link from "next/link";
import { Container } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center">
      <Container>
        <div className="mx-auto max-w-lg text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
            404
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em] text-white sm:text-7xl">
            Off the track.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            This page doesn&apos;t exist. Maybe it retired from the race, or
            you took a wrong turn at the chicane.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-full bg-amber-300 px-7 py-4 text-center text-base font-bold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Back to home
            </Link>
            <Link
              href="/races"
              className="rounded-full border border-white/15 px-7 py-4 text-center text-base font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              View race schedule
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
