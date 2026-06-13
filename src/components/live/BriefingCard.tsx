import type { BriefingItem } from "@/lib/briefings";
import { formatLocalTimeOnly } from "@/lib/utils";
import { GlassCard, StatusPill } from "@/components/ui";

export function BriefingCard({ item }: { item: BriefingItem }) {
  return (
    <GlassCard className="p-4 sm:p-5 relative overflow-hidden group">
      {/* Accent Line matching severity */}
      <div 
        className={`absolute inset-y-0 left-0 w-1 ${
          item.severity === "red" ? "bg-red-400" :
          item.severity === "amber" ? "bg-amber-400" :
          item.severity === "green" ? "bg-emerald-400" :
          item.severity === "blue" ? "bg-cyan-400" :
          "bg-white/20"
        }`} 
        aria-hidden="true" 
      />

      <div className="flex items-start justify-between gap-2 mb-3 pl-2">
        <StatusPill tone={item.severity}>
          {item.category.replace("_", " ")}
        </StatusPill>
        <span 
          className="font-mono text-xs text-slate-500 whitespace-nowrap"
          suppressHydrationWarning
        >
          {formatLocalTimeOnly(item.timestampUtc)}
        </span>
      </div>

      <div className="pl-2">
        <p className="text-sm font-semibold text-white mb-1 leading-snug">
          {item.explanation}
        </p>
        <p className="text-xs text-slate-500 uppercase tracking-wide font-mono mt-2 truncate">
          <span className="text-slate-600 mr-1.5">SOURCE:</span>
          {item.sourceEvent}
        </p>
      </div>
    </GlassCard>
  );
}
