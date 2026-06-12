import type { DriverStanding } from "@/lib/standings";
import { formatGap } from "@/lib/utils";

type Props = {
  driver: DriverStanding;
  rank: number;
};

const POSITION_STYLES: Record<number, string> = {
  1: "text-amber-300",
  2: "text-slate-300",
  3: "text-amber-600",
};

export function DriverRow({ driver, rank }: Props) {
  const positionColor = POSITION_STYLES[driver.position] ?? "text-slate-500";

  return (
    <tr className="group border-b border-white/[0.05] transition hover:bg-white/[0.04]">
      {/* Position */}
      <td className="py-3.5 pl-5 pr-3 text-left">
        <span className={`font-mono text-sm font-semibold ${positionColor}`}>
          {String(driver.position).padStart(2, "0")}
        </span>
      </td>

      {/* Team color bar + driver */}
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-3">
          <span
            className="h-8 w-1 flex-shrink-0 rounded-full"
            style={{ backgroundColor: driver.constructorColor }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              <span className="font-mono text-amber-200">
                {driver.driverCode}
              </span>{" "}
              {driver.firstName} {driver.lastName}
            </p>
            <p className="text-xs text-slate-500">{driver.constructorName}</p>
          </div>
        </div>
      </td>

      {/* Points */}
      <td className="py-3.5 pr-4 text-right">
        <span className="font-mono text-sm font-semibold text-white">
          {driver.points}
        </span>
        <span className="ml-0.5 text-xs text-slate-600">pts</span>
      </td>

      {/* Gap */}
      <td className="hidden py-3.5 pr-5 text-right sm:table-cell">
        <span className="font-mono text-xs text-slate-500">
          {driver.gapToLeader === 0 ? "Leader" : `−${driver.gapToLeader}`}
        </span>
      </td>

      {/* Wins */}
      <td className="hidden py-3.5 pr-5 text-right md:table-cell">
        <span className="font-mono text-xs text-slate-500">{driver.wins}</span>
      </td>
    </tr>
  );
}
