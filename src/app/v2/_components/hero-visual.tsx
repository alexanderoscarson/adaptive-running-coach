"use client";

import { motion } from "framer-motion";
import { useV2I18n } from "../_lib/i18n";

/* Decorative hero artwork: a drawn elevation profile (the "terrain") with a
   pacer dot, plus a few session pills — a glimpse of the product. Purely
   illustrative. */
const PROFILE =
  "M0,150 L40,140 L80,150 L120,110 L170,120 L210,70 L260,95 L310,40 L360,70 L410,55 L460,120 L500,150";

export function HeroVisual() {
  const { t } = useV2I18n();

  const sessions = [
    { d: t("day.1"), label: t("sessiontype.easy"), tone: "easy" },
    { d: t("day.3"), label: t("sessiontype.tempo"), tone: "quality" },
    { d: t("day.6"), label: t("sessiontype.long"), tone: "long" },
  ];

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="v2-card relative overflow-hidden p-5 sm:p-6"
        style={{ boxShadow: "0 30px 80px -40px var(--glow), 0 0 0 1px var(--v2-hairline)" }}
      >
        <div className="absolute inset-0 v2-aurora opacity-60" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Vasaloppet · 90 km
            </span>
            <span className="v2-pulse h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent)" }} />
          </div>

          {/* elevation / terrain line */}
          <svg viewBox="0 0 500 170" className="mt-4 w-full" fill="none" aria-hidden>
            <defs>
              <linearGradient id="v2-route" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--v2-electric-bright)" />
                <stop offset="100%" stopColor="var(--v2-cyan)" />
              </linearGradient>
              <linearGradient id="v2-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d={`${PROFILE} L500,170 L0,170 Z`}
              fill="url(#v2-fill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.9 }}
            />
            <motion.path
              d={PROFILE}
              stroke="url(#v2-route)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, ease: "easeInOut", delay: 0.5 }}
            />
            <motion.circle
              r="5"
              fill="#fff"
              style={{ filter: "drop-shadow(0 0 6px var(--accent))" }}
              animate={{
                cx: [0, 120, 210, 310, 410, 500],
                cy: [150, 110, 70, 40, 55, 150],
              }}
              transition={{ duration: 3, ease: "easeInOut", delay: 1.6, repeat: Infinity, repeatDelay: 1.5 }}
            />
          </svg>

          {/* mini week */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {sessions.map((s, i) => (
              <motion.div
                key={s.d}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.12 }}
                className="rounded-xl px-3 py-2.5"
                style={{
                  background: "color-mix(in oklab, var(--card) 60%, var(--background))",
                  border: "1px solid var(--v2-hairline)",
                }}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.d}</div>
                <div
                  className="mt-1 text-sm font-bold"
                  style={{
                    color:
                      s.tone === "quality"
                        ? "var(--accent)"
                        : s.tone === "long"
                          ? "var(--v2-electric-bright)"
                          : "var(--foreground)",
                  }}
                >
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* floating glow accents */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl"
        style={{ background: "var(--glow-cyan)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full blur-3xl"
        style={{ background: "var(--glow)" }}
      />
    </div>
  );
}
