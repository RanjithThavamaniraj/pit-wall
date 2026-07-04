import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { PageSection } from "@/components/ui";
import { HomePageGate } from "@/components/HomePageGate";
import { isValidSport, SPORT_COOKIE_KEY, type Sport } from "@/lib/sport";
import { F1HeroBoard } from "@/components/home/F1HeroBoard";
import { MotoGpHeroBoard } from "@/components/home/MotoGpHeroBoard";
import { HeroBoardSkeleton } from "@/components/home/HeroBoardSkeleton";
import { F1WeekendHubSection } from "@/components/home/F1WeekendHubSection";
import { MotoGpWeekendHubSection } from "@/components/home/MotoGpWeekendHubSection";
import { WeekendOutlookSection } from "@/components/home/WeekendOutlook";
import { fetchSeasonSchedule, getCurrentRace, getNextRace } from "@/lib/schedule";
import { fetchMotoGpSchedule, getCurrentMotoGpEvent, getNextMotoGpEvent } from "@/lib/motogp";
import { weekendHubFromF1, weekendHubFromMotoGp, deriveWeekendPhase } from "@/lib/weekend-hub";
import { getWeekendContext } from "@/lib/weekend-context";
import { buildWeekendOutlook, type WeekendOutlookView } from "@/lib/weekend-context/outlook";

function Hero() {
  return (
    <Suspense fallback={<HeroBoardSkeleton />}>
      <F1HeroBoard />
    </Suspense>
  );
}

function WeekendHub() {
  return (
    <Suspense fallback={<WeekendHubSkeleton />}>
      <F1WeekendHubSection />
    </Suspense>
  );
}

function WeekendHubSkeleton() {
  return (
    <PageSection id="features" wide tightTop>
      <div className="hub-section-label">
        <span className="hub-section-label-bar" aria-hidden="true" />
        <span className="hub-section-label-text">Pit wall tools</span>
      </div>
      <div className="max-w-3xl animate-pulse space-y-4">
        <div className="h-10 w-2/3 rounded bg-white/10" />
        <div className="h-5 w-full rounded bg-white/5" />
      </div>
      <div className="hub-board mt-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="hub-board-row pointer-events-none opacity-40">
            <span className="hub-board-channel">—</span>
            <span className="hub-board-tag">—</span>
            <div className="hub-board-body">
              <div className="h-4 w-32 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </PageSection>
  );
}

// ─── Weekend Outlook (data-driven, not a prediction or a vote) ────────────────

type OutlookTeaser = {
  outlook: WeekendOutlookView;
  raceHref: string | null;
};

async function buildF1Outlook(): Promise<OutlookTeaser> {
  try {
    const schedule = await fetchSeasonSchedule("current");
    const past = schedule.races.filter((r) => r.isPast).map((r) => r.slug);
    const race = getCurrentRace(schedule) ?? getNextRace(schedule);
    if (!race) return { outlook: NO_SIGNAL_OUTLOOK, raceHref: null };

    const hubData = weekendHubFromF1(race);
    const context = await getWeekendContext({
      sport: "f1",
      weekendSlug: race.slug,
      weekendName: race.name,
      phase: deriveWeekendPhase(hubData),
      isSprintWeekend: hubData.isSprintWeekend,
      completedWeekendSlugs: past,
      sessions: hubData.sessions,
    });

    return {
      outlook: buildWeekendOutlook(context, hubData.sessions),
      raceHref: `/races/${race.slug}`,
    };
  } catch {
    return { outlook: NO_SIGNAL_OUTLOOK, raceHref: null };
  }
}

async function buildMotoGpOutlook(): Promise<OutlookTeaser> {
  try {
    const schedule = await fetchMotoGpSchedule();
    const past = schedule.races.filter((r) => r.isPast).map((r) => r.slug);
    const race = getCurrentMotoGpEvent(schedule) ?? getNextMotoGpEvent(schedule);
    if (!race) return { outlook: NO_SIGNAL_OUTLOOK, raceHref: null };

    const hubData = weekendHubFromMotoGp(race);
    const context = await getWeekendContext({
      sport: "motogp",
      weekendSlug: race.slug,
      weekendName: race.name,
      phase: deriveWeekendPhase(hubData),
      isSprintWeekend: hubData.isSprintWeekend,
      completedWeekendSlugs: past,
      sessions: hubData.sessions,
    });

    return {
      outlook: buildWeekendOutlook(context, hubData.sessions),
      raceHref: `/motogp/races/${race.slug}`,
    };
  } catch {
    return { outlook: NO_SIGNAL_OUTLOOK, raceHref: null };
  }
}

