"use client";

import Link from "next/link";
import { ArrowRight, Mountain, Route, Flame } from "lucide-react";
import { getKlassikerRaces } from "@/lib/races";
import { useV2I18n } from "./_lib/i18n";
import { Topbar, Wordmark } from "./_components/topbar";
import { Reveal } from "./_components/reveal";
import { HeroVisual } from "./_components/hero-visual";
import { RaceMarquee } from "./_components/race-marquee";
import { RaceCard } from "./_components/race-card";

export default function V2Landing() {
  const { t } = useV2I18n();
  const klassiker = getKlassikerRaces();

  return (
    <main>
      <Topbar />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 v2-aurora" />
        <div className="absolute inset-0 -z-10 v2-grid opacity-40" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-24 lg:pt-20">
          <div>
            <span
              className="v2-animate-fade-up inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em]"
              style={{
                color: "var(--accent)",
                background: "color-mix(in oklab, var(--accent) 10%, transparent)",
                border: "1px solid color-mix(in oklab, var(--accent) 22%, transparent)",
              }}
            >
              {t("hero.eyebrow")}
            </span>

            <h1 className="v2-animate-rise mt-6 text-[clamp(3rem,9vw,6.5rem)] leading-[0.9]">
              {t("hero.title.a")}
              <br />
              <span className="v2-gradient-text">{t("hero.title.b")}</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg font-medium leading-relaxed text-muted-foreground sm:text-xl">
              {t("hero.sub")}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/v2/onboarding"
                className="v2-ring-focus v2-transition group inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-bold text-primary-foreground"
                style={{ background: "var(--primary)", boxShadow: "0 14px 40px -12px var(--glow)" }}
              >
                {t("hero.cta.primary")}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how"
                className="v2-ring-focus v2-transition inline-flex items-center justify-center rounded-full px-7 py-4 text-base font-bold text-foreground hover:bg-[var(--secondary)]"
                style={{ border: "1px solid var(--v2-hairline)" }}
              >
                {t("hero.cta.secondary")}
              </a>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6">
              {[
                { n: "60+", l: t("hero.stat.races") },
                { n: "100%", l: t("hero.stat.adaptive") },
                { n: "80/20", l: t("hero.stat.science") },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="tabular text-2xl font-bold text-foreground sm:text-3xl">{s.n}</dt>
                  <dd className="mt-1 text-xs font-semibold leading-snug text-muted-foreground">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:pl-6">
            <HeroVisual />
          </div>
        </div>

        {/* marquee */}
        <div className="border-y" style={{ borderColor: "var(--v2-hairline)" }}>
          <p className="mx-auto max-w-6xl px-5 pt-5 text-center text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground sm:px-8">
            {t("marquee.label")}
          </p>
          <RaceMarquee />
        </div>
      </section>

      {/* ===== CHOOSE YOUR HERO (KLASSIKER) ===== */}
      <section className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{t("races.eyebrow")}</p>
          <h2 className="mt-3 max-w-2xl text-4xl sm:text-5xl lg:text-6xl">{t("races.title")}</h2>
          <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
            {t("races.sub")}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-7 flex items-center gap-2 text-sm font-bold">
          <span
            className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em]"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {t("races.klassiker")}
          </span>
          <span className="text-muted-foreground">— {t("races.klassiker.sub")}</span>
        </Reveal>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {klassiker.map((race, i) => (
            <Reveal key={race.id} delay={0.05 * i}>
              <RaceCard race={race} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== PHILOSOPHY ===== */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 -z-10 v2-aurora opacity-50" />
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{t("philosophy.eyebrow")}</p>
            <h2 className="mt-3 max-w-2xl text-4xl sm:text-5xl">{t("philosophy.title")}</h2>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { icon: Mountain, t: "philosophy.terrain.title", b: "philosophy.terrain.body" },
              { icon: Route, t: "philosophy.format.title", b: "philosophy.format.body" },
              { icon: Flame, t: "philosophy.culture.title", b: "philosophy.culture.body" },
            ].map((c, i) => (
              <Reveal key={c.t} delay={0.08 * i}>
                <div className="v2-card v2-lift h-full p-7">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: "color-mix(in oklab, var(--primary) 14%, transparent)",
                      color: "var(--accent)",
                    }}
                  >
                    <c.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-2xl">{t(c.t)}</h3>
                  <p className="mt-3 text-base font-medium leading-relaxed text-muted-foreground">{t(c.b)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-accent">{t("how.eyebrow")}</p>
          <h2 className="mt-3 text-center text-4xl sm:text-5xl">{t("how.title")}</h2>
        </Reveal>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[1, 2, 3].map((n, i) => (
            <Reveal key={n} delay={0.1 * i}>
              <div className="relative">
                <span
                  className="font-display-v2 text-6xl"
                  style={{ color: "color-mix(in oklab, var(--primary) 38%, transparent)" }}
                >
                  0{n}
                </span>
                <h3 className="mt-2 text-2xl">{t(`how.${n}.title`)}</h3>
                <p className="mt-2 text-base font-medium leading-relaxed text-muted-foreground">
                  {t(`how.${n}.body`)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative overflow-hidden px-5 py-24 sm:px-8 lg:py-32">
        <div className="absolute inset-0 -z-10 v2-aurora" />
        <div className="absolute inset-0 -z-10 v2-grid opacity-30" />
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl">
            {t("finalcta.title")}
          </h2>
          <p className="mx-auto mt-6 max-w-md text-lg font-medium text-muted-foreground">{t("finalcta.sub")}</p>
          <Link
            href="/v2/onboarding"
            className="v2-ring-focus v2-transition group mt-9 inline-flex items-center justify-center gap-2 rounded-full px-9 py-4 text-lg font-bold text-primary-foreground"
            style={{ background: "var(--primary)", boxShadow: "0 18px 50px -14px var(--glow)" }}
          >
            {t("finalcta.button")}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t px-5 py-10 sm:px-8" style={{ borderColor: "var(--v2-hairline)" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <Wordmark className="text-xl" />
          <p className="text-sm font-semibold text-muted-foreground">Parrot — {t("footer.tagline")}</p>
        </div>
      </footer>
    </main>
  );
}
