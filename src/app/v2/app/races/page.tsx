"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { searchRaces, RACES, SPORT_EMOJI, type Sport } from "@/lib/races";
import { useV2I18n } from "../../_lib/i18n";
import {
  SPORT_GRADIENT,
  SPORT_LABEL,
  raceTexture,
  raceDescription,
  formatRaceDate,
  nextRaceDate,
} from "../../_lib/race-meta";
import { getAppPlan } from "../../_lib/mock-app-data";
import { PageHeader } from "../../_components/app-ui";
import { RaceCard } from "../../_components/race-card";

const SPORTS: Sport[] = Array.from(new Set(RACES.map((r) => r.sport)));

export default function RacesPage() {
  const { lang, t } = useV2I18n();
  const current = getAppPlan().race;
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<Sport | "all">("all");

  const results = useMemo(() => {
    const base = searchRaces(query);
    return sport === "all" ? base : base.filter((r) => r.sport === sport);
  }, [query, sport]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <PageHeader eyebrow={t("races2.eyebrow")} title={t("races2.title")} sub={t("races2.sub")} />

      {/* ===== CURRENT RACE — VISUALLY CENTERED ===== */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-8 overflow-hidden rounded-[1.5rem]"
        style={{ border: "1px solid var(--v2-hairline)" }}
      >
        <div className={`relative bg-gradient-to-br ${SPORT_GRADIENT[current.sport]} p-7 sm:p-9`}>
          <div className="absolute inset-0 v2-grid opacity-25 mix-blend-overlay" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                {SPORT_EMOJI[current.sport]} {SPORT_LABEL[current.sport][lang]}
              </span>
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#0a1226]">
                {t("races2.current")}
              </span>
            </div>
            <h2 className="mt-4 text-4xl text-white sm:text-5xl lg:text-6xl">{current.name}</h2>
            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-white/90">
              {raceDescription(current, lang)}
            </p>
            <div className="mt-6 grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
              <ContextTile label={t("races2.terrain")} value={raceTexture(current, lang)} />
              <ContextTile label={t("races2.distance")} value={`${current.distanceKm} km`} />
              <ContextTile label={t("races2.when")} value={formatRaceDate(nextRaceDate(current.month), lang)} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== SEARCH + FILTERS ===== */}
      <div className="sticky top-0 z-10 mt-6 -mx-5 px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8"
        style={{ background: "color-mix(in oklab, var(--background) 80%, transparent)" }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("ob.s1.search")}
            className="v2-ring-focus w-full rounded-2xl bg-[var(--card)] py-3.5 pl-11 pr-4 text-base font-medium text-foreground placeholder:text-muted-foreground"
            style={{ border: "1px solid var(--v2-hairline)" }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip active={sport === "all"} onClick={() => setSport("all")} label={t("races2.allSports")} />
          {SPORTS.map((s) => (
            <FilterChip
              key={s}
              active={sport === s}
              onClick={() => setSport(s)}
              label={`${SPORT_EMOJI[s]} ${SPORT_LABEL[s][lang]}`}
            />
          ))}
        </div>
      </div>

      {/* ===== RESULTS ===== */}
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {t("races2.count", { n: String(results.length) })}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((race, i) => (
          <motion.div
            key={race.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.02, 0.2) }}
          >
            <RaceCard race={race} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ContextTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 px-4 py-3 backdrop-blur-sm">
      <div className="text-[10px] font-black uppercase tracking-wider text-white/70">{label}</div>
      <div className="mt-1 text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="v2-ring-focus v2-transition rounded-full px-3.5 py-2 text-sm font-bold"
      style={
        active
          ? { background: "var(--primary)", color: "var(--primary-foreground)" }
          : { border: "1px solid var(--v2-hairline)", color: "var(--muted-foreground)" }
      }
    >
      {label}
    </button>
  );
}
