import type { Sport } from "@/lib/races";
import type { SessionType } from "@/types/database";
import type { Language } from "./i18n";
import type { ExperienceTier } from "./preview-plan";

/* ============================================================================
   Sport layer — maps the shared periodization engine onto each endurance
   sport's own physiology, per the spec's unifying model (§1):

     running        → threshold pace (min/km)
     cycling        → FTP (watts)
     swimming       → CSS (sec/100 m)
     xc_skiing      → threshold pace on skis (min/km)

   Each sport gets its own onboarding anchor question ("senaste race-tid" in
   the sport's units, FTP for cycling), its own tier defaults when no result
   exists, and its own session targets derived as fractions of the threshold.

   Triathlon/swimrun/other are NOT covered here — they keep the running
   illustration and its mock disclosure.
   ============================================================================ */

export type ThresholdKind = "runPace" | "power" | "css" | "skiPace";

export interface SportAnchorInput {
  /** Option key: run "5k".."marathon" · swim "400".."1500" (m) · ski "10".."90" (km) · bike "ftp" */
  key: string;
  /** Seconds for time anchors. */
  seconds?: number;
  /** Watts for the FTP anchor. */
  watts?: number;
}

export interface SportThreshold {
  kind: ThresholdKind;
  /** min/km for runPace/skiPace · watts for power · sec/100 m for css */
  value: number;
  fromResult: boolean;
}

/** Sports with a dedicated coaching layer (beyond running). */
export const DEDICATED_SPORTS: Sport[] = ["cycling", "swimming", "xc_skiing"];

export function hasDedicatedPlan(sport: Sport): boolean {
  return sport === "running" || DEDICATED_SPORTS.includes(sport);
}

/* ------------------------------------------------------------- anchors -- */

export interface AnchorOption {
  key: string;
  label: { sv: string; en: string };
  placeholder: string;
  kind: "time" | "watts";
}

const ANCHOR_OPTIONS: Partial<Record<Sport, AnchorOption[]>> = {
  swimming: [
    { key: "400", label: { sv: "400 m", en: "400 m" }, placeholder: "7:30", kind: "time" },
    { key: "800", label: { sv: "800 m", en: "800 m" }, placeholder: "15:45", kind: "time" },
    { key: "1500", label: { sv: "1 500 m", en: "1,500 m" }, placeholder: "30:00", kind: "time" },
  ],
  xc_skiing: [
    { key: "10", label: { sv: "10 km", en: "10 km" }, placeholder: "38:00", kind: "time" },
    { key: "30", label: { sv: "30 km", en: "30 km" }, placeholder: "2:05:00", kind: "time" },
    { key: "45", label: { sv: "45 km", en: "45 km" }, placeholder: "3:15:00", kind: "time" },
    { key: "90", label: { sv: "90 km (Vasaloppet)", en: "90 km (Vasaloppet)" }, placeholder: "7:30:00", kind: "time" },
  ],
  cycling: [{ key: "ftp", label: { sv: "Jag vet min FTP", en: "I know my FTP" }, placeholder: "220", kind: "watts" }],
};

export function anchorOptions(sport: Sport): AnchorOption[] {
  return ANCHOR_OPTIONS[sport] ?? [];
}

export function anchorOptionLabel(sport: Sport, key: string, lang: Language): string {
  const opt = anchorOptions(sport).find((o) => o.key === key);
  return opt ? opt.label[lang] : key;
}

/* ------------------------------------------------------- volume sliders -- */

export interface VolumeConfig {
  max: number;
  step: number;
  tierDefault: Record<ExperienceTier, number>;
  /** sport-km → engine (run-equivalent) km */
  toRunKm: (sportKm: number) => number;
  /** engine km → sport-km, for rendering the weekly volume chart */
  fromRunKm: (runKm: number) => number;
}

