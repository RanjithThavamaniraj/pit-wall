import { Container } from "@/components/ui";
import type { RaceWeekendSummary } from "@/lib/race-summary/types";
import {
  buildTimelineStages,
  type WeekendHubData,
} from "@/lib/weekend-hub";
import { CurrentSessionCard } from "./CurrentSessionCard";
import { WeekendHubArchiveSections } from "./WeekendHubArchiveSections";
import { WeekendScheduleSection } from "./WeekendScheduleSection";
import { WeekendStageTimeline } from "./WeekendStageTimeline";
import { WeekendStatus } from "./WeekendStatus";

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

export function WeekendHub({
  data,
  summary = null,
  motogpPodium,
  scheduleHeadingId = "weekend-schedule-heading",
}: Props) {
  const stages = buildTimelineStages(data);

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

        <WeekendHubArchiveSections
          data={data}
          summary={summary}
          motogpPodium={motogpPodium}
        />
      </Container>
    </section>
  );
}
