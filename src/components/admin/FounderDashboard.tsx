import { GlassCard } from "@/components/ui";
import {
  AdminBarList,
  AdminSection,
  AdminSparkline,
  AdminStatCard,
  formatDuration,
  formatNumber,
  formatPercent,
} from "@/components/admin/AdminDashboardUi";
import { routeBucketLabel } from "@/lib/analytics/classify";
import type { DashboardSummary } from "@/lib/analytics/types";

export function FounderDashboard({ data }: { data: DashboardSummary }) {
  const generated = new Date(data.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const hasData = data.totals.pageviews > 0;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          Usage & traffic
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Founder dashboard
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-400">
          Real analytics from file-backed event storage. Last {data.rangeDays}{" "}
          days · refreshed {generated}
        </p>
      </header>

      {!hasData ? (
        <GlassCard className="p-6 text-sm text-slate-400">
          No traffic recorded yet. Browse the public site in another tab, then
          refresh this page. Pageviews are captured on route changes; engagement
          time is sent by the client heartbeat.
        </GlassCard>
      ) : null}

      <AdminSection title="Today" description="UTC day boundary">
        <div className="admin-grid admin-grid--3">
          <AdminStatCard label="Pageviews" value={formatNumber(data.today.pageviews)} />
          <AdminStatCard
            label="Unique visitors"
            value={formatNumber(data.today.uniqueVisitors)}
          />
          <AdminStatCard
            label="Sessions"
            value={formatNumber(data.today.sessions)}
          />
        </div>
      </AdminSection>

      <AdminSection
        title="Overview"
        description={`${data.rangeDays}-day rolling window`}
      >
        <div className="admin-grid admin-grid--4">
          <AdminStatCard
            label="Total pageviews"
            value={formatNumber(data.totals.pageviews)}
          />
          <AdminStatCard
            label="Unique visitors"
            value={formatNumber(data.totals.uniqueVisitors)}
          />
          <AdminStatCard
            label="Avg session time"
            value={formatDuration(data.totals.avgSessionDurationMs)}
          />
          <AdminStatCard
            label="Live pageviews"
            value={formatNumber(data.totals.livePageviews)}
            hint={`${formatNumber(data.totals.raceDetailViews)} race detail views`}
          />
        </div>
      </AdminSection>

      <AdminSection title="Hourly traffic (today)">
        <GlassCard className="p-4 sm:p-5">
          <AdminSparkline points={data.hourlyToday} />
          <p className="mt-2 text-xs text-slate-500">
            Pageviews by hour (local server timezone)
          </p>
        </GlassCard>
      </AdminSection>

      <div className="admin-grid admin-grid--2">
        <AdminSection title="Sport split">
          <GlassCard className="p-4 sm:p-5">
            <AdminBarList
              items={data.sportSplit.map((row) => ({
                label: row.sport === "f1" ? "Formula 1" : "MotoGP",
                value: row.pageviews,
              }))}
              labelKey="label"
              valueKey="value"
            />
          </GlassCard>
        </AdminSection>

        <AdminSection title="Device mix">
          <GlassCard className="p-4 sm:p-5">
            <AdminBarList
              items={data.devices.map((row) => ({
                label: row.device,
                value: row.count,
              }))}
              labelKey="label"
              valueKey="value"
            />
          </GlassCard>
        </AdminSection>
      </div>

      <AdminSection title="Route buckets">
        <GlassCard className="p-4 sm:p-5">
          <AdminBarList
            items={data.routeBuckets
              .filter((r) => r.pageviews > 0)
              .map((row) => ({
                label: routeBucketLabel(row.bucket),
                value: row.pageviews,
              }))}
            labelKey="label"
            valueKey="value"
          />
        </GlassCard>
      </AdminSection>

      <AdminSection title="Referrers">
        <GlassCard className="p-4 sm:p-5">
          <AdminBarList
            items={data.referrers.map((row) => ({
              label: row.bucket,
              value: row.count,
            }))}
            labelKey="label"
            valueKey="value"
          />
        </GlassCard>
      </AdminSection>

      <AdminSection title="Top pages">
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Path</th>
                  <th>Views</th>
                  <th>Visitors</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-slate-500">
                      No pageviews yet
                    </td>
                  </tr>
                ) : (
                  data.topPages.map((row) => (
                    <tr key={row.pathname}>
                      <td className="font-mono text-xs text-slate-300">
                        {row.pathname}
                      </td>
                      <td>{formatNumber(row.pageviews)}</td>
                      <td>{formatNumber(row.uniqueVisitors)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </AdminSection>

      <AdminSection title="Daily trend">
        <GlassCard className="p-4 sm:p-5">
          <AdminBarList
            items={data.dailyTrend.map((row) => ({
              label: row.date,
              value: row.pageviews,
            }))}
            labelKey="label"
            valueKey="value"
          />
        </GlassCard>
      </AdminSection>

      <div className="admin-grid admin-grid--2">
        <AdminSection
          title="Live engagement"
          description="Time on /live and /motogp/live"
        >
          <GlassCard className="space-y-4 p-4 sm:p-5">
            <AdminStatCard
              label="Live pageviews"
              value={formatNumber(data.liveEngagement.livePageviews)}
              className="!border-0 !bg-transparent !p-0 !shadow-none"
            />
            <p className="text-sm text-slate-400">
              {formatNumber(data.liveEngagement.liveUniqueVisitors)} unique
              visitors · avg{" "}
              {formatDuration(data.liveEngagement.avgTimeOnLiveMs)} on live
              pages
            </p>
          </GlassCard>
        </AdminSection>

        <AdminSection title="Weekend context">
          <GlassCard className="p-4 sm:p-5">
            <p className="text-sm font-medium text-amber-200">
              {data.weekendContext.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {data.weekendContext.note}
            </p>
          </GlassCard>
        </AdminSection>
      </div>

      <AdminSection title="API health" description="Instrumented public API routes">
        <div className="admin-grid admin-grid--3">
          <AdminStatCard
            label="Requests"
            value={formatNumber(data.apiHealth.totalRequests)}
          />
          <AdminStatCard
            label="Error rate"
            value={formatPercent(data.apiHealth.errorRate)}
          />
          <AdminStatCard
            label="Avg latency"
            value={formatDuration(data.apiHealth.avgLatencyMs)}
          />
        </div>
        {data.apiHealth.slowestRoutes.length > 0 ? (
          <GlassCard className="mt-4 p-4 sm:p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Slowest routes
            </p>
            <AdminBarList
              items={data.apiHealth.slowestRoutes.map((row) => ({
                label: row.route,
                value: row.avgMs,
              }))}
              labelKey="label"
              valueKey="value"
              formatValue={(v) => formatDuration(v)}
            />
          </GlassCard>
        ) : null}
      </AdminSection>

      <AdminSection title="Community predictions">
        <GlassCard className="p-4 sm:p-5">
          <p className="text-sm text-slate-400">{data.predictions.message}</p>
        </GlassCard>
      </AdminSection>
    </div>
  );
}
