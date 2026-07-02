import { Container } from "@/components/ui";
import type { RaceWeekendSummary } from "@/lib/race-summary/types";
import {
  buildTimelineStages,
  type WeekendHubData,
} from "@/lib/weekend-hub";
import { fetchSeasonSchedule } from "@/lib/schedule";
import { fetchMotoGpSchedule } from "@/lib/motogp";
import { fetchDriverIntelligence } from "@/lib/driver-intelligence/selectors";
import { CurrentSessionCard } from "./CurrentSessionCard";
import { DriverIntelligencePanel } from "./DriverIntelligencePanel";
import { LiveEventFeed } from "./LiveEventFeed";
import { WeekendHubArchiveSections } from "./WeekendHubArchiveSections";
import { WeekendScheduleSection } from "./WeekendScheduleSection";
import { WeekendStageTimeline } from "./WeekendStageTimeline";
import { WeekendStatus } from "./WeekendStatus";
import { WeekendStoryEngine } from "./WeekendStoryEngine";
import { WeekendStrategyCenter } from "./WeekendStrategyCenter";

type MotoGpPodiumFinisher = {
  position: number;
  riderName: string;
  riderNumber: number;
  teamName: string;
};

type Props = {
  data: WeekendHubData;
  summary?: RaceWeekendSummary | null;
  motogpPodium?: MotoGpPodiumFinisher[];
  scheduleHeadingId?: string;
};

export async function WeekendHub({
  data,
  summary = null,
  motogpPodium,
  scheduleHeadingId = "weekend-schedule-heading",
}: Props) {
  const stages = buildTimelineStages(data);

  let completedWeekendSlugs: string[] = [];
  try {
    if (data.sport === "motogp") {
      const schedule = await fetchMotoGpSchedule();
      completedWeekendSlugs = schedule.races
        .filter((race) => race.isPast)
        .map((race) => race.slug);
    } else {
      const schedule = await fetchSeasonSchedule("current");
      completedWeekendSlugs = schedule.races
        .filter((race) => race.isPast)
        .map((race) => race.slug);
    }
  } catch {
    completedWeekendSlugs = [];
  }

  let driverIntelligenceBundle = null;
  try {
    driverIntelligenceBundle = await fetchDriverIntelligence({
      sport: data.sport,
      completedWeekendSlugs,
    });
  } catch {
    driverIntelligenceBundle = null;
  }

  return (
    <section className="pb-12" aria-label="Race weekend hub">
      <Container wide className="space-y-5">
        <WeekendStatus data={data} />

        <WeekendStageTimeline stages={stages} />

        <CurrentSessionCard data={data} />

        <WeekendScheduleSection
          sessions={data.sessions}
          headingId={scheduleHeadingId}
        />

        <LiveEventFeed
          sport={data.sport}
          weekendSlug={data.slug}
          data={data}
          sessions={data.sessions}
        />

        <WeekendStoryEngine
          sport={data.sport}
          weekendSlug={data.slug}
          weekendName={data.name}
          sessions={data.sessions}
          summary={summary}
          isSprintWeekend={data.isSprintWeekend}
        />

        <WeekendStrategyCenter
          sport={data.sport}
          weekendSlug={data.slug}
          weekendName={data.name}
          sessions={data.sessions}
          isSprintWeekend={data.isSprintWeekend}
        />

        <DriverIntelligencePanel bundle={driverIntelligenceBundle} />

        <WeekendHubArchiveSections
          data={data}
          summary={summary}
          motogpPodium={motogpPodium}
        />
      </Container>
    </section>
  );
}
