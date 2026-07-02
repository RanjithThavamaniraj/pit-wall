import { GlassCard, StatusPill } from "@/components/ui";
import type {
  DriverConfidence,
  DriverIntelligenceProfile,
  DriverRatings,
  TraitItem,
} from "@/lib/driver-intelligence";

type Props = {
  profile: DriverIntelligenceProfile;
  /** Display order of the most recent form results, newest first (already-cut). */
  headingId?: string;
  className?: string;
};

const CONFIDENCE_TONE: Record<
  DriverConfidence,
  "amber" | "neutral" | "blue"
> = {
  high: "amber",
  medium: "neutral",
  low: "blue",
};

const CONFIDENCE_LABEL: Record<DriverConfidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

function RatingBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold text-amber-300">{pct}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RatingsBlock({ ratings }: { ratings: DriverRatings }) {
  return (
    <div className="space-y-3.5">
      <RatingBar label="Momentum" value={ratings.momentum} />
      <RatingBar label="Qualifying" value={ratings.qualifying} />
      <RatingBar label="Race Pace" value={ratings.racePace} />
      <RatingBar label="Consistency" value={ratings.consistency} />
      <RatingBar label="Overtaking" value={ratings.overtaking} />
      <RatingBar label="Tyre Management" value={ratings.tyreManagement} />
    </div>
  );
}

function RecentFormBadges({
  profile,
}: {
  profile: DriverIntelligenceProfile;
}) {
  const { lastThree } = profile.recentForm;
  if (lastThree.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {lastThree.map((r) => {
        const isDnf = r.position === null;
        const tone = isDnf
          ? "red"
          : r.position === 1
          ? "amber"
          : r.position !== null && r.position <= 3
          ? "neutral"
          : "blue";
        const label = isDnf ? "DNF" : `P${r.position}`;
        return (
          <StatusPill key={`${r.slug}-${r.round}`} tone={tone}>
            {label}
          </StatusPill>
        );
      })}
    </div>
  );
}

function TraitList({
  title,
  items,
  tone,
}: {
  title: string;
  items: TraitItem[];
  tone: "strength" | "weakness";
}) {
  if (items.length === 0) return null;
  const bulletTone =
    tone === "strength" ? "text-amber-300" : "text-rose-300/80";
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {title}
      </p>
      <ul role="list" className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-2 text-xs leading-5 text-slate-300"
          >
            <span
              aria-hidden="true"
              className={`mt-1 inline-block size-1 shrink-0 rounded-full ${bulletTone} ${
                tone === "strength" ? "bg-amber-300" : "bg-rose-300/80"
              }`}
            />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DriverProfileCard({
  profile,
  headingId,
  className = "",
}: Props) {
  const isHigh = profile.confidence === "high";
  const trend = profile.weekendTrend;

  return (
    <GlassCard className={`relative overflow-hidden ${className}`}>
      {isHigh ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
        />
      ) : null}

      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-0">
          <h3
            id={headingId}
            className="text-lg font-semibold tracking-[-0.02em] text-white"
          >
            {profile.name}
          </h3>
          {profile.team ? (
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {profile.team}
            </p>
          ) : null}
        </div>
        <StatusPill tone={CONFIDENCE_TONE[profile.confidence]}>
          {CONFIDENCE_LABEL[profile.confidence]}
        </StatusPill>
      </div>

      {/* trend */}
      <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-slate-950/40 px-4 py-3">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 text-sm text-amber-200"
        >
          ↗
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Weekend trend
          </p>
          <p className="mt-0.5 text-sm font-semibold text-amber-100/90">
            {trend.label}
          </p>
        </div>
      </div>

      {/* ratings */}
      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Ratings
        </p>
        <div className="mt-3">
          <RatingsBlock ratings={profile.ratings} />
        </div>
      </div>

      {/* recent form */}
      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Recent form
        </p>
        <div className="mt-3">
          <RecentFormBadges profile={profile} />
        </div>
      </div>

      {/* strengths / weaknesses */}
      <div className="mt-5 space-y-4 border-t border-white/[0.06] pt-5">
        <TraitList
          title="Strengths"
          items={profile.strengths}
          tone="strength"
        />
        <TraitList
          title="Weaknesses"
          items={profile.weaknesses}
          tone="weakness"
        />
      </div>
    </GlassCard>
  );
}