import type { StoryContext, WeekendStory } from "./types";
import { buildWeekendStory } from "./generator";

export { buildStorySections } from "./generator";

export function generateWeekendStory(
  context: StoryContext
): WeekendStory {
  return buildWeekendStory(context);
}

export function getStoryHeadline(story: WeekendStory): string {
  const primary = story.sections.find((s) => s.importance === "primary");
  return primary?.heading ?? story.title;
}