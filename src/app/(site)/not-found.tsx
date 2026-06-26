import { Container } from "@/components/ui";
import { SportAwareNotFound } from "@/components/SportAwareNotFound";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center">
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
          <SportAwareNotFound />
        </div>
      </Container>
    </div>
  );
}
