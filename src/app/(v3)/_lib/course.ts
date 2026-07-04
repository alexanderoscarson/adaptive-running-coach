import type { Race, Sport } from "@/lib/races";

/* ============================================================================
   Stylized course profiles — the visual heart of "the race is the hero".

   MOCK / illustrative: these are hand-tuned silhouettes for the Klassiker
   races and character-matched generated silhouettes for everything else —
   NOT real elevation data. Real course GPX/elevation is a later step.
   ============================================================================ */

export interface Checkpoint {
  /** 0..1 along the course */
  at: number;
  label: string;
}

export interface CourseProfile {
  /** Normalized elevations, 0 (low) .. 1 (high). Fixed length so profiles interpolate cleanly. */
  points: number[];
  /** Water races render as a swim line, not a mountain silhouette. */
  water: boolean;
  checkpoints: Checkpoint[];
  startLabel: string;
  finishLabel: string;
}

export const PROFILE_RESOLUTION = 56;

/* ---- Seeded value noise so every race gets a stable, unique silhouette ---- */

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth value noise: random control points, cosine-interpolated. */
function smoothNoise(seed: number, octaveCount: number, n: number): number[] {
  const rng = mulberry32(seed);
  const controls = Array.from({ length: octaveCount + 1 }, () => rng());
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * octaveCount;
    const i0 = Math.min(Math.floor(x), octaveCount - 1);
    const f = x - i0;
    const t = (1 - Math.cos(f * Math.PI)) / 2;
    out.push(controls[i0] * (1 - t) + controls[i0 + 1] * t);
  }
  return out;
}

interface SportCharacter {
  amplitude: number; // hilliness
  detail: number;    // high-frequency texture
  trend: number;     // net elevation drift start→finish (-1 falls, +1 climbs)
  octaves: number;
}

const SPORT_CHARACTER: Record<Sport, SportCharacter> = {
  running: { amplitude: 0.55, detail: 0.18, trend: 0, octaves: 7 },
  cycling: { amplitude: 0.7, detail: 0.1, trend: 0, octaves: 5 },
  xc_skiing: { amplitude: 0.6, detail: 0.14, trend: -0.35, octaves: 6 },
  swimming: { amplitude: 0.0, detail: 0.0, trend: 0, octaves: 2 },
  triathlon: { amplitude: 0.5, detail: 0.12, trend: 0, octaves: 6 },
  swimrun: { amplitude: 0.45, detail: 0.22, trend: 0, octaves: 8 },
  other: { amplitude: 0.5, detail: 0.14, trend: 0, octaves: 6 },
};

/* ---- Hand-tuned Klassiker silhouettes (control points, 0..1) ---- */

const HAND_TUNED: Record<string, { controls: number[]; checkpoints: Checkpoint[]; start: string; finish: string }> = {
  vasaloppet: {
    // Hard climb out of Sälen, then the long ragged descent to Mora.
    controls: [0.18, 0.62, 0.95, 0.88, 0.72, 0.66, 0.52, 0.56, 0.4, 0.34, 0.24, 0.18, 0.1],
    checkpoints: [
      { at: 0.12, label: "Smågan" },
      { at: 0.52, label: "Evertsberg" },
      { at: 0.69, label: "Oxberg" },
      { at: 0.9, label: "Eldris" },
    ],
    start: "Sälen",
    finish: "Mora",
  },
  lidingoloppet: {
    // Relentless rollers — roots, hills, forest. Abborrbacken near the end.
    controls: [0.25, 0.55, 0.35, 0.7, 0.42, 0.65, 0.3, 0.6, 0.38, 0.78, 0.5, 0.85, 0.3],
    checkpoints: [
      { at: 0.35, label: "Grönsta" },
      { at: 0.82, label: "Abborrbacken" },
    ],
    start: "Koltorp",
    finish: "Grönsta ängar",
  },
  vatternrundan: {
    // 300 km of mostly rolling flat around the lake; the ridge past Omberg.
    controls: [0.3, 0.34, 0.28, 0.38, 0.32, 0.62, 0.5, 0.34, 0.3, 0.36, 0.3, 0.26, 0.3],
    checkpoints: [
      { at: 0.28, label: "Jönköping" },
      { at: 0.46, label: "Omberg" },
      { at: 0.78, label: "Askersund" },
    ],
    start: "Motala",
    finish: "Motala",
  },
  vansbrosimningen: {
    controls: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    checkpoints: [{ at: 0.62, label: "Vanån möter Västerdalälven" }],
    start: "Vanån",
    finish: "Vansbro",
  },
};

function fromControls(controls: number[], n: number): number[] {
  const out: number[] = [];
  const segs = controls.length - 1;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * segs;
    const i0 = Math.min(Math.floor(x), segs - 1);
    const f = x - i0;
    const t = (1 - Math.cos(f * Math.PI)) / 2;
    out.push(controls[i0] * (1 - t) + controls[i0 + 1] * t);
  }
  return out;
}

export function courseProfile(race: Race): CourseProfile {
  const water = race.sport === "swimming";
  const hand = HAND_TUNED[race.id];
  if (hand) {
    return {
      points: fromControls(hand.controls, PROFILE_RESOLUTION),
      water,
      checkpoints: hand.checkpoints,
      startLabel: hand.start,
      finishLabel: hand.finish,
    };
  }

  const ch = SPORT_CHARACTER[race.sport];
  const seed = hashString(race.id);
  const base = smoothNoise(seed, ch.octaves, PROFILE_RESOLUTION);
  const texture = smoothNoise(seed ^ 0x9e3779b9, ch.octaves * 3, PROFILE_RESOLUTION);
  const points = base.map((v, i) => {
    const x = i / (PROFILE_RESOLUTION - 1);
    let y = 0.28 + (v - 0.5) * ch.amplitude + (texture[i] - 0.5) * ch.detail + ch.trend * (0.5 - x) * 0.5 + 0.22;
    y = Math.min(1, Math.max(0.06, y));
    return y;
  });

  return {
    points,
    water,
    checkpoints: [],
    startLabel: "Start",
    finishLabel: race.name.split(" ")[0],
  };
}

/* ---- SVG path builders (pure geometry, shared by all profile renders) ---- */

export interface ProfileGeometry {
  /** Stroke path for the course line. */
  line: string;
  /** Closed path for the area fill under the line. */
  area: string;
  /** Pixel coordinates for each sample, for checkpoints/dot placement. */
  coords: { x: number; y: number }[];
}

/** Catmull-Rom → cubic bezier for a silky line through the sample points. */
export function buildProfileGeometry(
  profile: CourseProfile,
  width: number,
  height: number,
  padY = 10
): ProfileGeometry {
  const n = profile.points.length;
  const usable = height - padY * 2;
  const coords = profile.points.map((p, i) => ({
    x: (i / (n - 1)) * width,
    y: profile.water
      ? height / 2 + Math.sin((i / (n - 1)) * Math.PI * 6) * height * 0.06
      : padY + (1 - p) * usable,
  }));

  let d = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(n - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  const area = `${d} L ${width} ${height} L 0 ${height} Z`;
  return { line: d, area, coords };
}
