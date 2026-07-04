"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import type { Race } from "@/lib/races";
import { useV3I18n } from "../_lib/i18n";
import { CourseProfile } from "./course-profile";
import { EASE } from "./motion";

const STAGE_MS = 750;

/** Cinematic build sequence. The plan itself is computed synchronously by the
 *  caller before this mounts — the stages are pure theatre, matched to what
 *  the engine actually did. */
export function Generating({
  race,
  planWeeks,
  onDone,
}: {
  race: Race;
  planWeeks: number;
  onDone: () => void;
}) {
  const { t } = useV3I18n();
  const stages = [
    t("ob.gen.anchor", { race: race.name }),
    t("ob.gen.periodize", { weeks: String(planWeeks) }),
    t("ob.gen.pace"),
    t("ob.gen.place"),
  ];
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done >= stages.length) {
      const id = setTimeout(onDone, 650);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setDone((d) => d + 1), STAGE_MS);
    return () => clearTimeout(id);
  }, [done, stages.length, onDone]);

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-2xl flex-col items-center justify-center px-5 text-center">
      <motion.p
        className="v3-eyebrow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {t("ob.gen.title")}
      </motion.p>
      <motion.h1
        className="v3-h2 mt-3"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {race.name}
      </motion.h1>

      <CourseProfile race={race} className="mt-6 h-40 w-full" loopSeconds={5} />

      <ul className="mt-8 grid w-full max-w-md gap-2.5 text-left" aria-live="polite">
        {stages.map((label, i) => {
          const state = i < done ? "done" : i === done ? "active" : "pending";
          return (
            <motion.li
              key={label}
              className="flex items-center gap-3 text-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: state === "pending" ? 0.35 : 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: i * 0.05 }}
            >
              <span className="grid size-6 shrink-0 place-items-center">
                <AnimatePresence mode="wait" initial={false}>
                  {state === "done" ? (
                    <motion.span
                      key="done"
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="grid size-6 place-items-center rounded-full bg-[color-mix(in_oklab,var(--v3-cyan)_20%,transparent)] text-[var(--v3-cyan)]"
                    >
                      <Check className="size-3.5" />
                    </motion.span>
                  ) : state === "active" ? (
                    <Loader2 key="active" className="size-4 animate-spin text-[var(--v3-electric-bright)]" />
                  ) : (
                    <span key="pending" className="size-1.5 rounded-full bg-[var(--v3-hairline-strong)]" />
                  )}
                </AnimatePresence>
              </span>
              <span className={state === "done" ? "text-[var(--muted-foreground)]" : ""}>{label}</span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
