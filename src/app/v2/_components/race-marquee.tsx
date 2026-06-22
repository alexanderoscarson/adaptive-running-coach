"use client";

import { RACES, SPORT_EMOJI } from "@/lib/races";

const PICKS = [
  "vasaloppet", "vatternrundan", "vansbrosimningen", "lidingoloppet",
  "goteborgsvarvet", "stockholm-marathon", "berlin-marathon", "midnattsloppet-sthlm",
  "cykelvasan", "otillo", "kalmar-ironman", "tjejmilen", "birkebeinerrennet", "la-marmotte",
];

export function RaceMarquee() {
  const items = PICKS.map((id) => RACES.find((r) => r.id === id)).filter(Boolean) as typeof RACES;
  const loop = [...items, ...items];

  return (
    <div
      className="v2-marquee relative flex overflow-hidden py-5"
      style={{
        maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
      }}
    >
      <div className="v2-marquee-track gap-3">
        {loop.map((r, i) => (
          <span
            key={`${r.id}-${i}`}
            className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-muted-foreground"
            style={{ border: "1px solid var(--v2-hairline)", background: "var(--card)" }}
          >
            <span aria-hidden>{SPORT_EMOJI[r.sport]}</span>
            {r.name}
          </span>
        ))}
      </div>
    </div>
  );
}
