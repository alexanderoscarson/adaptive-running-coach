"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Race } from "@/lib/races";
import { SPORT_EMOJI } from "@/lib/races";
import { useV2I18n } from "../_lib/i18n";
import { SPORT_GRADIENT, SPORT_LABEL, raceTexture, nextRaceDate, formatRaceDate } from "../_lib/race-meta";

export function RaceCard({ race, featured = false }: { race: Race; featured?: boolean }) {
  const { lang, t } = useV2I18n();
  const date = nextRaceDate(race.month);

  return (
    <Link
      href={`/v2/onboarding?race=${race.id}`}
      className={`v2-lift group relative block overflow-hidden rounded-[1.25rem] ${
        featured ? "sm:row-span-2" : ""
      }`}
      style={{ border: "1px solid var(--v2-hairline)" }}
    >
      {/* gradient cover */}
      <div className={`relative bg-gradient-to-br ${SPORT_GRADIENT[race.sport]} ${featured ? "p-7 sm:p-8" : "p-6"}`}>
        <div className="absolute inset-0 opacity-30 mix-blend-overlay v2-grid" />
        <div className="relative flex items-start justify-between">
          <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {SPORT_EMOJI[race.sport]} {SPORT_LABEL[race.sport][lang]}
          </span>
          {race.klassiker && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#0a1226]">
              {t("races.klassiker")}
            </span>
          )}
        </div>

        <h3
          className={`relative mt-10 text-white drop-shadow-sm ${
            featured ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {race.name}
        </h3>
        <p className="relative mt-2 max-w-sm text-sm font-semibold text-white/85">
          {raceTexture(race, lang)}
        </p>
      </div>

      {/* footer */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ background: "var(--card)" }}
      >
        <div className="flex items-baseline gap-4">
          <span className="tabular text-lg font-bold text-foreground">
            {race.distanceKm} <span className="text-xs text-muted-foreground">km</span>
          </span>
          <span className="text-xs font-semibold text-muted-foreground">{formatRaceDate(date, lang)}</span>
        </div>
        <span
          className="v2-transition flex h-8 w-8 items-center justify-center rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground"
          style={{ background: "color-mix(in oklab, var(--primary) 12%, transparent)" }}
        >
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
