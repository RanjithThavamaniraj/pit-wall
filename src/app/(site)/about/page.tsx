import type { Metadata } from "next";
import { Container, PageSection, SectionHeading, GlassCard } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description:
    "PitWall is an independent motorsport companion for Formula 1 and MotoGP fans, combining verified schedules, standings, and data-driven weekend insights in one place.",
  openGraph: {
    title: "About PitWall",
    description:
      "PitWall is an independent motorsport companion for Formula 1 and MotoGP fans, combining verified schedules, standings, and data-driven weekend insights in one place.",
    type: "website",
  },
};

type Feature = {
  name: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    name: "Weekend Outlook",
    description:
      "A continuously updated read on who looks strongest heading into a race weekend, built from recent form and results rather than fixed predictions.",
  },
  {
    name: "Driver Intelligence",
    description:
      "Momentum and form profiles for each driver, tracking recent results, consistency and race pace trends across the season.",
  },
  {
    name: "Strategy Centre",
    description:
      "A projected view of how a race weekend could unfold, covering tyre strategy, pit windows and weather conditions.",
  },
  {
    name: "Story Engine",
    description:
      "The narrative behind each race weekend — key storylines before a session begins and a recap once it concludes.",
  },
  {
    name: "Race Centre",
    description:
      "A dedicated hub for every race weekend, bringing together the session schedule, results and live session tracking in one place.",
  },
  {
    name: "Championship Standings",
    description:
      "Full standings for drivers, riders, teams and constructors, updated after every session.",
  },
  {
    name: "Season Schedule",
    description:
      "The complete race calendar with every session time converted to your local timezone.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pt-10 pb-8 sm:pt-12 sm:pb-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.10),transparent_55%)]"
        />
        <Container>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-6xl">
            About PitWall
          </h1>
          <p className="mt-3 text-lg font-medium text-amber-200/90 sm:text-xl">
            Understand every race weekend with confidence.
          </p>
          <div className="mt-6 max-w-2xl space-y-4 text-base leading-7 text-slate-400">
            <p>
              PitWall is an independent motorsport companion built for
              Formula 1 and MotoGP fans who want more than headlines.
            </p>
            <p>
              Instead of overwhelming you with information, PitWall brings
              together schedules, standings, weekend context and
              data-driven insights to help you follow every race weekend
              from start to finish.
            </p>
          </div>
        </Container>
      </section>

      {/* ─── Our Mission ───────────────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="Our Mission"
          description="Modern motorsport generates an enormous amount of information — practice times, qualifying results, standings, and strategy detail spread across dozens of sources. PitWall exists to simplify that experience, bringing verified data together with structured, intelligent analysis in a single, clean interface."
        />
      </PageSection>

      {/* ─── What You'll Find ──────────────────────────────────────────── */}
      <PageSection wide tightTop>
        <SectionHeading
          title="What You'll Find"
          description="PitWall brings together the tools fans need to follow a race weekend from start to finish."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <GlassCard key={feature.name} className="p-6">
              <h3 className="text-base font-semibold text-white">
                {feature.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {feature.description}
              </p>
            </GlassCard>
          ))}
        </div>
      </PageSection>

      {/* ─── Built Around Verified Data ────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="Built Around Verified Data"
          description="PitWall avoids fabricated commentary. Every insight is either backed by official schedules, championship standings and confirmed session results, or it isn't shown at all."
        />
        <GlassCard className="mt-8 max-w-3xl p-6 sm:p-8">
          <p className="text-lg font-medium leading-8 text-white sm:text-xl">
            &ldquo;If we have verified data, we analyse it. If we don&apos;t,
            we don&apos;t pretend we do.&rdquo;
          </p>
        </GlassCard>
      </PageSection>

      {/* ─── Independent Project ───────────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="Independent Project"
          description="PitWall is an independent motorsport project. It is not affiliated with or endorsed by Formula 1, FIA, MotoGP, Dorna Sports or any racing team. All trademarks and logos belong to their respective owners."
        />
      </PageSection>

      {/* ─── Why PitWall? ──────────────────────────────────────────────── */}
      <PageSection variant="muted" tightTop className="!pb-16 lg:!pb-20">
        <SectionHeading
          title="Why PitWall?"
          description="We believe motorsport should be easier to follow without sacrificing depth. PitWall brings together schedules, standings, race context and intelligent analysis in one place, allowing fans to spend less time searching across multiple websites and more time enjoying the sport."
        />
      </PageSection>
    </>
  );
}
