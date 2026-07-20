"use client";

import { useCallback, useState } from "react";
import { TrackMap } from "@/components/TrackMap";
import { useLiveRaceState } from "@/lib/live";

type Props = {
  circuitSvgUrl: string;
  circuitName: string;
};

/**
 * Hero circuit layer: static outline as fallback, live TrackMap once ready.
 * Uses the mock provider until real F1 / MotoGP providers are wired.
 */
export function HeroCircuit({ circuitSvgUrl, circuitName }: Props) {
  const state = useLiveRaceState("mock");
  const [mapReady, setMapReady] = useState(false);
  const handleReady = useCallback(() => setMapReady(true), []);

  const hasDrivers = Boolean(state && state.drivers.length > 0);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={circuitSvgUrl}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`hero-stage-circuit transition-opacity duration-500 ${
          mapReady ? "opacity-0" : ""
        }`}
      />
      {hasDrivers && state ? (
        <TrackMap
          circuitSvgUrl={circuitSvgUrl}
          state={state}
          label={`${circuitName} live circuit`}
          onReady={handleReady}
        />
      ) : null}
    </>
  );
}