const NO_SIGNAL_OUTLOOK: WeekendOutlookView = {
  hasSignal: false,
  phaseLine: "Before FP1 — arriving on recent form",
  message:
    "Not enough completed-weekend data yet to project an outlook. Check back as the season builds up recent form.",
};

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <PageSection className="!pb-16 lg:!pb-20">
      <div className="overflow-hidden rounded-[2.5rem] border border-amber-200/20 bg-amber-300 p-8 text-slate-950 shadow-2xl shadow-amber-500/20 sm:p-10 lg:p-14 xl:p-16">
        <p className="text-sm font-black uppercase tracking-[0.3em]">
          Season {new Date().getFullYear()}
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.05em] sm:mt-4 sm:text-4xl lg:text-5xl xl:text-6xl">
          Bring PitWall Apex to your sofa.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-800 sm:mt-5 sm:text-lg sm:leading-8">
          Session schedules in your timezone. Live championship standings.
          Race control intelligence. Strategy explainers. Everything an
          F1 fan needs for every race weekend.
        </p>
      </div>
    </PageSection>
  );
}

// ─── MotoGP Home ──────────────────────────────────────────────────────────────

function MotoGpWeekendHub() {
  return (
    <Suspense fallback={<WeekendHubSkeleton />}>
      <MotoGpWeekendHubSection />
    </Suspense>
  );
}

function MotoGpHero() {
  return (
    <Suspense fallback={<HeroBoardSkeleton />}>
      <MotoGpHeroBoard />
    </Suspense>
  );
}

function MotoGpCTA() {
  return (
    <PageSection className="!pb-16 lg:!pb-20">
      <div className="overflow-hidden rounded-[2.5rem] border border-amber-200/20 bg-amber-300 p-8 text-slate-950 shadow-2xl shadow-amber-500/20 sm:p-10 lg:p-14 xl:p-16">
        <p className="text-sm font-black uppercase tracking-[0.3em]">
          Season {new Date().getFullYear()}
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.05em] sm:mt-4 sm:text-4xl lg:text-5xl xl:text-6xl">
          Bring PitWall Apex to race day.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-800 sm:mt-5 sm:text-lg sm:leading-8">
          Session schedules in your timezone. Championship standings across
          all classes. Weekend progression and results. Everything a
          MotoGP fan needs for every Grand Prix.
        </p>
      </div>
    </PageSection>
  );
}

async function F1Home() {
  const { outlook, raceHref } = await buildF1Outlook();
  return (
    <div className="page-flow">
      <Hero />
      <WeekendHub />
      <WeekendOutlookSection outlook={outlook} raceHref={raceHref} />
      <CTA />
    </div>
  );
}

async function MotoGpHome() {
  const { outlook, raceHref } = await buildMotoGpOutlook();
  return (
    <div className="page-flow">
      <MotoGpHero />
      <MotoGpWeekendHub />
      <WeekendOutlookSection outlook={outlook} raceHref={raceHref} />
      <MotoGpCTA />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const sportCookie = cookieStore.get(SPORT_COOKIE_KEY)?.value ?? null;
  const sport: Sport = isValidSport(sportCookie) ? sportCookie : "f1";

  if (sport === "motogp") {
    return {
      title: "MotoGP Weekend Hub",
      description:
        "MotoGP session schedules, weekend hubs, and championship standings from PitWall Apex.",
      openGraph: {
        title: "MotoGP Weekend Hub | PitWall Apex",
        description:
          "MotoGP session schedules, weekend hubs, and championship standings from PitWall Apex.",
        type: "website",
      },
    };
  }

  return {
    title: "Formula 1 Weekend Hub",
    description:
      "Live timing, session schedules, and F1 championship standings from PitWall Apex.",
    openGraph: {
      title: "Formula 1 Weekend Hub | PitWall Apex",
      description:
        "Live timing, session schedules, and F1 championship standings from PitWall Apex.",
    },
  };
}

export default async function Home() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SPORT_COOKIE_KEY)?.value ?? null;
  const serverSport: Sport = isValidSport(cookieValue) ? cookieValue : "f1";

  return (
    <HomePageGate
      serverSport={serverSport}
      f1={<F1Home />}
      motogp={<MotoGpHome />}
    />
  );
}
