"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Search } from "lucide-react";
import { RACES, getKlassikerRaces, type Race, type Sport } from "@/lib/races";
import { useV3I18n } from "../_lib/i18n";
import { SPORT_LABEL, formatDistance, monthLabel, raceTexture } from "../_lib/race-meta";
import { CourseProfile } from "./course-profile";
import { EASE } from "./motion";

type Filter = "klassiker" | "all" | Sport;

const SPORT_FILTERS: Sport[] = ["running", "cycling", "xc_skiing", "swimming", "triathlon", "swimrun"];

function RaceOption({
  race,
  selected,
  onSelect,
  featured,
}: {
  race: Race;
  selected: boolean;
  onSelect: (race: Race) => void;
  featured?: boolean;
}) {
  const { lang } = useV3I18n();
  return (
    <motion.button
      layout
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(race)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={`v3-card v3-lift relative w-full p-5 text-left transition-shadow ${
        selected ? "v3-glow-strong !border-[var(--primary)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="v3-eyebrow">{SPORT_LABEL[race.sport][lang]}</div>
          <h3 className={`mt-1.5 truncate ${featured ? "text-2xl sm:text-3xl" : "text-xl"}`}>{race.name}</h3>
          <p className="v3-mono mt-1.5 truncate text-[11px] text-[var(--muted-foreground)]">
            {raceTexture(race, lang)}
          </p>
        </div>
        <span
          aria-hidden
          className={`grid size-7 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
            selected
              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
              : "border-[var(--v3-hairline-strong)] text-transparent"
          }`}
        >
          <Check className="size-4" />
        </span>
      </div>

      {featured && (
        <CourseProfile race={race} className="mt-3 h-24 w-full" showCheckpoints={false} runner={selected} loopSeconds={10} />
      )}

      <div className="v3-mono mt-4 flex items-center justify-between border-t border-[var(--v3-hairline)] pt-3 text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        <span>{formatDistance(race.distanceKm, lang)}</span>
        {race.klassiker && <span className="text-[var(--v3-ember)]">★ Klassiker</span>}
        <span>
          {monthLabel(race.month, lang)} · {race.country}
        </span>
      </div>
    </motion.button>
  );
}

export function RacePicker({
  selected,
  onSelect,
}: {
  selected: Race | null;
  onSelect: (race: Race) => void;
}) {
  const { t, lang } = useV3I18n();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("klassiker");

  const results = useMemo(() => {
    let list: Race[] = filter === "klassiker" ? getKlassikerRaces() : RACES;
    if (filter !== "klassiker" && filter !== "all") list = list.filter((r) => r.sport === filter);
    const q = query.trim().toLowerCase();
    if (q.length >= 2) {
      list = (filter === "klassiker" ? RACES : list).filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.country.toLowerCase().includes(q) ||
          SPORT_LABEL[r.sport][lang].toLowerCase().includes(q)
      );
    }
    return list;
  }, [query, filter, lang]);

  const featured = filter === "klassiker" && query.trim().length < 2;

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[var(--muted-foreground)]" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("ob.race.search")}
          aria-label={t("ob.race.search")}
          className="w-full rounded-2xl border border-[var(--v3-hairline-strong)] bg-[var(--card)] py-4 pl-13 pr-5 text-base outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]"
          style={{ paddingLeft: "3.25rem" }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter">
        <button type="button" className="v3-chip" data-active={filter === "klassiker"} onClick={() => setFilter("klassiker")}>
          ★ {t("ob.race.klassiker")}
        </button>
        <button type="button" className="v3-chip" data-active={filter === "all"} onClick={() => setFilter("all")}>
          {t("ob.race.all")} ({RACES.length})
        </button>
        {SPORT_FILTERS.map((s) => (
          <button key={s} type="button" className="v3-chip" data-active={filter === s} onClick={() => setFilter(s)}>
            {SPORT_LABEL[s][lang]}
          </button>
        ))}
      </div>

      <div
        role="radiogroup"
        aria-label={t("ob.race.title")}
        className={`mt-6 grid gap-4 ${featured ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
      >
        {results.map((race) => (
          <RaceOption
            key={race.id}
            race={race}
            selected={selected?.id === race.id}
            onSelect={onSelect}
            featured={featured}
          />
        ))}
      </div>

      {results.length === 0 && (
        <p className="mt-10 text-center text-sm text-[var(--muted-foreground)]">{t("ob.race.empty")}</p>
      )}
    </div>
  );
}
