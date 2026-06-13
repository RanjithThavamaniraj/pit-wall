export type SessionStatus = {
  sessionKey: number;
  sessionName: string;
  circuitShortName: string;
  flag:
    | "GREEN"
    | "YELLOW"
    | "DOUBLE_YELLOW"
    | "RED"
    | "CHEQUERED"
    | "SAFETY_CAR"
    | "VSC"
    | "FINISHED"
    | "UNKNOWN";
  trackTemp: number;
  airTemp: number;
};

export type TimingRowData = {
  driverNumber: number;
  driverCode: string;
  firstName: string;
  lastName: string;
  teamName: string;
  teamColor: string;
  position: number;
  intervalToLeader: string;
  intervalToNext: string;
};

import type { WeekendContext } from "./weekend";

export type LiveTimingPayload = {
  weekendContext: WeekendContext;
  session: SessionStatus | null;
  timing: TimingRowData[];
};

// OpenF1 Types
export type OpenF1Session = {
  session_key: number;
  session_name: string;
  circuit_short_name: string;
};

export type OpenF1Driver = {
  driver_number: number;
  name_acronym: string;
  first_name: string;
  last_name: string;
  team_name: string;
  team_colour: string;
};

export type OpenF1Position = {
  driver_number: number;
  position: number;
  date: string;
};

export type OpenF1Interval = {
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
  date: string;
};

export type OpenF1RaceControl = {
  flag: string;
  category: string;
  message: string;
  date: string;
};

export type OpenF1Weather = {
  track_temperature: number;
  air_temperature: number;
  date: string;
};