const VOLUME: Partial<Record<Sport, VolumeConfig>> = {
  cycling: {
    max: 400,
    step: 10,
    tierDefault: { beginner: 40, intermediate: 90, advanced: 160, elite: 250 },
    toRunKm: (km) => km / 3,
    fromRunKm: (km) => km * 3,
  },
  swimming: {
    max: 30,
    step: 1,
    tierDefault: { beginner: 3, intermediate: 8, advanced: 14, elite: 22 },
    toRunKm: (km) => km * 4,
    fromRunKm: (km) => km / 4,
  },
  xc_skiing: {
    max: 200,
    step: 5,
    tierDefault: { beginner: 20, intermediate: 45, advanced: 80, elite: 120 },
    toRunKm: (km) => km / 1.5,
    fromRunKm: (km) => km * 1.5,
  },
};

const RUN_VOLUME: VolumeConfig = {
  max: 120,
  step: 2,
  tierDefault: { beginner: 12, intermediate: 28, advanced: 55, elite: 85 },
  toRunKm: (km) => km,
  fromRunKm: (km) => km,
};

/** Running config is also the fallback for triathlon/swimrun/other. */
export function volumeConfig(sport: Sport): VolumeConfig {
  return VOLUME[sport] ?? RUN_VOLUME;
}

/* ---------------------------------------------------------- thresholds -- */

const TIER_FTP: Record<ExperienceTier, number> = { beginner: 140, intermediate: 190, advanced: 250, elite: 310 };
const TIER_CSS: Record<ExperienceTier, number> = { beginner: 165, intermediate: 130, advanced: 105, elite: 85 };
const TIER_SKI_PACE: Record<ExperienceTier, number> = { beginner: 8.0, intermediate: 6.5, advanced: 5.25, elite: 4.33 };

/** CSS from a single pool time: race pace per 100 m × distance factor. */
const CSS_ADJ: Record<string, number> = { "400": 1.05, "800": 1.02, "1500": 0.99 };
/** Ski threshold from a race time: race pace × factor (longer race ⇒ pace further above threshold). */
const SKI_ADJ: Record<string, number> = { "10": 0.97, "30": 0.92, "45": 0.9, "90": 0.87 };

export function deriveSportThreshold(
  sport: Sport,
  tier: ExperienceTier,
  anchor: SportAnchorInput | null
): SportThreshold | null {
  switch (sport) {
    case "cycling": {
      if (anchor?.watts && anchor.watts >= 60 && anchor.watts <= 500) {
        return { kind: "power", value: anchor.watts, fromResult: true };
      }
      return { kind: "power", value: TIER_FTP[tier], fromResult: false };
    }
    case "swimming": {
      if (anchor?.seconds && CSS_ADJ[anchor.key]) {
        const per100 = (anchor.seconds / Number(anchor.key)) * 100;
        if (per100 >= 55 && per100 <= 360) {
          return { kind: "css", value: per100 * CSS_ADJ[anchor.key], fromResult: true };
        }
      }
      return { kind: "css", value: TIER_CSS[tier], fromResult: false };
    }
    case "xc_skiing": {
      if (anchor?.seconds && SKI_ADJ[anchor.key]) {
        const paceMinKm = anchor.seconds / 60 / Number(anchor.key);
        if (paceMinKm >= 2 && paceMinKm <= 15) {
          return { kind: "skiPace", value: paceMinKm * SKI_ADJ[anchor.key], fromResult: true };
        }
      }
      return { kind: "skiPace", value: TIER_SKI_PACE[tier], fromResult: false };
    }
    default:
      return null;
  }
}

/* ------------------------------------------------------ session targets -- */

/* Intensity per session type as a fraction of threshold.
   Pace-like units (css sec/100 m, ski min/km): factor > 1 ⇒ easier (slower).
   Power (watts): factor < 1 ⇒ easier. */
const SWIM_FACTOR: Partial<Record<SessionType, number>> = {
  easy: 1.1, recovery: 1.16, long: 1.07, tempo: 1.02, intervals: 0.97, hills: 0.97, race: 1.02,
};
const SKI_FACTOR: Partial<Record<SessionType, number>> = {
  easy: 1.25, recovery: 1.35, long: 1.28, tempo: 1.04, intervals: 0.94, hills: 1.0, race: 1.05,
};
const BIKE_FACTOR: Partial<Record<SessionType, number>> = {
  easy: 0.65, recovery: 0.55, long: 0.7, tempo: 0.88, intervals: 1.1, hills: 1.02, race: 0.75,
};

