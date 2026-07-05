import type { Metadata } from "next";
import { Container, PageSection, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "PitWall is an independent motorsport companion providing informational content about Formula 1 and MotoGP, not affiliated with any championship, team, or official organization.",
  openGraph: {
    title: "Disclaimer | PitWall",
    description:
      "PitWall is an independent motorsport companion providing informational content about Formula 1 and MotoGP, not affiliated with any championship, team, or official organization.",
    type: "website",
  },
};

// Placeholder contact address — replace with a real inbox when one exists.
const CONTACT_EMAIL = "contact@pitwallapex.com";

export default function DisclaimerPage() {
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
            Disclaimer
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Important information about using PitWall.
          </p>
        </Container>
      </section>

      {/* ─── General Information ────────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="General Information"
          description="All information on PitWall is provided for general informational purposes only. While every effort is made to keep it accurate and current, PitWall cannot guarantee completeness or accuracy at all times."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          The information presented — including Weekend Outlook, Weekend Intelligence, Driver Intelligence, Strategy Centre, Story Engine, Race Centre, Standings and Schedules — is subject to change and may occasionally contain inaccuracies or omissions.
        </p>
      </PageSection>

      {/* ─── Independent Project ────────────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="Independent Project"
          description="PitWall is an independent project. It is not affiliated with, endorsed by, or associated with Formula 1, FIA, MotoGP, Dorna Sports, any constructor, any racing team, or any rider or driver."
        />
      </PageSection>

      {/* ─── Data Sources ───────────────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="Data Sources"
          description="PitWall combines trusted third-party motorsport data sources with its own analysis. Session schedules, standings and results may occasionally change or be updated by official providers after publication."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          For the most accurate and up-to-date information, users should always refer to official championship sources and governing bodies, including the FIA for Formula 1 and Dorna Sports for MotoGP.
        </p>
      </PageSection>

      {/* ─── No Professional Advice ─────────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="No Professional Advice"
          description="Content on PitWall is provided for informational purposes only. PitWall does not provide betting, financial, legal, or professional advice of any kind."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          Nothing on this website should be treated as professional guidance. For decisions involving betting, finances, or legal matters, please consult a qualified professional.
        </p>
      </PageSection>

      {/* ─── External Links ─────────────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="External Links"
          description="PitWall may link to external websites and resources. PitWall is not responsible for the content, accuracy, availability or privacy practices of any external site."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          Your use of external websites is governed by their own terms of service and privacy policies. We encourage you to review these carefully before providing any personal information.
        </p>
      </PageSection>

      {/* ─── Intellectual Property ──────────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="Intellectual Property"
          description="Trademarks, logos, team names and championship names appearing on PitWall are the property of their respective owners."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          The appearance of any trademark, logo or name on PitWall does not imply any endorsement, affiliation or sponsorship. All intellectual property rights are retained by their respective owners.
        </p>
      </PageSection>

      {/* ─── Changes ────────────────────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="Changes"
          description="This Disclaimer may be updated periodically to reflect changes to PitWall's features, practices, or legal requirements."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          Any changes will be posted on this page, so it&apos;s worth checking back from time to time.
        </p>
      </PageSection>

      {/* ─── Contact ────────────────────────────────────────────────────── */}
      <PageSection tightTop className="!pb-16 lg:!pb-20">
        <SectionHeading
          title="Contact"
          description="If you have questions about this Disclaimer, you can reach PitWall at the address below."
        />
        <p className="mt-6 text-sm leading-7 text-slate-400">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-amber-300 transition hover:text-amber-200"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </PageSection>
    </>
  );
}
