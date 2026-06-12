"use client";

import { useState, useEffect } from "react";

export type CountdownValues = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
};

/**
 * Returns a live countdown to a target date.
 * Updates every second.
 * Returns zeros + isExpired=true once the target date is in the past.
 */
export function useCountdown(targetDate: Date | string | null): CountdownValues {
  const getValues = (): CountdownValues => {
    if (!targetDate) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true };
    }
    const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
    const diff = target.getTime() - Date.now();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds, totalSeconds, isExpired: false };
  };

  // Use null initially to avoid hydration mismatch
  const [values, setValues] = useState<CountdownValues | null>(null);

  useEffect(() => {
    // Set immediately after mount (client only)
    setValues(getValues());

    const interval = setInterval(() => {
      setValues(getValues());
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  // Return a stable zero state during SSR / before hydration
  if (values === null) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: false };
  }

  return values;
}