export interface SportTarget {
  /** Center value in the threshold's unit. */
  value: number;
  /** Formatted range, e.g. "180–200 W", "1:56–2:03 /100 m", "5:05–5:25 /km". */
  label: string;
}

function fmtSecPer(secs: number, unit: string): string {
  const s = Math.round(secs / 5) * 5;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}${unit}`;
}

export function formatThresholdValue(kind: ThresholdKind, value: number): string {
  switch (kind) {
    case "power":
      return `${Math.round(value)} W`;
    case "css":
      return fmtSecPer(value, " /100 m");
    default:
      return fmtSecPer(value * 60, " /km");
  }
}

/** Session target in the sport's unit, as a "min–max" range label. */
export function sportTarget(threshold: SportThreshold, type: SessionType): SportTarget | null {
  const table =
    threshold.kind === "power" ? BIKE_FACTOR : threshold.kind === "css" ? SWIM_FACTOR : SKI_FACTOR;
  const factor = table[type];
  if (!factor) return null;
  const value = threshold.value * factor;

  if (threshold.kind === "power") {
    const lo = Math.round((value * 0.95) / 5) * 5;
    const hi = Math.round((value * 1.05) / 5) * 5;
    return { value, label: `${lo}–${hi} W` };
  }
  if (threshold.kind === "css") {
    const lo = fmtSecPer(value * 0.97, "");
    const hi = fmtSecPer(value * 1.03, "");
    return { value, label: `${lo}–${hi} /100 m` };
  }
  const lo = fmtSecPer(value * 60 * 0.97, "");
  const hi = fmtSecPer(value * 60 * 1.03, "");
  return { value, label: `${lo}–${hi} /km` };
}

/* -------------------------------------------------- race-day prediction -- */

export interface SportGoal {
  /** Pace/power value in the threshold's unit. */
  value: number;
  finishSeconds: number | null;
}

/** Swim race pace vs CSS by distance; ski race pace vs threshold (inverse of SKI_ADJ). */
function swimRaceFactor(km: number): number {
  if (km <= 1) return 0.99;
  if (km <= 3) return 1.03;
  return 1.07;
}
function skiRaceFactor(km: number): number {
  if (km <= 15) return 1 / 0.97;
  if (km <= 35) return 1 / 0.92;
  if (km <= 60) return 1 / 0.9;
  return 1 / 0.87;
}

/** Predicted race-day effort. Cycling gets no finish-time promise (watts
 *  don't translate to speed without terrain/equipment assumptions). */
export function predictSportGoal(sport: Sport, threshold: SportThreshold, raceKm: number): SportGoal | null {
  switch (sport) {
    case "swimming": {
      const pace100 = threshold.value * swimRaceFactor(raceKm);
      return { value: pace100, finishSeconds: pace100 * raceKm * 10 };
    }
    case "xc_skiing": {
      const pace = threshold.value * skiRaceFactor(raceKm);
      return { value: pace, finishSeconds: pace * 60 * raceKm };
    }
    default:
      return null;
  }
}

/* ------------------------------------------------- distance conversions -- */

/** Engine (run-equivalent) km → sport km for a single session. */
export function sessionKmFactor(sport: Sport): number {
  if (sport === "cycling") return 3;
  if (sport === "swimming") return 0.25;
  if (sport === "xc_skiing") return 1.5;
  return 1;
}

/** "2.5" swim-km → "2 500 m" · bike 47 → "45 km" (nearest 5) · ski 1 dp. */
export function formatSportDistance(sport: Sport, km: number, lang: Language): string {
  if (sport === "swimming") {
    const m = Math.round((km * 1000) / 100) * 100;
    return `${m.toLocaleString(lang === "sv" ? "sv-SE" : "en-GB")} m`;
  }
  if (sport === "cycling") {
    const v = km >= 20 ? Math.round(km / 5) * 5 : Math.round(km);
    return `${v} km`;
  }
  const v = km >= 10 ? Math.round(km) : Math.round(km * 10) / 10;
  return `${lang === "sv" ? String(v).replace(".", ",") : v} km`;
}
