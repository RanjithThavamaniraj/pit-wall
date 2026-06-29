"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { RaceSummarySport, PodiumFinisher } from "@/lib/race-summary/types";
import { countryCodeToFlag } from "@/lib/utils";
import { getTeamBranding } from "@/lib/race-summary/branding";
import { PersonAvatar } from "./PersonAvatar";
import { TeamBadge } from "./TeamBadge";
import { podiumItemVariants } from "./motion";

const MEDALS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

type Props = {
  sport: RaceSummarySport;
  title: string;
  icon?: string;
  finishers: PodiumFinisher[];
  emptyMessage?: string;
};

function PodiumFinisherCard({
  sport,
  finisher,
  featured = false,
}: {
  sport: RaceSummarySport;
  finisher: PodiumFinisher;
  featured?: boolean;
}) {
  const branding = getTeamBranding(finisher.team, sport);
  const flag = finisher.countryCode
    ? countryCodeToFlag(finisher.countryCode)
    : null;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm ${
        featured
          ? "border-amber-300/20 bg-gradient-to-b from-amber-300/[0.08] to-white/[0.03] px-5 py-6"
          : "border-white/[0.08] bg-white/[0.03] px-4 py-4"
      }`}
      style={{
        boxShadow: featured
          ? `0 0 40px ${branding.color}18`
          : `inset 4px 0 0 ${branding.color}66`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:gap-4">
        <div className="relative">
          <span
            className={`absolute -right-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-slate-950 text-sm ${
              featured ? "h-8 w-8 text-base" : ""
            }`}
            aria-hidden="true"
          >
            {MEDALS[finisher.position] ?? finisher.position}
          </span>
          <PersonAvatar
            sport={sport}
            name={finisher.name}
            team={finisher.team}
            imageSlug={finisher.imageSlug}
            size={featured ? "xl" : "lg"}
          />
        </div>
        <div className="mt-4 min-w-0 flex-1 sm:mt-0">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <TeamBadge sport={sport} team={finisher.team} />
            {finisher.number !== undefined ? (
              <span className="font-mono text-xs text-amber-200/70">
                #{finisher.number}
              </span>
            ) : null}
          </div>
          <h4
            className={`mt-2 font-semibold text-white ${
              featured ? "text-xl sm:text-2xl" : "text-lg"
            }`}
          >
            {finisher.name}
          </h4>
          {finisher.team ? (
            <p className="mt-1 text-sm text-slate-400">{finisher.team}</p>
          ) : null}
          {finisher.nationality || flag ? (
            <p className="mt-1.5 text-xs text-slate-500">
              {flag ? <span className="mr-1.5">{flag}</span> : null}
              {finisher.nationality}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function PodiumCardComponent({
  sport,
  title,
  icon = "🏆",
  finishers,
  emptyMessage = "Results not available yet.",
}: Props) {
  const podium = finishers
    .filter((finisher) => finisher.position <= 3)
    .sort((a, b) => a.position - b.position);

  const first = podium.find((finisher) => finisher.position === 1);
  const second = podium.find((finisher) => finisher.position === 2);
  const third = podium.find((finisher) => finisher.position === 3);

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h3>
      {podium.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="mt-5 space-y-3">
          {first ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={podiumItemVariants}
              transition={{ delay: 0 }}
            >
              <PodiumFinisherCard sport={sport} finisher={first} featured />
            </motion.div>
          ) : null}
          {(second || third) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {second ? (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={podiumItemVariants}
                  transition={{ delay: 0.08 }}
                >
                  <PodiumFinisherCard sport={sport} finisher={second} />
                </motion.div>
              ) : null}
              {third ? (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={podiumItemVariants}
                  transition={{ delay: 0.16 }}
                >
                  <PodiumFinisherCard sport={sport} finisher={third} />
                </motion.div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export const PodiumCard = memo(PodiumCardComponent);
