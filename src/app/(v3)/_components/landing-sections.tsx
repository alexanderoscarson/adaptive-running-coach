"use client";

import Link from "next/link";
import { ArrowRight, Mountain, Waves, CalendarHeart } from "lucide-react";
import { RACES, getKlassikerRaces } from "@/lib/races";
import { useV3I18n } from "../_lib/i18n";
import { Reveal, Stagger, StaggerItem } from "./motion";
import { RaceShowcaseCard } from "./race-card";
import { Wordmark } from "./topbar";

/* ---------------------------------------------------------------- marquee */

export function RaceMarquee() {
  const { t } = useV3I18n();
  const names = RACES.filter((r) => r.country === "Sweden")
    .slice(0, 18)
    .map((r) => r.name);
  const row = [...names, ...names];
  return (
    <section aria-label={t("marquee.label")} className="v3-hairline-t v3-hairline-b py-5">
      <p className="v3-eyebrow mb-4 text-center">{t("marquee.label")}</p>
      <div className="v3-marquee" aria-hidden>
        <div className="v3-marquee-track items-center gap-8 pr-8">
          {row.map((name, i) => (
            <span key={i} className="flex items-center gap-8 whitespace-nowrap">
              <span className="font-[family-name:var(--font-display-v3)] text-2xl uppercase text-[var(--muted-foreground)] sm:text-3xl">
                {name}
              </span>
              <span className="text-[var(--v3-electric)]">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- klassiker */

export function KlassikerShowcase() {
  const { t } = useV3I18n();
  const klassiker = getKlassikerRaces();
  return (
    <section id="races" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:py-32">
      <Reveal>
        <p className="v3-eyebrow">{t("races.eyebrow")}</p>
        <h2 className="v3-h2 mt-3 max-w-3xl">{t("races.title")}</h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
          {t("races.sub")}
        </p>
      </Reveal>

      <Stagger className="mt-12 grid gap-5 sm:grid-cols-2" stagger={0.1}>
        {klassiker.map((race) => (
          <StaggerItem key={race.id}>
            <RaceShowcaseCard race={race} />
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal delay={0.1}>
        <div className="v3-card mt-5 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-7">
          <div>
            <h3 className="text-2xl">{t("races.more.title")}</h3>
            <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">{t("races.more.sub")}</p>
          </div>
          <Link href="/v3/onboarding" className="v3-btn v3-btn-ghost shrink-0">
            {t("races.more.cta")}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------ philosophy */

export function Philosophy() {
  const { t } = useV3I18n();
  const pillars = [
    { icon: Mountain, title: t("philosophy.1.title"), body: t("philosophy.1.body") },
    { icon: Waves, title: t("philosophy.2.title"), body: t("philosophy.2.body") },
    { icon: CalendarHeart, title: t("philosophy.3.title"), body: t("philosophy.3.body") },
  ];
  return (
    <section className="v3-hairline-t relative overflow-hidden">
      <div className="v3-aurora absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
        <Reveal>
          <p className="v3-eyebrow">{t("philosophy.eyebrow")}</p>
          <h2 className="v3-h2 mt-3 max-w-3xl">{t("philosophy.title")}</h2>
        </Reveal>
        <Stagger className="mt-14 grid gap-10 md:grid-cols-3" stagger={0.12}>
          {pillars.map((p, i) => (
            <StaggerItem key={p.title}>
              <div className="group">
                <div className="flex items-center gap-4">
                  <span className="v3-mono text-sm font-bold text-[var(--v3-electric-bright)]">
                    0{i + 1}
                  </span>
                  <span className="h-px flex-1 bg-[var(--v3-hairline-strong)] transition-colors group-hover:bg-[var(--primary)]" />
                  <p.icon className="size-5 text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--v3-cyan)]" aria-hidden />
                </div>
                <h3 className="v3-h3 mt-5">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">{p.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- how */

export function HowItWorks() {
  const { t } = useV3I18n();
  const steps = [
    { title: t("how.1.title"), body: t("how.1.body") },
    { title: t("how.2.title"), body: t("how.2.body") },
    { title: t("how.3.title"), body: t("how.3.body") },
  ];
  return (
    <section id="how" className="v3-hairline-t mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:py-32">
      <Reveal>
        <p className="v3-eyebrow">{t("how.eyebrow")}</p>
        <h2 className="v3-h2 mt-3 max-w-3xl">{t("how.title")}</h2>
      </Reveal>

      <Stagger className="relative mt-14 grid gap-8 md:grid-cols-3" stagger={0.14}>
        <div
          aria-hidden
          className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-[var(--v3-electric)] via-[var(--v3-cyan)] to-[var(--v3-ember)] opacity-35 md:block"
        />
        {steps.map((s, i) => (
          <StaggerItem key={s.title}>
            <div className="relative">
              <span className="relative z-10 grid size-14 place-items-center rounded-full border border-[var(--v3-hairline-strong)] bg-[var(--card)] font-[family-name:var(--font-display-v3)] text-xl text-[var(--v3-electric-bright)]">
                {i + 1}
              </span>
              <h3 className="v3-h3 mt-6">{s.title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--muted-foreground)]">{s.body}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal delay={0.15}>
        <Link href="/v3/onboarding" className="v3-btn v3-btn-primary mt-14">
          {t("how.cta")}
          <ArrowRight className="size-4" />
        </Link>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------- final CTA */

export function FinalCta() {
  const { t } = useV3I18n();
  return (
    <section className="v3-hairline-t v3-grain relative overflow-hidden">
      <div className="v3-aurora absolute inset-0" aria-hidden />
      <div className="v3-grid-bg absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 py-28 text-center sm:py-40">
        <Reveal>
          <p className="v3-eyebrow">{t("finalcta.eyebrow")}</p>
          <h2 className="v3-display mx-auto mt-4 max-w-4xl">
            <span className="v3-gradient-text">{t("finalcta.title")}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-base text-[var(--muted-foreground)] sm:text-lg">
            {t("finalcta.sub")}
          </p>
          <Link href="/v3/onboarding" className="v3-btn v3-btn-primary mt-10 !px-9 !py-4 !text-base">
            {t("finalcta.button")}
            <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- footer */

export function Footer() {
  const { t } = useV3I18n();
  return (
    <footer className="v3-hairline-t">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Wordmark />
          <span className="text-sm text-[var(--muted-foreground)]">{t("footer.tagline")}</span>
        </div>
        <p className="v3-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          {t("footer.note")}
        </p>
      </div>
    </footer>
  );
}
