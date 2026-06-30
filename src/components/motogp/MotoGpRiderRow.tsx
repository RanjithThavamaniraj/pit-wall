import type { RaceSummarySport } from "@/lib/race-summary/types";
import type { MotoGpRiderStanding } from "@/lib/motogp";
import { countryCodeToFlag } from "@/lib/utils";
import { PersonAvatar } from "@/components/weekend-summary/PersonAvatar";

type Props = {
  rider: MotoGpRiderStanding;
  sport?: RaceSummarySport;
};

const POSITION_STYLES: Record<number, string> = {
  1: "text-amber-300",
  2: "text-slate-300",
  3: "text-amber-600",
};

export function MotoGpRiderRow({ rider, sport = "motogp" }: Props) {
  const positionColor = POSITION_STYLES[rider.position] ?? "text-slate-500";
  const flag = countryCodeToFlag(rider.countryCode);

  return (
    <tr className="group border-b border-white/[0.05] transition hover:bg-white/[0.04]">
      <td className="w-12 py-3 pl-5 pr-2 text-left">
        <span className={`font-mono text-sm font-semibold ${positionColor}`}>
          {String(rider.position).padStart(2, "0")}
        </span>
      </td>

      <td className="w-12 py-3 pr-2">
        <PersonAvatar
          sport={sport}
          name={rider.riderName}
          team={rider.teamName}
          size="xs"
        />
      </td>

      <td className="w-10 py-3 pr-3 text-center text-lg" aria-hidden="true">
        {flag}
      </td>

      <td className="min-w-0 py-3 pr-4">
        <p className="truncate text-sm font-semibold text-white">
          <span className="font-mono text-amber-200">#{rider.riderNumber}</span>{" "}
          {rider.riderName}
        </p>
      </td>

      <td className="hidden min-w-0 py-3 pr-4 md:table-cell">
        <p className="truncate text-xs text-slate-500">{rider.teamName}</p>
      </td>

      <td className="hidden py-3 pr-5 text-right sm:table-cell">
        <span className="font-mono text-xs text-slate-500">
          {rider.gapToLeader === 0 ? "Leader" : `−${rider.gapToLeader}`}
        </span>
      </td>

      <td className="hidden py-3 pr-5 text-right md:table-cell">
        <span className="font-mono text-xs text-slate-500">{rider.wins}</span>
      </td>

      <td className="py-3 pr-5 text-right">
        <span className="font-mono text-sm font-semibold text-white">
          {rider.points}
        </span>
        <span className="ml-0.5 text-xs text-slate-600">pts</span>
      </td>
    </tr>
  );
}
