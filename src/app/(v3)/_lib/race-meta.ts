import type { Race, Sport } from "@/lib/races";
import type { RaceDistance } from "@/types/database";
import type { Language } from "./i18n";

/* Race enrichment + date math for the v3 surface.
   Pure helpers (no "use client") so both server and client may import.
   Reads the existing race catalog read-only. */

export const SPORT_LABEL: Record<Sport, { sv: string; en: string }> = {
  running: { sv: "Löpning", en: "Running" },
  cycling: { sv: "Cykling", en: "Cycling" },
  xc_skiing: { sv: "Längdskidor", en: "XC skiing" },
  swimming: { sv: "Simning", en: "Swimming" },
  triathlon: { sv: "Triathlon", en: "Triathlon" },
  swimrun: { sv: "Swimrun", en: "Swimrun" },
  other: { sv: "Annat", en: "Other" },
};

/* Accent per sport, drawn from the v3 token family. */
export const SPORT_ACCENT: Record<Sport, string> = {
  running: "var(--v3-electric-bright)",
  cycling: "var(--v3-violet)",
  xc_skiing: "var(--v3-ice)",
  swimming: "var(--v3-cyan)",
  triathlon: "var(--v3-ember)",
  swimrun: "var(--v3-cyan)",
  other: "var(--v3-electric-bright)",
};

/* Short terrain / format descriptor — the "race as hero" texture.
   Klassiker races are individually mapped; the rest fall back per sport. */
const RACE_TEXTURE: Record<string, { sv: string; en: string }> = {
  vasaloppet: { sv: "90 km klassiskt spår · Sälen → Mora", en: "90 km classic track · Sälen → Mora" },
  vatternrundan: { sv: "300 km runt Vättern · start i natten", en: "300 km around Lake Vättern · night start" },
  vansbrosimningen: { sv: "1 km öppet vatten · nedströms Vanån", en: "1 km open water · down the Vanån" },
  lidingoloppet: { sv: "30 km terräng · rötter, backar, skog", en: "30 km cross-country · roots, hills, forest" },
  goteborgsvarvet: { sv: "21,1 km stadslopp · broarna & folkhavet", en: "21.1 km city race · the bridges & the crowds" },
  "stockholm-marathon": { sv: "42,2 km · mål på Stadion från 1912", en: "42.2 km · finish in the 1912 Olympic Stadium" },
  ultravasan: { sv: "90 km stig & grus · Sälen → Mora", en: "90 km trail & gravel · Sälen → Mora" },
  "berlin-marathon": { sv: "42,2 km · platt, snabbt, världsrekordbana", en: "42.2 km · flat, fast, world-record course" },
};

const SPORT_TEXTURE: Record<Sport, { sv: string; en: string }> = {
  running: { sv: "Asfalt & rytm · negativ split", en: "Tarmac & rhythm · negative split" },
  cycling: { sv: "Watt & uthållighet · långa block", en: "Watts & endurance · long blocks" },
  xc_skiing: { sv: "Snö & teknik · jämn fart", en: "Snow & technique · steady pace" },
  swimming: { sv: "Öppet vatten · sikta & andas", en: "Open water · sight & breathe" },
  triathlon: { sv: "Tre sporter · växlingar & balans", en: "Three sports · transitions & balance" },
  swimrun: { sv: "Hav & klippor · sim/löp-växlingar", en: "Sea & rock · swim/run transitions" },
  other: { sv: "Uthållighet · din distans", en: "Endurance · your distance" },
};

export function raceTexture(race: Race, lang: Language): string {
  return (RACE_TEXTURE[race.id] ?? SPORT_TEXTURE[race.sport])[lang];
}

export function raceDescription(race: Race, lang: Language): string {
  return lang === "sv" ? race.descriptionSv : race.description;
}

const MONTHS: Record<Language, string[]> = {
  sv: ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/* MOCK: the catalog stores month only; we nominate the 15th and skip to next
   year if the date is in the past or too close (< ~6 weeks) to build a plan. */
export function nextRaceDate(month: number, from: Date = new Date()): Date {
  const minLeadDays = 42;
  let year = from.getFullYear();
  let candidate = new Date(year, month - 1, 15);
  const earliest = new Date(from.getTime() + minLeadDays * 86400000);
  if (candidate < earliest) {
    year += 1;
    candidate = new Date(year, month - 1, 15);
  }
  return candidate;
}

export function weeksUntil(date: Date, from: Date = new Date()): number {
  const ms = date.getTime() - from.getTime();
  return Math.max(0, Math.round(ms / (7 * 86400000)));
}

export function daysUntil(date: Date, from: Date = new Date()): number {
  return Math.max(0, Math.ceil((date.getTime() - from.getTime()) / 86400000));
}

export function formatRaceDate(date: Date, lang: Language): string {
  return `${date.getDate()} ${MONTHS[lang][date.getMonth()]} ${date.getFullYear()}`;
}

export function monthLabel(month: number, lang: Language): string {
  return MONTHS[lang][month - 1];
}

const WEEKDAYS: Record<Language, string[]> = {
  sv: ["sön", "mån", "tis", "ons", "tor", "fre", "lör"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

/** "tor 18 jun" — compact weekday + day + month. */
export function formatDayLabel(date: Date, lang: Language): string {
  return `${WEEKDAYS[lang][date.getDay()]} ${date.getDate()} ${MONTHS[lang][date.getMonth()]}`;
}

/* Map an arbitrary endurance distance onto the running engine's distance
   bucket, used to drive the (running-based) preview generator. */
export function distanceToRaceDistance(km: number): RaceDistance {
  if (km <= 7) return "5k";
  if (km <= 15) return "10k";
  if (km <= 30) return "half_marathon";
  return "marathon";
}

/* Clamp real time-to-race into a sensible preview plan length. */
export function clampPlanWeeks(weeks: number): number {
  return Math.min(24, Math.max(8, weeks));
}

export function formatDistance(km: number, lang: Language): string {
  const n = km >= 10 ? Math.round(km) : km;
  return lang === "sv" ? `${String(n).replace(".", ",")} km` : `${n} km`;
}
