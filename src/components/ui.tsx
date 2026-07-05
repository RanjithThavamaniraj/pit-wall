import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`layout-shell ${wide ? "layout-shell--wide" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function PageSection({
  children,
  id,
  className = "",
  variant = "default",
  wide = false,
  tightTop = false,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
  variant?: "default" | "muted";
  wide?: boolean;
  tightTop?: boolean;
}) {
  return (
    <section
      id={id}
      className={`page-section ${variant === "muted" ? "page-section--muted" : ""} ${
        tightTop ? "page-section--tight-top" : ""
      } ${className}`}
    >
      <Container wide={wide}>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={`max-w-3xl lg:max-w-4xl ${className}`}>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`${eyebrow ? "mt-3 sm:mt-4" : ""} text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl lg:text-5xl`}
      >
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-300 sm:mt-5 sm:text-lg sm:leading-8">
        {description}
      </p>
    </div>
  );
}

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7 lg:p-9 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "neutral";
  className?: string;
}) {
  const tones = {
    green: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
    amber: "border-amber-300/30 bg-amber-300/10 text-amber-200",
    red: "border-red-300/30 bg-red-300/10 text-red-200",
    blue: "border-cyan-300/30 bg-cyan-300/10 text-cyan-200",
    neutral: "border-white/15 bg-white/10 text-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Skeleton placeholder — shows while data is loading.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`}
      aria-hidden="true"
    />
  );
}
