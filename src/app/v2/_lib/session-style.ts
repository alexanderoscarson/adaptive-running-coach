import {
  Wind,
  Route,
  Gauge,
  Zap,
  Mountain,
  Dumbbell,
  Flag,
  Bike,
  Moon,
  Leaf,
  type LucideIcon,
} from "lucide-react";
import type { PlannedSession, WeekPlan } from "@/lib/plan-generator";
import type { SessionType } from "@/types/database";
import type { Language } from "./i18n";

/* Single source of truth for how a plan reads visually across all v2 surfaces
   (landing preview, home, plan calendar, session detail, progress). Pure data
   — no "use client" — so any component may import it. */

export const PHASE_COLOR: Record<WeekPlan["phase"], string> = {
  base: "#2f6bff",
  build: "#38e0ff",
  peak: "#7c5cff",
  taper: "#8a9bc4",
  race: "#ffce4f",
};

/* Accent color for a session by training intensity. */
export const SESSION_TONE: Record<SessionType, string> = {
  easy: "var(--muted-foreground)",
  recovery: "var(--muted-foreground)",
  long: "var(--v2-electric-bright)",
  tempo: "var(--accent)",
  intervals: "var(--accent)",
  hills: "var(--accent)",
  strength: "var(--v2-violet)",
  race: "#ffce4f",
  cross_training: "var(--muted-foreground)",
  rest: "var(--muted-foreground)",
};

export const SESSION_ICON: Record<SessionType, LucideIcon> = {
  easy: Wind,
  recovery: Leaf,
  long: Route,
  tempo: Gauge,
  intervals: Zap,
  hills: Mountain,
  strength: Dumbbell,
  race: Flag,
  cross_training: Bike,
  rest: Moon,
};

/* Sessions that drive adaptation — used to flag "quality" days. */
export const QUALITY_TYPES: SessionType[] = ["tempo", "intervals", "hills"];

export const BLOCK_LABEL: Record<string, { sv: string; en: string }> = {
  warmup: { sv: "Uppvärmning", en: "Warm-up" },
  main: { sv: "Huvuddel", en: "Main set" },
  interval: { sv: "Intervall", en: "Interval" },
  recovery: { sv: "Vila", en: "Recovery" },
  cooldown: { sv: "Nedvarvning", en: "Cool-down" },
};

export function fmtDuration(min: number | null | undefined, _lang: Language): string {
  if (!min) return "";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function sessionDetail(s: PlannedSession, lang: Language): string {
  if (s.durationMinutes) return fmtDuration(s.durationMinutes, lang);
  if (s.distanceKm) return `${s.distanceKm} km`;
  return "";
}
