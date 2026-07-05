import type { RaceSummarySport } from "@/lib/race-summary/types";
import type { DriverStanding } from "@/lib/standings";
import { nationalityToFlag } from "@/lib/utils";
import { PersonAvatar } from "@/components/weekend-summary/PersonAvatar";

type Props = {
  driver: DriverStanding;
  sport?: RaceSummarySport;
};

const POSITION_STYLES: Record<number, string> = {
  1: "text-amber-300",
  2: "text-slate-300",
  3: "text-amber-600",
};

export function DriverRow({ driver, sport = "f1" }: Props) {
  const positionColor = POSITION_STYLES[driver.position] ?? "text-slate-500";
  const fullName = `${driver.firstName} ${driver.lastName}`;
  const flag = nationalityToFlag(driver.nationality);

  return (
    <tr className="group border-b border-white/[0.05] transition hover:bg-white/[0.04]">
      <td className="w-12 py-3.5 pl-5 pr-2 text-left">
        <span className={`font-mono text-sm font-semibold ${positionColor}`}>
          {String(driver.position).padStart(2, "0")}
        </span>
      </td>

      <td className="w-12 py-3.5 pr-2">
        <PersonAvatar
          sport={sport}
          name={fullName}
          team={driver.constructorName}
          size="xs"
        />
      </td>

      <td className="w-10 py-3.5 pr-3 text-center text-lg" aria-hidden="true">
        {flag}
      </td>

      <td className="min-w-0 py-3.5 pr-4">
        <p className="truncate text-sm font-semibold text-white">
          <span className="font-mono text-amber-200">{driver.driverCode}</span>{" "}
          {fullName}
        </p>
      </td>

      <td className="hidden min-w-0 py-3.5 pr-4 md:table-cell">
        <p className="truncate text-xs text-slate-500">
          {driver.constructorName}
        </p>
      </td>

      <td className="hidden py-3.5 pr-5 text-right sm:table-cell">
        <span className="font-mono text-xs text-slate-500">
          {driver.gapToLeader === 0 ? "Leader" : `−${driver.gapToLeader}`}
        </span>
      </td>

      <td className="hidden py-3.5 pr-5 text-right md:table-cell">
        <span className="font-mono text-xs text-slate-500">{driver.wins}</span>
      </td>

      <td className="py-3.5 pr-5 text-right">
        <span className="font-mono text-sm font-semibold text-white">
          {driver.points}
        </span>
        <span className="ml-0.5 text-xs text-slate-600">pts</span>
      </td>
    </tr>
  );
}
