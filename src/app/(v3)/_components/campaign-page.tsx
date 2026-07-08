"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { getRaceById } from "@/lib/races";
import { useV3I18n } from "../_lib/i18n";
import { captureCampaign, track, type SmokeVariant } from "../_lib/smoke";
import { SPORT_LABEL, formatDistance, raceTexture } from "../_lib/race-meta";
import { EASE, SplitWords } from "./motion";
import { Wordmark } from "./topbar";
import { Footer } from "./landing-sections";

/* Shared shell for the smoke-test campaign entry pages: minimal topbar,
   hero with the exact ad copy, ONE supporting section, footer. Captures
   variant + UTM on mount and fires campaign_page_view. */

export function CampaignShell({
  variant,
  headline,
  sub,
  cta,
  ctaHref = "/v3/onboarding",
  children,
}: {
  variant: Exclude<SmokeVariant, "direct">;
  headline: string;
  sub: string;
  cta: string;
  ctaHref?: string;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    captureCampaign(variant);
    track("campaign_page_view");
  }, [variant]);

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="border-b border-[var(--v3-hairline)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5">
          <Wordmark />
        </div>
      </header>

      <section className="v3-aurora v3-grain relative overflow-hidden">
        <div className="v3-grid-bg absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-16 sm:pb-20 sm:pt-24">
          <h1 className="v3-h2 max-w-3xl !text-[clamp(2.4rem,7vw,4.8rem)]">
            <SplitWords text={headline} />
          </h1>
          <motion.p
            className="mt-5 max-w-xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.35 }}
          >
            {sub}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
          >
            <Link href={ctaHref} className="v3-btn v3-btn-primary mt-8 !px-8 !py-4 !text-base">
              {cta}
              <ArrowRight className="size-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {children}

      <div className="mt-auto">
        <Footer />
      </div>
    </main>
  );
}

/** Compact race-catalog teaser for /kampanj/lopp — small rows, no new styling. */
export function RaceTeaser({ raceIds }: { raceIds: string[] }) {
  const { t, lang } = useV3I18n();
  const races = raceIds.map(getRaceById).filter((r) => r !== undefined);
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
      <p className="v3-eyebrow">{t("kampanj.lopp.teaser")}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {races.map((race) => (
          <Link
            key={race.id}
            href={`/v3/onboarding?race=${race.id}`}
            className="v3-card v3-lift block p-4"
          >
            <div className="v3-eyebrow !text-[10px]">{SPORT_LABEL[race.sport][lang]}</div>
            <div className="mt-1 font-[family-name:var(--font-display-v3)] text-xl uppercase">{race.name}</div>
            <div className="v3-mono mt-1.5 flex justify-between text-[11px] text-[var(--muted-foreground)]">
              <span className="truncate pr-3">{raceTexture(race, lang)}</span>
              <span className="shrink-0">{formatDistance(race.distanceKm, lang)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
