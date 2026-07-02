import { StatusPill } from "@/components/ui";
import type {
  DriverIntelligenceBundle,
  DriverIntelligenceProfile,
} from "@/lib/driver-intelligence/types";
import { formatLocalTimeOnly } from "@/lib/utils";
import { DriverProfileCard } from "./DriverProfileCard";

type Props = {
  /**
   * Pre-resolved intelligence bundle — typically produced server-side via
   * `fetchDriverIntelligence(context)` so no `fs/promises` import reaches
   * the client bundle. `null` triggers the empty state.
   */
  bundle: DriverIntelligenceBundle | null;
  headingId?: string;
  className?: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function bundleSummaryLabels(bundle: DriverIntelligenceBundle) {
  const high = bundle.profiles.filter((p) => p.confidence === "high").length;
  const total = bundle.profiles.length;
  return { high, total };
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-slate-950/40 px-5 py-12 text-center">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-400">{body}</p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

export function DriverIntelligencePanel({
  bundle,
  headingId,
  className = "",
}: Props) {
  const profiles: DriverIntelligenceProfile[] = bundle
    ? [...bundle.profiles].sort(
        (a, b) =>
          b.ratings.momentum - a.ratings.momentum ||
          a.name.localeCompare(b.name)
      )
    : [];

  const sport = bundle?.sport;
  const isMotoGp = sport === "motogp";
  const isEmpty = !bundle || profiles.length === 0;
  const summary =
    bundle && profiles.length > 0 ? bundleSummaryLabels(bundle) : null;

  return (
    <section
      aria-labelledby={headingId}
      aria-label="Driver intelligence"
      className={className}
    >
      <div className="space-y-4">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Driver intelligence
            </p>
            <h2
              id={headingId}
              className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl"
            >
              {isMotoGp ? "Rider intelligence" : "Driver intelligence"}
            </h2>
            {summary ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {summary.total} {isMotoGp ? "riders" : "drivers"} ·{" "}
                {summary.high} at high confidence · ranked by momentum.
              </p>
            ) : (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Recent-form intelligence for every{" "}
                {isMotoGp ? "rider" : "driver"} across the last few completed
                weekends.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {bundle && profiles.length > 0 ? (
              <StatusPill tone="amber">
                <span
                  className="mr-1.5 inline-block size-1.5 rounded-full bg-amber-300"
                  aria-hidden="true"
                />
                {bundle.profiles.length} profiles
              </StatusPill>
            ) : null}
          </div>
        </div>

        {/* body */}
        {isEmpty ? (
          <EmptyState
            title="No profiles yet"
            body="Driver intelligence will populate here once enough completed weekends are available."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {profiles.map((profile) => (
                <DriverProfileCard
                  key={profile.id}
                  profile={profile}
                  headingId={`${headingId ?? "driver-intelligence"}-${profile.id}`}
                />
              ))}
            </div>

            {bundle?.generatedAt ? (
              <p
                className="px-1 font-mono text-[11px] text-slate-600"
                suppressHydrationWarning
                title={bundle.generatedAt}
              >
                Intelligence generated {formatLocalTimeOnly(bundle.generatedAt)}
                {bundle.sourceSlugs.length
                  ? ` · ${bundle.sourceSlugs.length} weekend${
                      bundle.sourceSlugs.length === 1 ? "" : "s"
                    } of form`
                  : ""}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
