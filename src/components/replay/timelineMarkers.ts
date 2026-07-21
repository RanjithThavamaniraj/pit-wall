import type {
  ReplayBookmark,
  ReplayBookmarkKind,
  ReplayEvent,
  ReplayEventType,
} from "@/lib/replay";

export type TimelineMarkerVisual = {
  id: string;
  /** 0–1 along the race timeline. */
  progress: number;
  label: string;
  kind: "bookmark" | "event";
  glyph: string;
  toneClass: string;
  seekLap: number;
  seekT: number;
};

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function markerProgress(lap: number, t: number | undefined, totalLaps: number): number {
  if (totalLaps <= 0) return 0;
  return clampProgress((lap - 1 + (t ?? 0)) / totalLaps);
}

function bookmarkGlyph(kind: ReplayBookmarkKind): string {
  switch (kind) {
    case "race_start":
      return "🏁";
    case "half_distance":
      return "½";
    case "safety_car":
      return "🟡";
    case "overtake":
      return "↕";
    case "final_lap":
      return "🏆";
    case "finish":
      return "🏁";
    case "custom":
    default:
      return "◆";
  }
}

function bookmarkTone(kind: ReplayBookmarkKind): string {
  switch (kind) {
    case "safety_car":
      return "border-amber-300/40 bg-amber-300/15 text-amber-100";
    case "finish":
    case "final_lap":
      return "border-cyan-300/35 bg-cyan-300/10 text-cyan-100";
    case "race_start":
      return "border-emerald-300/35 bg-emerald-300/10 text-emerald-100";
    default:
      return "border-white/20 bg-white/10 text-slate-100";
  }
}

function eventGlyph(type: ReplayEventType, flag?: string): string {
  if (type === "pit") return "P";
  if (type === "safety_car") return "SC";
  if (type === "finish") return "F";
  if (type === "flag" && flag === "red") return "RF";
  if (type === "flag" && flag === "yellow") return "YF";
  if (type === "overtake") return "O";
  if (type === "sector") return "S";
  return "•";
}

function eventTone(type: ReplayEventType, flag?: string): string {
  if (type === "pit") return "bg-violet-300/80";
  if (type === "safety_car" || (type === "flag" && flag === "yellow")) {
    return "bg-amber-300";
  }
  if (type === "flag" && flag === "red") return "bg-red-400";
  if (type === "finish") return "bg-cyan-300";
  return "bg-slate-300/80";
}

function eventLabel(event: ReplayEvent): string {
  if (typeof event.payload?.label === "string" && event.payload.label) {
    return event.payload.label;
  }
  switch (event.type) {
    case "pit":
      return event.payload?.code
        ? `Pit stop · ${event.payload.code}`
        : "Pit stop";
    case "safety_car":
      return "Safety car";
    case "finish":
      return "Finish";
    case "flag":
      if (event.payload?.flag === "red") return "Red flag";
      if (event.payload?.flag === "yellow") return "Yellow flag";
      if (event.payload?.flag === "vsc") return "Virtual safety car";
      return "Flag";
    case "overtake":
      return "Overtake";
    case "sector":
      return "Sector";
    case "bookmark":
      return "Bookmark";
    default:
      return event.type;
  }
}

/** Events that should appear as timeline markers (extensible allow-list). */
const TIMELINE_EVENT_TYPES: ReadonlySet<ReplayEventType> = new Set([
  "pit",
  "safety_car",
  "flag",
  "finish",
  "overtake",
]);

export function buildBookmarkMarkers(
  bookmarks: ReplayBookmark[],
  totalLaps: number
): TimelineMarkerVisual[] {
  return bookmarks.map((bookmark) => ({
    id: `bookmark-${bookmark.id}`,
    progress: markerProgress(bookmark.lap, bookmark.t, totalLaps),
    label: bookmark.label,
    kind: "bookmark" as const,
    glyph: bookmarkGlyph(bookmark.kind),
    toneClass: bookmarkTone(bookmark.kind),
    seekLap: bookmark.lap,
    seekT: bookmark.t ?? 0,
  }));
}

export function buildEventMarkers(
  events: ReplayEvent[],
  totalLaps: number
): TimelineMarkerVisual[] {
  return events
    .filter((event) => {
      if (!TIMELINE_EVENT_TYPES.has(event.type)) return false;
      if (event.type === "flag") {
        const flag = event.payload?.flag;
        return flag === "red" || flag === "yellow" || flag === "safety_car";
      }
      return true;
    })
    .map((event) => ({
      id: `event-${event.id}`,
      progress: markerProgress(event.lap, event.t, totalLaps),
      label: eventLabel(event),
      kind: "event" as const,
      glyph: eventGlyph(
        event.type,
        typeof event.payload?.flag === "string" ? event.payload.flag : undefined
      ),
      toneClass: eventTone(
        event.type,
        typeof event.payload?.flag === "string" ? event.payload.flag : undefined
      ),
      seekLap: event.lap,
      seekT: event.t ?? 0,
    }));
}
