import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { GlassCard, PageSection, SectionHeading } from "@/components/ui";
import { HomePageGate } from "@/components/HomePageGate";
import { isValidSport, SPORT_COOKIE_KEY, type Sport } from "@/lib/sport";
import { F1HeroBoard } from "@/components/home/F1HeroBoard";
import { MotoGpHeroBoard } from "@/components/home/MotoGpHeroBoard";
import { HeroBoardSkeleton } from "@/components/home/HeroBoardSkeleton";

function Hero() {
  return (
    <Suspense fallback={<HeroBoardSkeleton />}>
      <F1HeroBoard />
    </Suspense>
  );
}

// ─── Feature Grid ──────────────────────────────────────────────────────────────

function FeatureGrid({ sport }: { sport: Sport }) {
  const routes =
    sport === "motogp"
      ? {
          briefing: "/motogp/live",
          pulse: "/#strategy",
          championship: "/motogp/standings",
        }
      : {
          briefing: "/live",
          pulse: "/#strategy",
          championship: "/standings",
        };

  const companionCards = [
    {
      eyebrow: "RACE BRIEFING",
      title: "Know the story before the race.",
      description:
        "Follow live session updates, race control messages, and weekend progression as each session runs.",
      href: routes.briefing,
      cta: sport === "motogp" ? "Open weekend hub" : "Open live timing",
    },
    {
      eyebrow: "COMMUNITY PULSE",
      title: "See who fans are backing.",
      description:
        sport === "motogp"
          ? "Preview how community race-win favourites could look once predictions launch."
          : "Preview how community race-win favourites could look once predictions launch.",
      href: routes.pulse,
      cta: "View prediction preview",
    },
    {
      eyebrow: "CHAMPIONSHIP BATTLE",
      title: "Track the title fight.",
      description:
        sport === "motogp"
          ? "MotoGP, Moto2, and Moto3 standings updated after every round."
          : "Live drivers' and constructors' standings updated after every round.",
      href: routes.championship,
      cta: "View standings",
    },
  ];

  return (
    <PageSection id="features" wide tightTop>
      <SectionHeading
        eyebrow="MOTORSPORT WEEKEND HUB"
        title="Everything you need before lights out."
        description="Schedules, live hubs, and championship standings — with more community features on the way."
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 xl:gap-8">
        {companionCards.map((card) => (
          <Link key={card.title} href={card.href} className="group block">
            <GlassCard className="flex h-full flex-col transition hover:-translate-y-0.5 hover:bg-white/[0.08]">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200">
                {card.eyebrow}
              </p>
              <h3 className="mt-4 text-xl font-semibold text-white transition group-hover:text-amber-100 sm:mt-5 sm:text-2xl">
                {card.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-300 sm:mt-4 sm:text-base">
                {card.description}
              </p>
              <p className="mt-5 text-sm font-semibold text-amber-300 transition group-hover:text-amber-200 sm:mt-6">
                {card.cta} →
              </p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </PageSection>
  );
}

// ─── Strategy Section (preserved, honest) ─────────────────────────────────────

function StrategySection() {
  const predictions = [
    { name: "Hamilton", percentage: 32 },
    { name: "Verstappen", percentage: 24 },
    { name: "Antonelli", percentage: 18 },
    { name: "Piastri", percentage: 12 },
    { name: "Norris", percentage: 8 },
    { name: "Russell", percentage: 4 },
    { name: "Others", percentage: 2 },
  ];

  return (
    <PageSection id="strategy" variant="muted" wide>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16 xl:gap-20">
        <SectionHeading
          eyebrow="COMMUNITY PREDICTIONS"
          title="Community predictions are coming soon."
          description="Preview of how race-win favourites could look once the community feature launches."
        />
        <GlassCard>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Preview · not live data
          </p>
          <div className="space-y-4">
            {predictions.map((pred) => (
              <div key={pred.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-200">{pred.name}</span>
                  <span className="font-bold text-amber-300">{pred.percentage}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                    style={{ width: `${pred.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </PageSection>
  );
}

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

function MotoGpHero() {
  return (
    <Suspense fallback={<HeroBoardSkeleton />}>
      <MotoGpHeroBoard />
    </Suspense>
  );
}

function MotoGpStrategySection() {
  const predictions = [
    { name: "Bagnaia", percentage: 34 },
    { name: "Márquez", percentage: 26 },
    { name: "Bezzecchi", percentage: 18 },
    { name: "Martin", percentage: 12 },
    { name: "Acosta", percentage: 6 },
    { name: "Di Giannantonio", percentage: 3 },
    { name: "Others", percentage: 1 },
  ];

  return (
    <PageSection id="strategy" variant="muted" wide>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16 xl:gap-20">
        <SectionHeading
          eyebrow="COMMUNITY PREDICTIONS"
          title="Community predictions are coming soon."
          description="Preview of how race-win favourites could look once the community feature launches."
        />
        <GlassCard>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Preview · not live data
          </p>
          <div className="space-y-4">
            {predictions.map((pred) => (
              <div key={pred.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-200">{pred.name}</span>
                  <span className="font-bold text-amber-300">{pred.percentage}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                    style={{ width: `${pred.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </PageSection>
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

function F1Home() {
  return (
    <div className="page-flow">
      <Hero />
      <FeatureGrid sport="f1" />
      <StrategySection />
      <CTA />
    </div>
  );
}

function MotoGpHome() {
  return (
    <div className="page-flow">
      <MotoGpHero />
      <FeatureGrid sport="motogp" />
      <MotoGpStrategySection />
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
