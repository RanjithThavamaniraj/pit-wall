export type NavItem = {
  label: string;
  href: string;
};

export type Metric = {
  label: string;
  value: string;
  trend: string;
};

export type Feature = {
  eyebrow: string;
  title: string;
  description: string;
};

export type Driver = {
  position: string;
  code: string;
  name: string;
  team: string;
  gap: string;
  status: "Attack" | "Box" | "Defend" | "Push";
};

export type Stint = {
  compound: string;
  laps: string;
  delta: string;
};

export const navItems: NavItem[] = [
  { label: "Live", href: "#live" },
  { label: "Strategy", href: "#strategy" },
  { label: "Telemetry", href: "#telemetry" },
  { label: "Briefings", href: "#briefings" },
];

export const heroMetrics: Metric[] = [
  { label: "Track temp", value: "41°C", trend: "+2.1 in 8m" },
  { label: "Rain risk", value: "18%", trend: "Sector 3 cloud" },
  { label: "Safety car", value: "Low", trend: "0 incidents" },
];

export const features: Feature[] = [
  {
    eyebrow: "Race control",
    title: "Signal without the noise",
    description:
      "Priority alerts separate verified race-control calls from paddock chatter, with context and timing impact surfaced instantly.",
  },
  {
    eyebrow: "Strategy",
    title: "Model every stop before it happens",
    description:
      "Compare undercut, overcut, tyre degradation, and virtual safety-car windows from a unified strategy board.",
  },
  {
    eyebrow: "Telemetry",
    title: "Read the lap like an engineer",
    description:
      "Sector pace, tyre energy, deployment, and traffic deltas are translated into plain-English race insight.",
  },
];

export const leaderboard: Driver[] = [
  { position: "01", code: "VER", name: "Max Verstappen", team: "Red Bull Racing", gap: "Leader", status: "Defend" },
  { position: "02", code: "NOR", name: "Lando Norris", team: "McLaren", gap: "+1.842", status: "Attack" },
  { position: "03", code: "LEC", name: "Charles Leclerc", team: "Ferrari", gap: "+4.210", status: "Push" },
  { position: "04", code: "HAM", name: "Lewis Hamilton", team: "Ferrari", gap: "+7.905", status: "Box" },
];

export const stints: Stint[] = [
  { compound: "Medium", laps: "17 laps", delta: "Best for lap 21" },
  { compound: "Hard", laps: "31 laps", delta: "+3.4s race time" },
  { compound: "Soft", laps: "12 laps", delta: "Quali sim only" },
];
