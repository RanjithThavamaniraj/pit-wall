import Link from "next/link";
import { GlassCard, PageSection, SectionHeading, StatusPill } from "@/components/ui";
import type { WeekendOutlookView } from "@/lib/weekend-context/outlook";
import { getSportTerms } from "@/lib/sport-terms";

export function WeekendOutlookSection({
  outlook,
  raceHref,
}: {
  outlook: WeekendOutlookView;
  raceHref: string | null;
}) {
  return (
    <PageSection id="outlook" variant="muted" wide>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16 xl:gap-20">
        <SectionHeading
          eyebrow="WEEKEND OUTLOOK"
          title="Weekend Outlook"
          description="Based on the latest available weekend data — recent form, championship momentum, and driver intelligence — who currently looks strongest. Not a prediction, not a vote."
        />
        <GlassCard className="lg:max-w-lg">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {outlook.phaseLine}
          </p>

          {outlook.hasSignal ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone="amber">{outlook.leadershipLabel}</StatusPill>
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">
                  Rank #{outlook.rank}
                </span>
              </div>

              <div className="mt-4">
                <p className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                  {outlook.name}
                </p>
                {outlook.team ? (
                  <p className="mt-1 text-sm text-slate-400">
                    <span className="text-slate-500">
                      {getSportTerms(outlook.sport).teamOrManufacturer}
                    </span>
                    <span className="mx-1.5 text-slate-600">·</span>
                    {outlook.team}
                  </p>
                ) : null}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 px-4 py-4 sm:px-5">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-slate-500">
                  {outlook.shareLabel}
                </p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <p className="font-mono text-4xl font-semibold tracking-[-0.04em] text-amber-300 tabular-nums">
                    {outlook.formShare}
                    <span className="ml-0.5 text-2xl text-amber-300/70">%</span>
                  </p>
                  <p className="max-w-[11.5rem] text-right text-xs leading-5 text-slate-500">
                    Share of the recent-form pool across completed weekends.
                  </p>
                </div>
                <div
                  className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                    style={{
                      width: `${Math.max(0, Math.min(100, outlook.formShare))}%`,
                    }}
                  />
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                {outlook.contextLine}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {outlook.reason}
              </p>

              {outlook.topContenders.length > 1 && (
                <div className="mt-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Top challengers
                  </p>
                  <ol className="mt-3 space-y-2.5">
                    {outlook.topContenders
                      .filter((c) => c.rank > 1)
                      .map((contender) => (
                        <li
                          key={`${contender.rank}-${contender.name}`}
                          className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2.5 last:border-0 last:pb-0"
                        >
                          <div className="min-w-0">
                            <span className="font-mono text-[0.65rem] text-slate-500">
                              #{contender.rank}
                            </span>
                            <span className="ml-2 text-sm text-slate-200">
                              {contender.name}
                            </span>
                            {contender.team ? (
                              <span className="ml-2 hidden text-xs text-slate-500 sm:inline">
                                {contender.team}
                              </span>
                            ) : null}
                          </div>
                          <span className="shrink-0 font-mono text-xs tabular-nums text-amber-200/90">
                            {contender.formShare}%
                          </span>
                        </li>
                      ))}
                  </ol>
                </div>
              )}

              {outlook.recentTrend.length > 0 && (
                <div className="mt-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Recent trend
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-400">
                    {outlook.recentTrend.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Intelligence profile
                </p>
                <ul className="mt-3 grid grid-cols-2 gap-2">
                  {outlook.insightSlots.map((slot) => (
                    <li
                      key={slot.id}
                      className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"
                    >
                      <p className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-slate-500">
                        {slot.label}
                      </p>
                      <p
                        className={`mt-1 font-mono text-sm tabular-nums ${
                          slot.value != null
                            ? "text-slate-100"
                            : "text-slate-600"
                        }`}
                      >
                        {slot.value ?? "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm leading-6 text-slate-400">
              {outlook.message}
            </p>
          )}

          {raceHref && (
            <Link
              href={raceHref}
              className="mt-6 inline-flex text-sm font-semibold text-amber-300 transition hover:text-amber-200"
            >
              View Full Weekend Intelligence →
            </Link>
          )}
        </GlassCard>
      </div>
    </PageSection>
  );
}
