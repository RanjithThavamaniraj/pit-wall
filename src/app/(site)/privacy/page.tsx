import type { Metadata } from "next";
import { Container, PageSection, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How PitWall collects, uses and protects information, including cookies, analytics and advertising practices.",
  openGraph: {
    title: "Privacy Policy | PitWall",
    description:
      "How PitWall collects, uses and protects information, including cookies, analytics and advertising practices.",
    type: "website",
  },
};

// Placeholder contact address — replace with a real inbox when one exists.
const CONTACT_EMAIL = "contact@pitwallapex.com";

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Last updated: {lastUpdated}
          </p>
          <div className="mt-6 max-w-2xl space-y-4 text-base leading-7 text-slate-400">
            <p>
              PitWall values your privacy and is committed to protecting
              your personal information.
            </p>
            <p>
              This Privacy Policy explains what information PitWall
              collects, how it is used, and what choices you have. It
              applies to your use of the PitWall website.
            </p>
          </div>
        </Container>
      </section>

      {/* ─── Information We Collect ────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="Information We Collect"
          description="PitWall automatically collects basic technical information when you visit the site, in order to keep the service running reliably and to understand how it's used."
        />
        <ul className="mt-6 max-w-2xl list-disc space-y-2 pl-5 text-sm leading-7 text-slate-400">
          <li>Browser type</li>
          <li>Device information</li>
          <li>IP address</li>
          <li>Pages visited</li>
          <li>Referring websites</li>
          <li>Anonymous usage statistics</li>
        </ul>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          PitWall does not currently require you to create an account to
          use the site, and it does not collect personal details such as
          your name or email address unless you choose to contact us
          directly.
        </p>
      </PageSection>

      {/* ─── Cookies ────────────────────────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="Cookies"
          description="PitWall currently uses a single small cookie to remember your selected sport (Formula 1 or MotoGP) so the site shows the right content on your next visit. This cookie does not identify you personally."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          PitWall may use cookies and similar technologies as new features
          are introduced, for purposes such as improving performance,
          remembering additional preferences, measuring website usage, and
          supporting future advertising services.
        </p>
      </PageSection>

      {/* ─── Analytics ──────────────────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="Analytics"
          description="PitWall may use Google Analytics or a similar service to understand how visitors use the website. If enabled, analytics data is aggregated and used only to improve the site's content and performance — it is not used to identify individual visitors."
        />
      </PageSection>

      {/* ─── Advertising ────────────────────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="Advertising"
          description="PitWall may display advertisements through Google AdSense in the future. If this happens, Google and its partners may use cookies to serve ads based on your visits to this and other websites. You can learn more about how Google uses this information, and the choices available to you, through Google's advertising policies."
        />
      </PageSection>

      {/* ─── Third-Party Services ───────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="Third-Party Services"
          description="PitWall may rely on trusted third-party services to operate and improve the website. These are used purely as supporting infrastructure and are not used to build personal profiles of visitors."
        />
        <ul className="mt-6 max-w-2xl list-disc space-y-2 pl-5 text-sm leading-7 text-slate-400">
          <li>Google Analytics</li>
          <li>Google AdSense</li>
          <li>Vercel (hosting infrastructure)</li>
          <li>
            External motorsport data providers, including OpenF1, Jolpica
            and PulseLive
          </li>
        </ul>
      </PageSection>

      {/* ─── Data Security ──────────────────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="Data Security"
          description="PitWall takes reasonable measures to protect the information it handles. However, no method of transmission over the internet, or method of electronic storage, can be guaranteed to be completely secure."
        />
      </PageSection>

      {/* ─── External Links ─────────────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="External Links"
          description="PitWall may link to external websites, such as official motorsport sources or data providers. PitWall is not responsible for the content or privacy practices of any external site, and we encourage you to review the privacy policy of any website you visit."
        />
      </PageSection>

      {/* ─── Children's Privacy ─────────────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="Children's Privacy"
          description="PitWall is not directed toward children under the age of 13, and PitWall does not knowingly collect personal information from children."
        />
      </PageSection>

      {/* ─── Changes to this Policy ─────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="Changes to this Policy"
          description="This Privacy Policy may be updated periodically to reflect changes to PitWall's features or practices. Any changes will be posted on this page."
        />
      </PageSection>

      {/* ─── Contact ────────────────────────────────────────────────────── */}
      <PageSection tightTop className="!pb-16 lg:!pb-20">
        <SectionHeading
          title="Contact"
          description="If you have questions about this Privacy Policy, you can reach PitWall at the address below."
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
