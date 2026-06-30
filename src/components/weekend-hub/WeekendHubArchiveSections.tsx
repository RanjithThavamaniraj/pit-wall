import Link from "next/link";
import type { RaceWeekendSummary } from "@/lib/race-summary/types";
import type { WeekendHubData } from "@/lib/weekend-hub";
import { GlassCard } from "@/components/ui";
import {
  PodiumCard,
  PredictionSummary,
  WeekendSummary,
} from "@/components/weekend-summary";

type MotoGpPodiumFinisher = {
  position: number;
  riderName: string;
  riderNumber: number;
  teamName: string;
};

type Props = {
  data: WeekendHubData;
  summary: RaceWeekendSummary | null;
  motogpPodium?: MotoGpPodiumFinisher[];
};

function MotoGpPodiumFallback({
  podium,
  standingsHref,
}: {
  podium: MotoGpPodiumFinisher[];
  standingsHref: string;
}) {
  return (
    <GlassCard>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        Race results
      </p>
      <ol className="mt-4 space-y-3">
        {podium.map((finisher) => (
          <li
            key={finisher.position}
            className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-slate-950/40 px-4 py-3"
          >
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-amber-200">
                P{finisher.position}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  {finisher.riderName}
                </p>
                <p className="text-xs text-slate-500">
                  #{finisher.riderNumber} · {finisher.teamName}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <Link
        href={standingsHref}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 transition hover:text-amber-200"
      >
        View championship standings →
      </Link>
    </GlassCard>
  );
}

function StandingsLinkCard({ standingsHref }: { standingsHref: string }) {
  return (
    <GlassCard>
      <p className="text-sm text-slate-400">
        This race has concluded. Points from this round are reflected in the
        championship standings.
      </p>
      <Link
        href={standingsHref}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 transition hover:text-amber-200"
      >
        View championship standings →
      </Link>
    </GlassCard>
  );
}

export function WeekendHubArchiveSections({
  data,
  summary,
  motogpPodium = [],
}: Props) {
  if (!data.isPast) return null;

  const hasSummary = Boolean(summary);
  const hasPrediction = Boolean(summary?.communityPrediction);
  const hasRaceResults = Boolean(summary?.raceResults?.length);
  const hasSprintResults = Boolean(summary?.sprintResults?.length);
  const hasMotogpPodium = motogpPodium.length > 0;

  return (
    <div className="space-y-5">
      {hasPrediction && summary ? (
        <section aria-labelledby="weekend-hub-predictions">
          <h2
            id="weekend-hub-predictions"
            className="sr-only"
          >
            Predictions
          </h2>
          <PredictionSummary
            sport={summary.sport}
            prediction={summary.communityPrediction}
          />
        </section>
      ) : null}

      {hasRaceResults && summary ? (
        <section aria-labelledby="weekend-hub-results">
          <h2
            id="weekend-hub-results"
            className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400"
          >
            Results
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <PodiumCard
              sport={summary.sport}
              title={
                summary.sport === "f1" ? "Race Results" : "Grand Prix Results"
              }
              icon="🏆"
              finishers={summary.raceResults}
            />
            {summary.sport === "motogp" && hasSprintResults ? (
              <PodiumCard
                sport={summary.sport}
                title="Sprint Results"
                icon="🏁"
                finishers={summary.sprintResults!}
              />
            ) : null}
          </div>
        </section>
      ) : hasMotogpPodium ? (
        <section aria-labelledby="weekend-hub-results">
          <h2 id="weekend-hub-results" className="sr-only">
            Results
          </h2>
          <MotoGpPodiumFallback
            podium={motogpPodium}
            standingsHref={data.standingsHref}
          />
        </section>
      ) : !hasSummary ? (
        <StandingsLinkCard standingsHref={data.standingsHref} />
      ) : null}

      {hasSummary && summary ? (
        <section aria-labelledby="weekend-hub-summary">
          <h2
            id="weekend-hub-summary"
            className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400"
          >
            Weekend summary
          </h2>
          <WeekendSummary
            summary={summary}
            omit={
              hasPrediction || hasRaceResults
                ? ["predictions", "podium"]
                : undefined
            }
          />
        </section>
      ) : null}
    </div>
  );
}
