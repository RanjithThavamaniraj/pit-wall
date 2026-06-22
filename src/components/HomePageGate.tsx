"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSportPreference } from "@/hooks/useSportPreference";
import { isValidSport, SPORT_COOKIE_KEY, type Sport } from "@/lib/sport";
import { Container } from "@/components/ui";

function readSportCookie(): Sport | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${SPORT_COOKIE_KEY}=`));
  const value = match?.split("=")[1] ?? null;
  return isValidSport(value) ? value : null;
}

function HomeSkeleton() {
  return (
    <div className="py-24">
      <Container>
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-2/3 max-w-lg rounded-lg bg-white/5" />
          <div className="h-4 w-1/2 max-w-sm rounded bg-white/5" />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-40 rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}

type Props = {
  serverSport: Sport | null;
  f1: React.ReactNode;
  motogp: React.ReactNode;
};

export function HomePageGate({ serverSport, f1, motogp }: Props) {
  const { preferredSport, hydrated } = useSportPreference();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || serverSport !== null) return;
    if (readSportCookie()) {
      router.refresh();
    }
  }, [hydrated, serverSport, router]);

  if (!hydrated) {
    return <HomeSkeleton />;
  }

  const sport = serverSport ?? preferredSport;
  return <>{sport === "motogp" ? motogp : f1}</>;
}
