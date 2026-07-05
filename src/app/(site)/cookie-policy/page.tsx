import Link from "next/link";
import type { Metadata } from "next";
import { Container, PageSection, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn how PitWall uses cookies to enhance your experience and understand what choices you have in controlling cookie preferences.",
  openGraph: {
    title: "Cookie Policy | PitWall",
    description:
      "Learn how PitWall uses cookies to enhance your experience and understand what choices you have in controlling cookie preferences.",
    type: "website",
  },
};

// Placeholder contact address — replace with a real inbox when one exists.
const CONTACT_EMAIL = "contact@pitwallapex.com";

export default function CookiePolicyPage() {
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
            Cookie Policy
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Learn how PitWall uses cookies to improve your experience.
          </p>
        </Container>
      </section>

      {/* ─── What Are Cookies? ─────────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="What Are Cookies?"
          description="Cookies are small text files that websites store on your device. They help websites remember information about your visits, such as your preferences or login status, so you have a better experience when you return."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          Cookies are harmless and widely used. You control whether cookies are
          stored by adjusting your browser settings, and you can delete cookies
          at any time.
        </p>
      </PageSection>

      {/* ─── Cookies We Currently Use ───────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="Cookies We Currently Use"
          description="PitWall currently sets three first-party cookies — all essential to how the site functions, and none contain personally identifying information."
        />
        <ul className="mt-6 max-w-2xl space-y-4 text-sm leading-7 text-slate-400">
          <li>
            <strong className="text-white">Sport Preference</strong> &mdash; Remembers
            whether you prefer to follow Formula 1 or MotoGP, so the site
            displays the correct content on your next visit. This preference is
            stored locally on your device.
          </li>
          <li>
            <strong className="text-white">Visitor Identifier</strong> &mdash; An
            anonymous random identifier used for first-party analytics. This
            helps PitWall understand how visitors use the site, so we can
            improve the experience.
          </li>
          <li>
            <strong className="text-white">Session Identifier</strong> &mdash; An
            anonymous random identifier that tracks your current browsing
            session. Used alongside the visitor identifier for analytics
            purposes. This cookie expires after a short period of inactivity.
          </li>
        </ul>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          PitWall also sets an authentication cookie for site administrators
          accessing the internal admin dashboard, but this cookie is never set
          for regular visitors browsing the public site.
        </p>
      </PageSection>

      {/* ─── Cookies We May Use ─────────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="Cookies We May Use"
          description="As PitWall evolves, additional cookies may be introduced. None are currently active, but here's what we might use in the future."
        />
        <ul className="mt-6 max-w-2xl space-y-3 text-sm leading-7 text-slate-400">
          <li>
            <strong className="text-white">Google Analytics</strong> &mdash; If
            enabled, helps measure site traffic and user behavior to improve
            PitWall&apos;s features and performance.
          </li>
          <li>
            <strong className="text-white">Google AdSense</strong> &mdash; If
            enabled, PitWall may display advertisements using Google AdSense.
            Google may set cookies to serve relevant ads.
          </li>
          <li>
            <strong className="text-white">Performance &amp; Functionality
              Cookies</strong> &mdash; May help optimize page load times, remember
            additional preferences, or improve how certain features work.
          </li>
        </ul>
      </PageSection>

      {/* ─── Managing Cookies ───────────────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="Managing Cookies"
          description="You have full control over cookies in your browser. Most browsers allow you to see which cookies are stored and delete them at any time."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          You can disable cookies entirely, or accept cookies from some sites
          and not others. Be aware that disabling certain cookies (like the
          sport preference cookie) may affect PitWall&apos;s ability to remember your
          choices and customize your experience.
        </p>
      </PageSection>

      {/* ─── Third-Party Cookies ────────────────────────────────────────── */}
      <PageSection variant="muted" tightTop>
        <SectionHeading
          title="Third-Party Cookies"
          description="If PitWall enables third-party services like Google Analytics or Google AdSense, those providers may set their own cookies."
        />
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          These third-party cookies are governed by each provider&apos;s own cookie
          and privacy policies. For more details about how PitWall uses these
          services, see our{" "}
          <Link
            href="/privacy"
            className="font-semibold text-amber-300 transition hover:text-amber-200"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </PageSection>

      {/* ─── Changes to This Policy ─────────────────────────────────────── */}
      <PageSection tightTop>
        <SectionHeading
          title="Changes to This Policy"
          description="This Cookie Policy may be updated periodically to reflect changes to how PitWall uses cookies. Any updates will be posted on this page."
        />
      </PageSection>

      {/* ─── Contact ────────────────────────────────────────────────────── */}
      <PageSection tightTop className="!pb-16 lg:!pb-20">
        <SectionHeading
          title="Contact"
          description="If you have questions about this Cookie Policy, you can reach PitWall at the address below."
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
