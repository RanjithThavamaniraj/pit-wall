import type { MotoGpTeamStanding } from "@/lib/motogp";

type Props = {
  team: MotoGpTeamStanding;
};

const POSITION_STYLES: Record<number, string> = {
  1: "text-amber-300",
  2: "text-slate-300",
  3: "text-amber-600",
};

export function MotoGpTeamRow({ team }: Props) {
  const positionColor = POSITION_STYLES[team.position] ?? "text-slate-500";

  return (
    <tr className="group border-b border-white/[0.05] transition hover:bg-white/[0.04]">
      <td className="py-3.5 pl-5 pr-3 text-left">
        <span className={`font-mono text-sm font-semibold ${positionColor}`}>
          {String(team.position).padStart(2, "0")}
        </span>
      </td>
      <td className="py-3.5 pr-4">
        <p className="text-sm font-semibold text-white">{team.name}</p>
      </td>
      <td className="py-3.5 pr-4 text-right">
        <span className="font-mono text-sm font-semibold text-white">
          {team.points}
        </span>
        <span className="ml-0.5 text-xs text-slate-600">pts</span>
      </td>
      <td className="hidden py-3.5 pr-5 text-right sm:table-cell">
        <span className="font-mono text-xs text-slate-500">
          {team.gapToLeader === 0 ? "Leader" : `−${team.gapToLeader}`}
        </span>
      </td>
      <td className="hidden py-3.5 pr-5 text-right md:table-cell">
        <span className="font-mono text-xs text-slate-500">{team.wins}</span>
      </td>
    </tr>
  );
}
