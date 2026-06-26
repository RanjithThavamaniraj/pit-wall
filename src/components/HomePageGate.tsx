"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSportPreference } from "@/hooks/useSportPreference";
import type { Sport } from "@/lib/sport";

type Props = {
  serverSport: Sport;
  f1: React.ReactNode;
  motogp: React.ReactNode;
};

export function HomePageGate({ serverSport, f1, motogp }: Props) {
  const { preferredSport, hydrated } = useSportPreference();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || preferredSport === serverSport) return;
    router.refresh();
  }, [hydrated, preferredSport, serverSport, router]);

  const sport = hydrated ? preferredSport : serverSport;
  return <>{sport === "motogp" ? motogp : f1}</>;
}
