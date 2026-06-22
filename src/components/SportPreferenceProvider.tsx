"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getEquivalentRoute,
  isValidSport,
  setSportCookie,
  SPORT_COOKIE_KEY,
  SPORT_STORAGE_KEY,
  sportFromPathname,
  type Sport,
} from "@/lib/sport";

type SportPreferenceContextValue = {
  activeSport: Sport;
  preferredSport: Sport;
  hydrated: boolean;
  switchSport: (sport: Sport) => void;
};

const SportPreferenceContext =
  createContext<SportPreferenceContextValue | null>(null);

function readSportCookie(): Sport | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${SPORT_COOKIE_KEY}=`));
  const value = match?.split("=")[1] ?? null;
  return isValidSport(value) ? value : null;
}

export function SportPreferenceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const routeSport = sportFromPathname(pathname);
  const [preferredSport, setPreferredSport] = useState<Sport>("f1");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const fromCookie = readSportCookie();
    const stored = localStorage.getItem(SPORT_STORAGE_KEY);
    const sport = isValidSport(fromCookie)
      ? fromCookie
      : isValidSport(stored)
      ? stored
      : "f1";

    setPreferredSport(sport);
    localStorage.setItem(SPORT_STORAGE_KEY, sport);
    setSportCookie(sport);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (pathname === "/") return;
    const sport = sportFromPathname(pathname);
    setPreferredSport(sport);
    localStorage.setItem(SPORT_STORAGE_KEY, sport);
    setSportCookie(sport);
  }, [pathname]);

  const activeSport = pathname === "/" ? preferredSport : routeSport;

  const switchSport = useCallback(
    (targetSport: Sport) => {
      setPreferredSport(targetSport);
      localStorage.setItem(SPORT_STORAGE_KEY, targetSport);
      setSportCookie(targetSport);

      if (pathname === "/") {
        router.refresh();
        return;
      }

      const nextRoute = getEquivalentRoute(pathname, targetSport);
      if (nextRoute !== pathname) {
        router.push(nextRoute);
      }
    },
    [pathname, router]
  );

  const value = useMemo(
    () => ({
      activeSport,
      preferredSport,
      hydrated,
      switchSport,
    }),
    [activeSport, preferredSport, hydrated, switchSport]
  );

  return (
    <SportPreferenceContext.Provider value={value}>
      {children}
    </SportPreferenceContext.Provider>
  );
}

export function useSportPreference() {
  const context = useContext(SportPreferenceContext);
  if (!context) {
    throw new Error(
      "useSportPreference must be used within SportPreferenceProvider"
    );
  }
  return context;
}
