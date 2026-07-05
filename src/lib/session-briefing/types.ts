export type BriefingPhase =
  | "before-fp1"
  | "practice-live"
  | "practice-done"
  | "sprint-qualifying-live"
  | "sprint-qualifying-done"
  | "qualifying-live"
  | "qualifying-done"
  | "sprint-live"
  | "sprint-done"
  | "race-live"
  | "race-done";

export type SessionBriefingSection = {
  id: string;
  heading: string;
  body: string;
};

export type SessionBriefing = {
  phase: BriefingPhase;
  title: string;
  statusLabel: string;
  sections: SessionBriefingSection[];
  generatedAt: string;
};
