import type { ReactNode } from "react";
import { GlassCard } from "@/components/ui";

export function AdminStatCard({
  label,
  value,
  hint,
  className = "",
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  return (
    <GlassCard className={`p-4 sm:p-5 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="admin-stat-value mt-2 text-3xl font-semibold text-white sm:text-4xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
      ) : null}
    </GlassCard>
  );
}

export function AdminSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function AdminBarList({
  items,
  valueKey,
  labelKey,
  formatValue,
}: {
  items: Record<string, string | number>[];
  valueKey: string;
  labelKey: string;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(
    1,
    ...items.map((item) => Number(item[valueKey]) || 0)
  );

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const label = String(item[labelKey]);
        const pct = Math.round((value / max) * 100);
        return (
          <div key={label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-slate-300">{label}</span>
              <span className="admin-stat-value text-slate-400">
                {formatValue ? formatValue(value) : value}
              </span>
            </div>
            <div className="admin-bar-track">
              <div className="admin-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdminSparkline({
  points,
}: {
  points: { hour?: number; date?: string; pageviews: number }[];
}) {
  const max = Math.max(1, ...points.map((p) => p.pageviews));
  const width = 280;
  const height = 64;
  const step = width / Math.max(1, points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - (p.pageviews / max) * (height - 8) - 4;
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-16 w-full text-amber-300"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={coords.join(" ")}
      />
    </svg>
  );
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}m ${rem}s`;
}

export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}
