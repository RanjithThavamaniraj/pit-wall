import type { MotoGpRiderStanding } from "@/lib/motogp";
import { countryCodeToFlag } from "@/lib/utils";

type Props = {
  rider: MotoGpRiderStanding;
};

const POSITION_STYLES: Record<number, string> = {
  1: "text-amber-300",
  2: "text-slate-300",
  3: "text-amber-600",
};

export function MotoGpRiderRow({ rider }: Props) {
  const positionColor = POSITION_STYLES[rider.position] ?? "text-slate-500";
  const flag = countryCodeToFlag(rider.countryCode);

  return (
    <tr className="group border-b border-white/[0.05] transition hover:bg-white/[0.04]">
      <td className="py-3.5 pl-5 pr-3 text-left">
        <span className={`font-mono text-sm font-semibold ${positionColor}`}>
          {String(rider.position).padStart(2, "0")}
        </span>
      </td>
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-3">
          <span className="text-lg" aria-hidden="true">
            {flag}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              <span className="font-mono text-amber-200">
                #{rider.riderNumber}
              </span>{" "}
              {rider.riderName}
            </p>
            <p className="text-xs text-slate-500">{rider.teamName}</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 pr-4 text-right">
        <span className="font-mono text-sm font-semibold text-white">
          {rider.points}
        </span>
        <span className="ml-0.5 text-xs text-slate-600">pts</span>
      </td>
      <td className="hidden py-3.5 pr-5 text-right sm:table-cell">
        <span className="font-mono text-xs text-slate-500">
          {rider.gapToLeader === 0 ? "Leader" : `−${rider.gapToLeader}`}
        </span>
      </td>
      <td className="hidden py-3.5 pr-5 text-right md:table-cell">
        <span className="font-mono text-xs text-slate-500">{rider.wins}</span>
      </td>
    </tr>
  );
}
