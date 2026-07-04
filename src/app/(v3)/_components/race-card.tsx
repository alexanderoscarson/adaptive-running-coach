"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Race } from "@/lib/races";
import { useV3I18n } from "../_lib/i18n";
import { SPORT_LABEL, formatDistance, monthLabel, raceTexture } from "../_lib/race-meta";
import { CourseProfile } from "./course-profile";

/** Landing showcase card — one Klassiker race, course silhouette front and
 *  center. The whole card links into onboarding with the race preselected. */
export function RaceShowcaseCard({ race }: { race: Race }) {
  const { t, lang } = useV3I18n();
  return (
    <Link
      href={`/v3/onboarding?race=${race.id}`}
      className="v3-card v3-lift group relative block overflow-hidden p-6 hover:v3-glow-strong sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="v3-eyebrow">{SPORT_LABEL[race.sport][lang]}</div>
          <h3 className="mt-2 text-3xl transition-colors group-hover:text-[var(--v3-electric-bright)] sm:text-4xl">
            {race.name}
          </h3>
          <p className="v3-mono mt-2 text-xs text-[var(--muted-foreground)]">{raceTexture(race, lang)}</p>
        </div>
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--v3-hairline-strong)] text-[var(--muted-foreground)] transition-all duration-300 group-hover:rotate-45 group-hover:border-[var(--primary)] group-hover:text-[var(--v3-electric-bright)]"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      <CourseProfile race={race} className="mt-4 h-36 w-full" showCheckpoints={false} loopSeconds={12} />

      <div className="v3-mono mt-4 flex items-center justify-between border-t border-[var(--v3-hairline)] pt-4 text-[11px] uppercase tracking-[0.15em] text-[var(--muted-foreground)]">
        <span>{formatDistance(race.distanceKm, lang)}</span>
        <span className="text-[var(--v3-ember)]">★ {t("races.klassiker")}</span>
        <span>{monthLabel(race.month, lang)}</span>
      </div>
    </Link>
  );
}
