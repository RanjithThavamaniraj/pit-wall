"use client";

import { Container } from "@/components/ui";
import { SessionDial } from "@/components/home/SessionDial";

export type HeroBoardSession = {
  id: string;
  shortLabel: string;
  label: string;
  status: "completed" | "live" | "upcoming";
  dateUtc?: string;
};

export type HeroChampionship = {
  leaderCode: string;
  leaderName: string;
  leaderTeam: string;
  leaderPoints: number;
  leaderColor?: string;
  chaserName: string;
  gapPoints: string;
  round: number;
  titleLabel: string;
};

export type PitWallHeroBoardProps = {
  sport: "f1" | "motogp";
  sportLabel: string;
  season: number;
  round: number;
  raceTitle: string;
  circuit: string;
  locality: string;
  country: string;
  flag: string;
  weekendLabel: string;
  isLive: boolean;
  sessions: HeroBoardSession[];
  countdown?: { dateUtc: string; label: string; isRace?: boolean };
  detailHref: string;
  liveHref: string;
  championship: HeroChampionship | null;
  circuitSvg?: string | null;
};

export function PitWallHeroBoard({
  sport,
  sportLabel,
  season,
  round,
  raceTitle,
  circuit,
  locality,
  country,
  flag,
  weekendLabel,
  isLive,
  sessions,
  countdown,
  detailHref,
  liveHref,
  championship,
  circuitSvg,
}: PitWallHeroBoardProps) {
  const roundLabel = `R${String(round).padStart(2, "0")}`;

  const secondaryLocation =
    locality && locality.toLowerCase() !== circuit.toLowerCase()
      ? locality
      : country && country.toLowerCase() !== circuit.toLowerCase()
      ? country
      : null;

  return (
    <section id="top" className={`hero-stage hero-stage--${sport}`}>
      <div className="hero-stage-beam" aria-hidden="true" />
      <div className="hero-stage-glow" aria-hidden="true" />
      <div className="hero-stage-speedline" aria-hidden="true" />
      {circuitSvg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={circuitSvg}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="hero-stage-circuit"
        />
      )}
      <div className="hero-stage-vignette" aria-hidden="true" />
      <div className="hero-stage-checker" aria-hidden="true" />
      <div className="hero-stage-round" aria-hidden="true">
        {roundLabel}
      </div>
      <div className="hero-stage-fade" aria-hidden="true" />

      <Container wide className="relative z-[2] flex min-h-[inherit] flex-col justify-center py-12 sm:py-16 lg:py-20">
        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-slate-500 lg:justify-start">
          {isLive && (
            <span className="hero-live-dot flex items-center gap-2 text-red-400">
              <span className="size-2 rounded-full bg-red-500" />
              Live
            </span>
          )}
          <span className="text-[color:var(--hero-accent)]">{weekendLabel}</span>
          <span className="text-white/15">·</span>
          <span>
            {sportLabel} {season}
          </span>
          <span className="text-white/15">·</span>
          <span>{roundLabel}</span>
        </div>

        <div className="hero-body">
          <div className="hero-stack">
            <h1 className="font-brand text-[clamp(2.75rem,10vw,5.5rem)] font-bold uppercase leading-[0.88] tracking-tight text-white xl:text-[clamp(3.5rem,5vw,5rem)]">
              {raceTitle}
            </h1>
            <p className="mt-2 font-brand text-base font-semibold uppercase tracking-[0.42em] text-[color:var(--hero-accent)] sm:text-lg">
              Grand Prix
            </p>
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-base text-slate-400 sm:mt-5 lg:justify-start">
              <span className="text-3xl" aria-hidden="true">
                {flag}
              </span>
              <span className="text-lg text-slate-200">{circuit}</span>
              {secondaryLocation ? (
                <>
                  <span className="text-white/20">·</span>
                  <span>{secondaryLocation}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="hero-body__dial">
            <SessionDial
              sessions={sessions}
              detailHref={detailHref}
              liveHref={liveHref}
              countdown={countdown}
            />
          </div>
        </div>

        <div className="hero-footer">
          {championship && (
            <div className="hero-standings">
              <div className="flex flex-col gap-6 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
                    {championship.titleLabel}
                  </p>
                  <p className="mt-2 font-brand text-2xl font-bold text-white sm:text-3xl">
                    {championship.leaderName}
                    <span className="ml-2 text-sm font-semibold text-[color:var(--hero-accent)]">
                      {championship.leaderCode}
                    </span>
                    <span className="ml-2 text-lg text-slate-500">
                      {championship.leaderPoints} pts
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{championship.leaderTeam}</p>
                </div>
                <div className="flex flex-wrap items-end justify-center gap-8 font-mono text-sm lg:justify-end">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
                      Chasing
                    </p>
                    <p className="mt-1 text-white">{championship.chaserName}</p>
                    <p className="text-amber-200/90">{championship.gapPoints}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
                      Round
                    </p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {championship.round}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
