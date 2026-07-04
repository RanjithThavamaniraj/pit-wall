import { PageSection, SectionHeading } from "@/components/ui";
import {
  WeekendHubBoard,
  type HubBriefingLine,
  type HubBoardRow,
} from "@/components/home/WeekendHubBoard";
import {
  fetchSeasonSchedule,
  getCurrentRace,
  getNextRace,
} from "@/lib/schedule";

function formatSessionDayTime(isoString: string): string {
  if (!isoString) return "TBC";
  try {
    const day = new Intl.DateTimeFormat("en-US", { weekday: "short" })
      .format(new Date(isoString))
      .toUpperCase()
      .slice(0, 3);
    const time = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(isoString));
    return `${day} ${time}`;
  } catch {
    return "TBC";
  }
}

export async function F1WeekendHubSection() {
  let rows: HubBoardRow[] = [];

  try {
    const schedule = await fetchSeasonSchedule("current");

    const race = getCurrentRace(schedule) ?? getNextRace(schedule);
    const liveSession = race?.sessions.find((s) => s.status === "live");
    const nextSession =
      race?.sessions.find((s) => s.status === "upcoming") ?? liveSession;

    const isLiveWeekend = Boolean(liveSession || race?.isCurrent);

    const briefing: HubBriefingLine[] = [];

    if (race && nextSession?.dateUtc) {
      briefing.push({
        key: "Next session",
        value: `${nextSession.label} · ${formatSessionDayTime(nextSession.dateUtc)} · ${race.circuit}`,
        actionHref: `/races/${race.slug}#session-${nextSession.key}`,
        actionLabel: "Schedule →",
      });
    }

    rows = [
      {
        id: "briefing",
        channel: "CH01",
        tag: isLiveWeekend ? "LIVE" : "HUB",
        tagLive: isLiveWeekend,
        title: "Race briefing",
        line: "Session updates · race control · weekend progression",
        href: "/live",
        cta: "Open live timing",
        meta:
          nextSession && race
            ? `${nextSession.label.toUpperCase()}${isLiveWeekend ? " NOW" : " NEXT"} · ${formatSessionDayTime(nextSession.dateUtc)}`
            : "Weekend hub",
      },
      {
        id: "standings",
        channel: "CH02",
        tag: "WDC",
        title: "Championship",
        line: "Drivers and constructors after every round",
        href: "/standings",
        cta: "View standings",
        meta: "Full points table",
      },
    ];

    return (
      <PageSection id="features" wide tightTop>
        <div className="hub-section-label">
          <span className="hub-section-label-bar" aria-hidden="true" />
          <span className="hub-section-label-text">Pit wall tools</span>
        </div>
        <SectionHeading
          title="Everything you need before lights out."
          description="Schedules, live hubs, and championship standings — with more community features on the way."
        />
        <WeekendHubBoard briefing={briefing} rows={rows} />
      </PageSection>
    );
  } catch {
    rows = [
      {
        id: "briefing",
        channel: "CH01",
        tag: "HUB",
        title: "Race briefing",
        line: "Session updates · race control · weekend progression",
        href: "/live",
        cta: "Open live timing",
        meta: "Live weekend hub",
      },
      {
        id: "standings",
        channel: "CH02",
        tag: "WDC",
        title: "Championship",
        line: "Drivers and constructors after every round",
        href: "/standings",
        cta: "View standings",
        meta: "Season standings",
      },
    ];
  }

  return (
    <PageSection id="features" wide tightTop>
      <div className="hub-section-label">
        <span className="hub-section-label-bar" aria-hidden="true" />
        <span className="hub-section-label-text">Pit wall tools</span>
      </div>
      <SectionHeading
        title="Everything you need before lights out."
        description="Schedules, live hubs, and championship standings — with more community features on the way."
      />
      <WeekendHubBoard briefing={[]} rows={rows} />
    </PageSection>
  );
}
