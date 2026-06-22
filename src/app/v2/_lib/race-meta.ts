import type { Race, Sport } from "@/lib/races";
import type { RaceDistance } from "@/types/database";
import type { Language } from "./i18n";

/* Race enrichment + date math for the v2 preview.
   Pure helpers (no "use client") so both server and client may import.
   Reads the existing race catalog read-only. */

export const SPORT_GRADIENT: Record<Sport, string> = {
  running: "from-[#2f6bff] to-[#38e0ff]",
  cycling: "from-[#7c5cff] to-[#2f6bff]",
  xc_skiing: "from-[#38e0ff] to-[#b8ecff]",
  swimming: "from-[#1e6bff] to-[#0bd1d1]",
  triathlon: "from-[#7c5cff] to-[#38e0ff]",
  swimrun: "from-[#2f6bff] to-[#0bd1d1]",
  other: "from-[#4f8bff] to-[#7c5cff]",
};

export const SPORT_LABEL: Record<Sport, { sv: string; en: string }> = {
  running: { sv: "Löpning", en: "Running" },
  cycling: { sv: "Cykling", en: "Cycling" },
  xc_skiing: { sv: "Längdskidor", en: "XC skiing" },
  swimming: { sv: "Simning", en: "Swimming" },
  triathlon: { sv: "Triathlon", en: "Triathlon" },
  swimrun: { sv: "Swimrun", en: "Swimrun" },
  other: { sv: "Annat", en: "Other" },
};

/* Short terrain / format descriptor — the "race as hero" texture.
   Falls back to a sport-level default when a race isn't individually mapped. */
const RACE_TEXTURE: Record<string, { sv: string; en: string }> = {
  vasaloppet: { sv: "90 km klassiskt spår · Sälen → Mora", en: "90 km classic track · Sälen → Mora" },
  vatternrundan: { sv: "300 km runt Vättern · masstart i natten", en: "300 km around Lake Vättern · mass start at night" },
  vansbrosimningen: { sv: "1 km öppet vatten · strömmande Vanån", en: "1 km open water · the flowing Vanån" },
  lidingoloppet: { sv: "30 km terräng · rötter, backar, skog", en: "30 km cross-country · roots, hills, forest" },
};

const SPORT_TEXTURE: Record<Sport, { sv: string; en: string }> = {
  running: { sv: "Asfalt & rytm · negativ split", en: "Tarmac & rhythm · negative split" },
  cycling: { sv: "Watt & uthållighet · långa block", en: "Watts & endurance · long blocks" },
  xc_skiing: { sv: "Snö & teknik · jämn fart", en: "Snow & technique · steady pace" },
  swimming: { sv: "Öppet vatten · sikta & andas", en: "Open water · sight & breathe" },
  triathlon: { sv: "Tre sporter · brick & balans", en: "Three sports · bricks & balance" },
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

/* The catalog stores month only; resolve to the next plausible race date.
   We nominate the 15th and skip to next year if the date is in the past or
   too close to build a meaningful plan (< ~6 weeks out). */
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

const WEEKDAYS: Record<Language, string[]> = {
  sv: ["sön", "mån", "tis", "ons", "tor", "fre", "lör"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

/** "tor 18 jun" — compact weekday + day + month for plan/session surfaces. */
export function formatDayLabel(date: Date, lang: Language): string {
  return `${WEEKDAYS[lang][date.getDay()]} ${date.getDate()} ${MONTHS[lang][date.getMonth()]}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/* Map an arbitrary endurance distance onto the running engine's distance bucket,
   used to drive the (running-based) preview generator. */
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
