"use client";

import { useMemo, useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { searchRaces, getKlassikerRaces, SPORT_EMOJI, type Race } from "@/lib/races";
import { useV2I18n } from "../_lib/i18n";
import { SPORT_LABEL, raceTexture, nextRaceDate, formatRaceDate } from "../_lib/race-meta";

export function RacePicker({ onSelect }: { onSelect: (race: Race) => void }) {
  const { lang, t } = useV2I18n();
  const [query, setQuery] = useState("");
  const [onlyKlassiker, setOnlyKlassiker] = useState(false);

  const results = useMemo(() => {
    if (onlyKlassiker && query.length < 2) return getKlassikerRaces();
    const base = searchRaces(query);
    return onlyKlassiker ? base.filter((r) => r.klassiker) : base;
  }, [query, onlyKlassiker]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("ob.s1.search")}
            className="v2-ring-focus w-full rounded-2xl bg-[var(--card)] py-3.5 pl-11 pr-4 text-base font-medium text-foreground placeholder:text-muted-foreground"
            style={{ border: "1px solid var(--v2-hairline)" }}
          />
        </div>
        <div className="flex gap-2">
          {[
            { k: false, label: t("ob.s1.all") },
            { k: true, label: t("ob.s1.klassiker") },
          ].map((opt) => (
            <button
              key={String(opt.k)}
              type="button"
              onClick={() => setOnlyKlassiker(opt.k)}
              className="v2-ring-focus v2-transition rounded-2xl px-4 py-3.5 text-sm font-bold"
              style={
                onlyKlassiker === opt.k
                  ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                  : { border: "1px solid var(--v2-hairline)", color: "var(--muted-foreground)" }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 max-h-[52vh] space-y-2 overflow-y-auto pr-1">
        {results.length === 0 && (
          <p className="py-10 text-center text-sm font-semibold text-muted-foreground">{t("ob.s1.empty")}</p>
        )}
        {results.map((race) => (
          <button
            key={race.id}
            type="button"
            onClick={() => onSelect(race)}
            className="v2-transition group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left hover:bg-[var(--card)]"
            style={{ border: "1px solid var(--v2-hairline)" }}
          >
            <span className="text-2xl" aria-hidden>{SPORT_EMOJI[race.sport]}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-base font-bold text-foreground">{race.name}</span>
                {race.klassiker && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                    style={{ background: "color-mix(in oklab, var(--primary) 16%, transparent)", color: "var(--accent)" }}
                  >
                    {t("races.klassiker")}
                  </span>
                )}
              </span>
              <span className="mt-0.5 block truncate text-xs font-semibold text-muted-foreground">
                {SPORT_LABEL[race.sport][lang]} · {race.distanceKm} km · {formatRaceDate(nextRaceDate(race.month), lang)}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground v2-transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </button>
        ))}
      </div>
    </div>
  );
}
