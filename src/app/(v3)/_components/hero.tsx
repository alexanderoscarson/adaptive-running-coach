"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { getKlassikerRaces, RACES } from "@/lib/races";
import { useV3I18n } from "../_lib/i18n";
import {
  SPORT_LABEL,
  daysUntil,
  formatRaceDate,
  nextRaceDate,
  raceTexture,
} from "../_lib/race-meta";
import { CountUp, EASE, Reveal, SplitWords } from "./motion";
import { CourseProfile } from "./course-profile";

const ROTATE_MS = 6500;

/** The "race stage" — a live card where the Klassiker races take turns
 *  as the hero: course silhouette draws in, countdown ticks, auto-rotates. */
function RaceStage() {
  const { t, lang } = useV3I18n();
  const reduced = useReducedMotion();
  const races = useMemo(() => getKlassikerRaces(), []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const interacted = useRef(false);

  useEffect(() => {
    if (paused || reduced || interacted.current) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % races.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, reduced, races.length]);

  const race = races[index];
  const raceDate = useMemo(() => nextRaceDate(race.month), [race]);
  const days = daysUntil(raceDate);

  return (
    <div
      className="v3-card v3-glow relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* race switcher */}
      <div role="tablist" aria-label="Svensk Klassiker" className="flex gap-1 border-b border-[var(--v3-hairline)] p-2">
        {races.map((r, i) => (
          <button
            key={r.id}
            role="tab"
            aria-selected={i === index}
            onClick={() => {
              interacted.current = true;
              setIndex(i);
            }}
            className={`relative flex-1 overflow-hidden rounded-lg px-2 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors sm:text-xs ${
              i === index ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            <span className="relative z-10 truncate">{r.name}</span>
            {i === index && (
              <motion.span
                layoutId="stage-tab"
                className="absolute inset-0 rounded-lg bg-[color-mix(in_oklab,var(--primary)_16%,transparent)] ring-1 ring-[var(--primary)]"
                transition={{ duration: 0.45, ease: EASE }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="relative px-4 pt-4 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={race.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="v3-eyebrow">{SPORT_LABEL[race.sport][lang]}</div>
                <h3 className="mt-1 text-3xl sm:text-4xl">{race.name}</h3>
                <p className="v3-mono mt-1.5 text-xs text-[var(--muted-foreground)]">{raceTexture(race, lang)}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="v3-mono text-4xl font-bold leading-none text-[var(--v3-electric-bright)] sm:text-5xl">
                  {days}
                </div>
                <div className="v3-mono mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {t("hero.stage.days")}
                </div>
              </div>
            </div>

            <CourseProfile race={race} className="mt-2 h-44 w-full sm:h-52" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="v3-mono flex items-center justify-between border-t border-[var(--v3-hairline)] px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)] sm:px-6">
        <span>
          {t("hero.stage.next")} · {formatRaceDate(raceDate, lang)}
        </span>
        <span className="hidden sm:inline">{t("hero.stage.profile")}</span>
        <span>
          {race.distanceKm >= 10 ? Math.round(race.distanceKm) : race.distanceKm} km
        </span>
      </div>
    </div>
  );
}

export function Hero() {
  const { t } = useV3I18n();
  const stats = [
    { value: RACES.length, label: t("hero.stat.races") },
    { value: 24, label: t("hero.stat.weeks") },
    { value: 100, suffix: "%", label: t("hero.stat.pace") },
  ];

  return (
    <section className="v3-aurora v3-grain relative overflow-hidden">
      <div className="v3-grid-bg absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-32 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:pb-28 lg:pt-40">
        <div>
          <motion.p
            className="v3-eyebrow flex items-center gap-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="v3-blink inline-block size-1.5 rounded-full bg-[var(--v3-cyan)]" aria-hidden />
            {t("hero.eyebrow")}
          </motion.p>

          <h1 className="v3-display mt-5">
            <SplitWords text={t("hero.title.a")} delay={0.08} />
            <br />
            <SplitWords text={t("hero.title.b")} delay={0.26} wordClassName="v3-gradient-text" />
          </h1>

          <motion.p
            className="mt-6 max-w-xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
          >
            {t("hero.sub")}
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.62 }}
          >
            <Link href="/v3/onboarding" className="v3-btn v3-btn-primary">
              {t("hero.cta.primary")}
              <ArrowRight className="size-4" />
            </Link>
            <a href="#how" className="v3-btn v3-btn-ghost">
              {t("hero.cta.secondary")}
            </a>
          </motion.div>

          <motion.dl
            className="mt-12 grid max-w-md grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.85 }}
          >
            {stats.map((s) => (
              <div key={s.label} className="border-l border-[var(--v3-hairline-strong)] pl-4">
                <dd className="v3-mono text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                  <CountUp to={s.value} suffix={s.suffix ?? ""} />
                </dd>
                <dt className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {s.label}
                </dt>
              </div>
            ))}
          </motion.dl>
        </div>

        <Reveal delay={0.35} y={34}>
          <RaceStage />
        </Reveal>
      </div>

      <div className="pointer-events-none relative mx-auto flex max-w-6xl justify-center pb-8 lg:justify-start lg:px-5">
        <div className="flex flex-col items-center gap-1 text-[var(--muted-foreground)]" aria-hidden>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em]">{t("hero.scroll")}</span>
          <ChevronDown className="v3-scroll-hint size-4" />
        </div>
      </div>
    </section>
  );
}
