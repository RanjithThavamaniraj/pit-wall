import { StatusPill } from "@/components/ui";
import type { Championship } from "@/lib/live";
import { replayCompetitorLabel, replaySportLabel } from "@/lib/replay";
import { ReplayStatus } from "./ReplayStatus";

export type ReplayUnavailableReason =
  | "missing_package"
  | "missing_circuit"
  | "sport_mismatch";

type Props = {
  sport: Championship;
  raceName: string;
  reason: ReplayUnavailableReason;
};

function reasonCopy(
  sport: Championship,
  raceName: string,
  reason: ReplayUnavailableReason
): { title: string; body: string; availability: string } {
  const sportLabel = replaySportLabel(sport);
  const competitors = replayCompetitorLabel(sport);

  switch (reason) {
    case "missing_circuit":
      return {
        title: "Circuit map unavailable",
        availability: "Replay package found · map missing",
        body: `A replay package exists for ${raceName}, but the circuit outline is not available yet. Playback unlocks automatically once the ${sportLabel} circuit asset is published.`,
      };
    case "sport_mismatch":
      return {
        title: "Replay unavailable",
        availability: "Package rejected · sport mismatch",
        body: `Historical data for this weekend does not match ${sportLabel}. MotoGP and Formula 1 packages stay isolated so ${competitors} never cross championships.`,
      };
    case "missing_package":
    default:
      return {
        title: "Race Replay Coming Soon",
        availability: "Historical lap data not published",
        body: `Lap-by-lap replay for ${raceName} is not available yet. When a verified ${sportLabel} ReplayPackage is published, this player activates automatically — no fabricated movement, only real race data.`,
      };
  }
}

/**
 * Premium empty state shared by F1 and MotoGP.
 * Differences come only from sport + reason props.
 */
export function ReplayEmptyState({ sport, raceName, reason }: Props) {
  const copy = reasonCopy(sport, raceName, reason);

  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] border border-dashed border-white/15 bg-gradient-to-b from-white/[0.05] via-transparent to-black/20 px-6 py-10 text-center sm:px-10 sm:py-12"
      role="status"
      aria-live="polite"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.08),transparent_50%)]"
      />
      <div className="relative mx-auto flex max-w-lg flex-col items-center gap-5">
        <ReplayStatus status="unavailable" detail={replaySportLabel(sport)} />

        <div className="space-y-3">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
            {copy.title}
          </h3>
          <p className="text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
            {copy.body}
          </p>
        </div>

        <dl className="grid w-full gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-left sm:grid-cols-2 sm:px-5">
          <div>
            <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">
              Availability
            </dt>
            <dd className="mt-1.5 text-sm text-slate-300">{copy.availability}</dd>
          </div>
          <div>
            <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">
              Status
            </dt>
            <dd className="mt-1.5">
              <StatusPill tone="neutral">Waiting for package</StatusPill>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">
              Next
            </dt>
            <dd className="mt-1.5 text-sm text-slate-400">
              Publishing a ReplayPackage under{" "}
              <span className="font-mono text-slate-300">
                data/replays/{sport}/
              </span>{" "}
              enables this player with no UI changes.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
