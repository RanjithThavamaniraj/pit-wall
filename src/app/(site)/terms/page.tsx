import type { Metadata } from "next";
import { Container, PageSection, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms governing your use of PitWall, including acceptable use, intellectual property, service availability and limitation of liability.",
  openGraph: {
    title: "Terms & Conditions | PitWall",
    description:
      "The terms governing your use of PitWall, including acceptable use, intellectual property, service availability and limitation of liability.",
    type: "website",
  },
};

// Placeholder contact address — replace with a real inbox when one exists.
const CONTACT_EMAIL = "contact@pitwallapex.com";

const PITWALL_FEATURES = [
  "Weekend Outlook",
  "Weekend Intelligence",
  "Driver Intelligence",
  "Strategy Centre",
  "Story Engine",
  "Race Centre",
  "Schedules",
  "Standings",
];

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

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
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Last updated: {lastUpdated}
          </p>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400">
            The terms governing your use of PitWall.
          </p>
        </Container>
      </section>

      {/* ─── 1. Acceptance of These Terms ─────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="1. Acceptance of These Terms"
          description="By accessing or using PitWall, you agree to these Terms & Conditions. If you do not agree, please discontinue use of the website."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          These terms apply to all visitors, regardless of how you access
          the site. If you continue using PitWall after any updates are
          posted, that counts as acceptance of the revised terms.
        </p>
      </PageSection>

      {/* ─── 2. About PitWall ────────────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="2. About PitWall"
          description="PitWall is an independent motorsport companion providing informational content about Formula 1 and MotoGP. The site brings together the following features in a single experience:"
        />
        <ul className="mt-6 max-w-2xl list-disc space-y-1.5 pl-5 text-sm leading-7 text-slate-400">
          {PITWALL_FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          PitWall is an informational website. It does not provide live
          race streaming, ticketing, or any commercial service on behalf
          of the championships it covers.
        </p>
      </PageSection>

      {/* ─── 3. Acceptable Use ───────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="3. Acceptable Use"
          description="You agree to use PitWall responsibly and lawfully. In particular, you agree not to:"
        />
        <ul className="mt-6 max-w-2xl list-disc space-y-2 pl-5 text-sm leading-7 text-slate-400">
          <li>Misuse the website or attempt to access parts of it you are not authorised to reach.</li>
          <li>Interfere with the normal operation of the site, its servers, or the networks it runs on.</li>
          <li>Copy, scrape, or republish PitWall&apos;s content at scale without permission.</li>
          <li>Use the website for any unlawful, harmful, or fraudulent purpose.</li>
          <li>Introduce viruses, malware, or any other malicious code to the site.</li>
        </ul>
      </PageSection>

      {/* ─── 4. Intellectual Property ────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="4. Intellectual Property"
          description="PitWall's original content, design, analysis and software belong to PitWall. You may share links to pages freely, but you may not republish large portions of content without permission."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          Formula 1, MotoGP, FIA, Dorna Sports, team names, rider names,
          logos and trademarks belong to their respective owners. Their
          appearance on PitWall does not imply endorsement, affiliation
          or sponsorship. Further detail is available in our{" "}
          <a
            href="/disclaimer"
            className="font-semibold text-amber-300 transition hover:text-amber-200"
          >
            Disclaimer
          </a>
          .
        </p>
      </PageSection>

      {/* ─── 5. Information Accuracy ─────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="5. Information Accuracy"
          description="PitWall works hard to provide accurate schedules, standings and race information, but cannot guarantee that every piece of information is always complete, current or error-free."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          Official championship sources should always take precedence. For
          the most reliable information, refer to the official Formula 1
          and MotoGP channels. Further detail is available in our{" "}
          <a
            href="/disclaimer"
            className="font-semibold text-amber-300 transition hover:text-amber-200"
          >
            Disclaimer
          </a>
          .
        </p>
      </PageSection>

      {/* ─── 6. External Services ────────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="6. External Services"
          description="PitWall may contain links to third-party websites and services. PitWall is not responsible for the content, availability, or practices of any external site."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          Your use of external websites is governed by their own terms
          and policies. For details about how PitWall itself handles data
          and cookies, see our{" "}
          <a
            href="/privacy"
            className="font-semibold text-amber-300 transition hover:text-amber-200"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="/cookie-policy"
            className="font-semibold text-amber-300 transition hover:text-amber-200"
          >
            Cookie Policy
          </a>
          .
        </p>
      </PageSection>

      {/* ─── 7. Service Availability ─────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="7. Service Availability"
          description="PitWall may occasionally be unavailable due to maintenance, updates, or technical issues. No guarantee of uninterrupted availability is made."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          The website is provided on an &ldquo;as available&rdquo; basis.
          We aim to keep things running smoothly, but occasional
          downtime is normal for any web service.
        </p>
      </PageSection>

      {/* ─── 8. Limitation of Liability ───────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="8. Limitation of Liability"
          description="PitWall is provided &ldquo;as available&rdquo; for informational purposes. To the fullest extent permitted by applicable law, PitWall is not liable for any loss or damage arising from your use of the website."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          This includes, without limitation, indirect or incidental loss
          such as missed sessions, inaccurate data, or reliance on
          information that turned out to be incomplete. PitWall is a
          companion resource, not a substitute for official
          championship sources.
        </p>
      </PageSection>

      {/* ─── 9. Changes to These Terms ───────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="9. Changes to These Terms"
          description="These Terms & Conditions may be updated from time to time. Any changes will be posted on this page with an updated revision date."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          Continued use of the website after changes are posted means the
          updated Terms apply to you. It&apos;s worth checking back
          occasionally.
        </p>
      </PageSection>

      {/* ─── 10. Governing Law ───────────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="10. Governing Law"
          description="These Terms are governed by the applicable laws of the jurisdiction in which PitWall operates. Any disputes will be handled in accordance with those laws."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          If you are unsure which jurisdiction applies, you are welcome
          to contact us using the details below.
        </p>
      </PageSection>

      {/* ─── 11. Contact ─────────────────────────────────────────────── */}
      <PageSection variant="muted" tightTop className="!pb-16 lg:!pb-20">
        <SectionHeading
          title="11. Contact"
          description="If you have questions about these Terms & Conditions, you can reach PitWall at the address below."
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