import { PageSection, SectionHeading } from "@/components/ui";
import {
  WeekendHubBoard,
  type HubBriefingLine,
  type HubBoardRow,
} from "@/components/home/WeekendHubBoard";
import {
  fetchMotoGpSchedule,
  getCurrentMotoGpEvent,
  getNextMotoGpEvent,
} from "@/lib/motogp";

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

export async function MotoGpWeekendHubSection() {
  let rows: HubBoardRow[] = [];

  try {
    const schedule = await fetchMotoGpSchedule();

    const event =
      getCurrentMotoGpEvent(schedule) ?? getNextMotoGpEvent(schedule);
    const liveSession = event?.sessions.find((s) => s.status === "live");
    const nextSession =
      event?.sessions.find((s) => s.status === "upcoming") ?? liveSession;
    const isLiveWeekend = Boolean(liveSession || event?.isCurrent);

    const briefing: HubBriefingLine[] = [];

    if (event && nextSession?.dateUtc) {
      briefing.push({
        key: "Next session",
        value: `${nextSession.label} · ${formatSessionDayTime(nextSession.dateUtc)} · ${event.circuit}`,
        actionHref: `/motogp/races/${event.slug}`,
        actionLabel: "Schedule →",
      });
    }

    rows = [
      {
        id: "briefing",
        channel: "CH01",
        tag: isLiveWeekend ? "LIVE" : "HUB",
        tagLive: isLiveWeekend,
        title: "Weekend hub",
        line: "Session progression · results · countdowns",
        href: "/motogp/live",
        cta: "Open weekend hub",
        meta:
          nextSession && event
            ? `${nextSession.label.toUpperCase()}${isLiveWeekend ? " NOW" : " NEXT"} · ${formatSessionDayTime(nextSession.dateUtc)}`
            : "Weekend hub",
      },
      {
        id: "standings",
        channel: "CH02",
        tag: "MGP",
        title: "Championship",
        line: "MotoGP, Moto2, and Moto3 after every round",
        href: "/motogp/standings",
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
          description="Schedules, weekend hubs, and championship standings — with more community features on the way."
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
        title: "Weekend hub",
        line: "Session progression · results · countdowns",
        href: "/motogp/live",
        cta: "Open weekend hub",
        meta: "MotoGP weekend hub",
      },
      {
        id: "standings",
        channel: "CH02",
        tag: "MGP",
        title: "Championship",
        line: "MotoGP, Moto2, and Moto3 after every round",
        href: "/motogp/standings",
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
        description="Schedules, weekend hubs, and championship standings — with more community features on the way."
      />
      <WeekendHubBoard briefing={[]} rows={rows} />
    </PageSection>
  );
}
