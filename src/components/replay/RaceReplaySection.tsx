import { GlassCard, StatusPill } from "@/components/ui";
import type { Championship } from "@/lib/live";
import type { ReplayPackage } from "@/lib/replay";
import { RaceReplayPlayer } from "./RaceReplayPlayer";

type Props = {
  sport: Championship;
  raceName: string;
  circuitName: string;
  circuitSvgUrl: string | null;
  pkg: ReplayPackage | null;
};

function ReplayComingSoon({ raceName }: { raceName: string }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-dashed border-white/15 bg-gradient-to-b from-white/[0.05] to-transparent px-6 py-12 text-center sm:px-10 sm:py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.08),transparent_50%)]"
      />
      <div className="relative mx-auto max-w-md space-y-4">
        <StatusPill tone="amber">Coming soon</StatusPill>
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
          Race Replay Coming Soon
        </h3>
        <p className="text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
          Historical lap data for {raceName} is not available yet. When a replay
          package is published, playback will activate here automatically — no
          fabricated movement, only real race data.
        </p>
      </div>
    </div>
  );
}

/**
 * Headline Race Replay section for completed race pages.
 * Activates RaceReplayPlayer when a ReplayPackage exists; otherwise Coming Soon.
 */
export function RaceReplaySection({
  sport,
  raceName,
  circuitName,
  circuitSvgUrl,
  pkg,
}: Props) {
  const svgUrl = pkg?.circuitSvgUrl ?? circuitSvgUrl;
  const canPlay = pkg !== null && svgUrl !== null;

  return (
    <section
      className="pb-2 pt-2"
      aria-label="Race replay"
      data-sport={sport}
    >
      <GlassCard className="!p-5 sm:!p-7">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Race Replay
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
            Relive the race
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
            Scrub lap by lap, watch the leaders, and see flags and pit stops as
            they happened — on the same circuit map used for live timing.
          </p>
        </div>

        {canPlay && pkg && svgUrl ? (
          <RaceReplayPlayer
            pkg={pkg}
            circuitSvgUrl={svgUrl}
            circuitName={circuitName}
          />
        ) : (
          <ReplayComingSoon raceName={raceName} />
        )}
      </GlassCard>
    </section>
  );
}
