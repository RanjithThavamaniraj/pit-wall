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
  isRaceDetailPath,
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

    let sport: Sport = "f1";
    if (isValidSport(fromCookie)) {
      sport = fromCookie;
      if (stored !== fromCookie) {
        localStorage.setItem(SPORT_STORAGE_KEY, fromCookie);
      }
    } else if (isValidSport(stored)) {
      sport = stored;
      setSportCookie(stored);
    } else {
      localStorage.setItem(SPORT_STORAGE_KEY, "f1");
      setSportCookie("f1");
    }

    setPreferredSport(sport);
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

      const navigate = async () => {
        let nextRoute = getEquivalentRoute(pathname, targetSport);

        if (isRaceDetailPath(pathname)) {
          const fromSport = sportFromPathname(pathname);
          const slug = pathname.split("/").pop();
          if (slug) {
            try {
              const res = await fetch(
                `/api/equivalent-race?from=${fromSport}&slug=${encodeURIComponent(slug)}`
              );
              if (res.ok) {
                const data: { slug?: string } = await res.json();
                if (data.slug) {
                  nextRoute =
                    targetSport === "motogp"
                      ? `/motogp/races/${data.slug}`
                      : `/races/${data.slug}`;
                }
              }
            } catch {
              // Fall back to the schedule list route from getEquivalentRoute.
            }
          }
        }

        if (nextRoute !== pathname) {
          router.push(nextRoute);
        }
      };

      void navigate();
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
