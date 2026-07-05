import Link from "next/link";
import { GlassCard, PageSection, SectionHeading } from "@/components/ui";
import type { WeekendOutlookView } from "@/lib/weekend-context/outlook";

function Stars({ count }: { count: number }) {
  return (
    <span
      className="font-mono text-lg tracking-[0.05em] text-amber-300"
      aria-label={`${count} out of 5`}
    >
      {"★".repeat(count)}
      <span className="text-white/15">{"★".repeat(5 - count)}</span>
    </span>
  );
}

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
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {outlook.phaseLine}
          </p>

          {outlook.hasSignal ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Stars count={outlook.stars} />
                <span className="text-lg font-semibold text-white">
                  {outlook.name}
                </span>
                {outlook.team ? (
                  <span className="text-sm text-slate-400">
                    {outlook.team}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {outlook.reason}
              </p>

              {outlook.topContenders.length > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Top Contenders
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-200">
                    {outlook.topContenders.map((contender) => (
                      <li key={contender.name}>• {contender.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {outlook.keyWatch.length > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Key Watch
                  </p>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-400">
                    {outlook.keyWatch.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
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
