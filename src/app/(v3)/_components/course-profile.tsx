"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useRef } from "react";
import type { Race } from "@/lib/races";
import { buildProfileGeometry, courseProfile } from "../_lib/course";

/* ============================================================================
   CourseProfile — the animated race silhouette. The line draws itself in,
   the area fades up, and a light ("you") runs the course on loop.
   MOCK: silhouettes are stylized, not real elevation data (see _lib/course.ts).
   ============================================================================ */

const VIEW_W = 800;
const VIEW_H = 220;

/** Runs a glowing dot along the drawn path via rAF (SVG path sampling). */
function useCourseRunner(
  pathRef: React.RefObject<SVGPathElement | null>,
  dotRef: React.RefObject<SVGGElement | null>,
  enabled: boolean,
  raceId: string,
  loopSeconds: number
) {
  useEffect(() => {
    if (!enabled) return;
    const path = pathRef.current;
    const dot = dotRef.current;
    if (!path || !dot) return;

    const total = path.getTotalLength();
    let raf = 0;
    let start: number | null = null;
    const delayMs = 1400; // let the line finish drawing first

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start - delayMs;
      if (elapsed < 0) {
        dot.style.opacity = "0";
      } else {
        const f = (elapsed / (loopSeconds * 1000)) % 1;
        const pt = path.getPointAtLength(f * total);
        dot.style.opacity = "1";
        dot.setAttribute("transform", `translate(${pt.x}, ${pt.y})`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pathRef, dotRef, enabled, raceId, loopSeconds]);
}

export function CourseProfile({
  race,
  className,
  showCheckpoints = true,
  showEndpoints = true,
  runner = true,
  loopSeconds = 9,
  strokeWidth = 2.5,
}: {
  race: Race;
  className?: string;
  showCheckpoints?: boolean;
  showEndpoints?: boolean;
  runner?: boolean;
  loopSeconds?: number;
  strokeWidth?: number;
}) {
  const uid = useId().replace(/[:]/g, "");
  const reduced = useReducedMotion();
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGGElement>(null);

  const { profile, geo } = useMemo(() => {
    const p = courseProfile(race);
    return { profile: p, geo: buildProfileGeometry(p, VIEW_W, VIEW_H, 24) };
  }, [race]);

  useCourseRunner(pathRef, dotRef, runner && !reduced, race.id, loopSeconds);

  const checkpointCoords = useMemo(
    () =>
      profile.checkpoints.map((cp) => {
        const idx = Math.round(cp.at * (geo.coords.length - 1));
        return { ...cp, ...geo.coords[idx] };
      }),
    [profile, geo]
  );

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H + 26}`}
      className={className}
      role="img"
      aria-label={`${race.name} — ${profile.water ? "open water" : "course profile"}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`line-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--v3-electric-bright)" />
          <stop offset="60%" stopColor="var(--v3-cyan)" />
          <stop offset="100%" stopColor="var(--v3-ember)" />
        </linearGradient>
        <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--electric)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--electric)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* faint km grid */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={f * VIEW_W}
          y1={12}
          x2={f * VIEW_W}
          y2={VIEW_H}
          stroke="var(--v3-hairline)"
          strokeDasharray="2 6"
        />
      ))}

      {/* area under the course */}
      <motion.path
        key={`a-${race.id}`}
        d={geo.area}
        fill={`url(#area-${uid})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, delay: 0.55 }}
      />

      {/* the course line, drawing itself */}
      <motion.path
        key={`l-${race.id}`}
        ref={pathRef}
        d={geo.line}
        fill="none"
        stroke={`url(#line-${uid})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduced ? 0 : 1.5, ease: [0.65, 0, 0.35, 1] }}
      />

      {/* checkpoints */}
      {showCheckpoints &&
        checkpointCoords.map((cp, i) => (
          <motion.g
            key={`${race.id}-${cp.label}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 1.2 + i * 0.15, duration: 0.5 }}
          >
            <circle cx={cp.x} cy={cp.y} r={3.2} fill="var(--background)" stroke="var(--v3-cyan)" strokeWidth={1.6} />
            <text
              x={cp.x}
              y={cp.y - 11}
              textAnchor="middle"
              fill="var(--muted-foreground)"
              fontSize="11"
              fontFamily="var(--font-geist-mono)"
              letterSpacing="0.06em"
            >
              {cp.label}
            </text>
          </motion.g>
        ))}

      {/* start / finish markers */}
      {showEndpoints && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0 : 1.5, duration: 0.6 }}
          fontFamily="var(--font-geist-mono)"
          fontSize="11.5"
        >
          <circle cx={geo.coords[0].x + 3} cy={geo.coords[0].y} r={3.4} fill="var(--v3-electric-bright)" />
          <text x={4} y={VIEW_H + 20} fill="var(--muted-foreground)" letterSpacing="0.08em">
            {profile.startLabel.toUpperCase()} · 0 KM
          </text>
          <circle
            cx={geo.coords[geo.coords.length - 1].x - 3}
            cy={geo.coords[geo.coords.length - 1].y}
            r={3.4}
            fill="var(--v3-ember)"
          />
          <text x={VIEW_W - 4} y={VIEW_H + 20} textAnchor="end" fill="var(--muted-foreground)" letterSpacing="0.08em">
            {profile.finishLabel.toUpperCase()} · {race.distanceKm >= 10 ? Math.round(race.distanceKm) : race.distanceKm} KM
          </text>
        </motion.g>
      )}

      {/* the runner — you, on the course */}
      {runner && !reduced && (
        <g ref={dotRef} style={{ opacity: 0 }} aria-hidden>
          <circle r={9} fill="var(--v3-cyan)" opacity={0.18} />
          <circle r={4.5} fill="var(--v3-cyan)" opacity={0.5} />
          <circle r={2.6} fill="#fff" />
        </g>
      )}
    </svg>
  );
}
