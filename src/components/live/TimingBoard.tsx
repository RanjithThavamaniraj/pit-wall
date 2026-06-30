import type { TimingRowData } from "@/lib/timing";
import { MobileTimingCard } from "@/components/mobile/MobileTimingCard";

export function TimingRow({ row }: { row: TimingRowData }) {
  return (
    <tr className="group border-b border-white/[0.05] transition hover:bg-white/[0.04]">
      {/* Position */}
      <td className="py-3.5 pl-4 sm:pl-5 pr-2 sm:pr-3 text-left w-12 sm:w-16">
        <span className="font-mono text-sm font-semibold text-slate-300">
          {String(row.position).padStart(2, "0")}
        </span>
      </td>

      {/* Team color bar + driver */}
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-3">
          <span
            className="h-8 w-1 flex-shrink-0 rounded-full"
            style={{ backgroundColor: row.teamColor }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              <span className="font-mono text-amber-200 mr-1.5">
                {row.driverCode}
              </span>
              <span className="hidden sm:inline">
                {row.firstName} {row.lastName}
              </span>
            </p>
            <p className="text-xs text-slate-500 truncate hidden sm:block">{row.teamName}</p>
          </div>
        </div>
      </td>

      {/* Interval to Next */}
      <td className="py-3.5 pr-4 text-right w-24 sm:w-32">
        <span className="font-mono text-sm text-white">
          {row.intervalToNext || "-"}
        </span>
      </td>

      {/* Interval to Leader (Hidden on mobile) */}
      <td className="hidden py-3.5 pr-5 text-right sm:table-cell w-32">
        <span className="font-mono text-sm text-slate-400">
          {row.intervalToLeader || "-"}
        </span>
      </td>
    </tr>
  );
}

export function TimingBoard({ timing }: { timing: TimingRowData[] }) {
  if (timing.length === 0) {
    return (
      <div className="flex justify-center items-center h-48 border border-white/10 bg-white/[0.04] rounded-[2rem]">
        <p className="text-sm text-slate-400">Waiting for timing data...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
      <div className="mobile-card-stack md:hidden">
        {timing.map((row) => (
          <MobileTimingCard key={row.driverNumber} row={row} />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <caption className="sr-only">Live Timing Board</caption>
          <thead>
            <tr className="border-b border-white/10">
              <th scope="col" className="py-3 pl-4 sm:pl-5 pr-2 sm:pr-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                Pos
              </th>
              <th scope="col" className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                Driver
              </th>
              <th scope="col" className="py-3 pr-4 text-right text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                Interval
              </th>
              <th scope="col" className="hidden py-3 pr-5 text-right text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 sm:table-cell">
                Gap
              </th>
            </tr>
          </thead>
          <tbody>
            {timing.map((row) => (
              <TimingRow key={row.driverNumber} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
