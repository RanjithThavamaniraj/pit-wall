import type { TimingRowData } from "@/lib/timing";

export function MobileTimingCard({ row }: { row: TimingRowData }) {
  return (
    <div className="mobile-timing-card">
      <span className="w-8 shrink-0 font-mono text-sm font-semibold text-slate-300">
        {String(row.position).padStart(2, "0")}
      </span>

      <span
        className="h-9 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: row.teamColor }}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          <span className="font-mono text-amber-200">{row.driverCode}</span>
          <span className="text-slate-300">
            {" "}
            {row.firstName} {row.lastName}
          </span>
        </p>
        <p className="truncate text-xs text-slate-500">{row.teamName}</p>
        {row.intervalToLeader ? (
          <p className="mt-1 text-xs text-slate-500">
            Gap to leader:{" "}
            <span className="font-mono text-slate-400">{row.intervalToLeader}</span>
          </p>
        ) : null}
      </div>

      <div className="mobile-timing-card__interval">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          Int
        </span>
        <span className="font-mono text-sm text-white">
          {row.intervalToNext || "—"}
        </span>
      </div>
    </div>
  );
}
