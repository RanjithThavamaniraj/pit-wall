/**
 * Static team color lookup by constructor name.
 * Update once per season when liveries change.
 * Colors are the team's primary livery color.
 */
export const TEAM_COLORS: Record<string, string> = {
  // 2025 grid
  "Red Bull Racing": "#3671C6",
  "Red Bull": "#3671C6",
  McLaren: "#FF8000",
  Ferrari: "#E8002D",
  Mercedes: "#27F4D2",
  "Aston Martin": "#229971",
  "Aston Martin Aramco": "#229971",
  Alpine: "#FF87BC",
  "Alpine F1 Team": "#FF87BC",
  Williams: "#64C4FF",
  "RB F1 Team": "#6692FF",
  RB: "#6692FF",
  "Visa Cash App RB": "#6692FF",
  Haas: "#B6BABD",
  "Haas F1 Team": "#B6BABD",
  Sauber: "#52E252",
  "Kick Sauber": "#52E252",
};

/**
 * Get a team's primary color. Falls back to a neutral slate tone.
 */
export function getTeamColor(constructorName: string): string {
  return TEAM_COLORS[constructorName] ?? "#64748b";
}

/**
 * Get a team's background variant (used for subtle row tinting).
 * Returns a CSS rgba string at 12% opacity.
 */
export function getTeamColorBg(constructorName: string): string {
  const hex = getTeamColor(constructorName);
  // Convert hex to rgb components
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}
