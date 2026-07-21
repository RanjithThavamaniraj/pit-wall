import { GlassCard } from "@/components/ui";
import type { Championship } from "@/lib/live";
import type { ReplayPackage } from "@/lib/replay";
import {
  replaySectionDescription,
  replaySectionEyebrow,
  replaySectionTitle,
  replaySessionLabel,
} from "@/lib/replay";
import { RaceReplayPlayer } from "./RaceReplayPlayer";
import {
  ReplayEmptyState,
  type ReplayUnavailableReason,
} from "./ReplayEmptyState";

type Props = {
  sport: Championship;
  raceName: string;
  circuitName: string;
  circuitSvgUrl: string | null;
  pkg: ReplayPackage | null;
};

function unavailableReason(
  sport: Championship,
  pkg: ReplayPackage | null,
  circuitSvgUrl: string | null
): ReplayUnavailableReason {
  if (pkg && pkg.sport !== sport) return "sport_mismatch";
  if (pkg && !(pkg.circuitSvgUrl ?? circuitSvgUrl)) return "missing_circuit";
  return "missing_package";
}

/**
 * Headline Race Replay section for completed race pages.
 * Shared by Formula 1 and MotoGP — differences come only from data.
 */
export function RaceReplaySection({
  sport,
  raceName,
  circuitName,
  circuitSvgUrl,
  pkg,
}: Props) {
  const svgUrl = pkg?.circuitSvgUrl ?? circuitSvgUrl;
  const canPlay = pkg !== null && pkg.sport === sport && svgUrl !== null;
  const sessionKind = pkg?.sessionKind ?? "race";

  return (
    <section
      className="pb-2 pt-2"
      aria-label={`${sport === "motogp" ? "MotoGP" : "Formula 1"} race replay`}
      data-sport={sport}
    >
      <GlassCard className="!p-5 sm:!p-7">
        <div className="mb-6 space-y-2 sm:mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            {replaySectionEyebrow(sport)}
            {pkg ? ` · ${replaySessionLabel(sessionKind)}` : ""}
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
            {replaySectionTitle(sessionKind)}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
            {replaySectionDescription(sport)}
          </p>
        </div>

        {canPlay && pkg && svgUrl ? (
          <RaceReplayPlayer
            pkg={pkg}
            circuitSvgUrl={svgUrl}
            circuitName={circuitName}
          />
        ) : (
          <ReplayEmptyState
            sport={sport}
            raceName={raceName}
            reason={unavailableReason(sport, pkg, circuitSvgUrl)}
          />
        )}
      </GlassCard>
    </section>
  );
}
