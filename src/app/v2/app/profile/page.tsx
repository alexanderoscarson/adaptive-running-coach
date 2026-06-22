"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Target, CalendarClock, Ruler, Languages, Palette, LogOut, ArrowUpRight } from "lucide-react";
import { SPORT_EMOJI } from "@/lib/races";
import { useV2I18n } from "../../_lib/i18n";
import { useAppPlan } from "../../_lib/app-data";
import { PageHeader, MockNote, MockTag } from "../../_components/app-ui";

const DAYS = [3, 4, 5, 6];
const LONG_DAYS = [1, 2, 3, 4, 5, 6, 0];

export default function ProfilePage() {
  const { lang, setLang, t } = useV2I18n();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const race = useAppPlan().race;
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [longRunDay, setLongRunDay] = useState(0);
  const [weeklyKm, setWeeklyKm] = useState(42);
  const [units, setUnits] = useState<"km" | "mi">("km");
  const [targetTime, setTargetTime] = useState("");

  const isDark = resolvedTheme !== "light";

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <PageHeader eyebrow={t("prof.eyebrow")} title={t("prof.title")} />

      <div className="mt-8 space-y-4">
        {/* ===== GOAL ===== */}
        <Section icon={Target} title={t("prof.goal")} mock>
          <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={{ border: "1px solid var(--v2-hairline)", background: "var(--card)" }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>{SPORT_EMOJI[race.sport]}</span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("prof.goal.race")}</div>
                <div className="text-base font-bold text-foreground">{race.name}</div>
              </div>
            </div>
            <Link
              href="/v2/app/races"
              className="v2-ring-focus v2-transition inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-bold text-accent hover:text-foreground"
              style={{ border: "1px solid var(--v2-hairline)" }}
            >
              {t("prof.goal.change")}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <Field label={t("prof.goal.targetTime")}>
            <input
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              placeholder={t("prof.goal.targetTime.ph")}
              className="v2-ring-focus tabular w-36 rounded-xl bg-[var(--card)] px-3 py-2 text-right text-base font-bold text-foreground placeholder:font-medium placeholder:text-muted-foreground"
              style={{ border: "1px solid var(--v2-hairline)" }}
            />
          </Field>
        </Section>

        {/* ===== AVAILABILITY ===== */}
        <Section icon={CalendarClock} title={t("prof.avail")} mock>
          <Field label={t("ob.s2.days")}>
            <div className="flex gap-1.5">
              {DAYS.map((d) => (
                <Toggle key={d} active={daysPerWeek === d} onClick={() => setDaysPerWeek(d)}>
                  {d}
                </Toggle>
              ))}
            </div>
          </Field>
          <Field label={t("ob.s2.longday")}>
            <div className="flex gap-1">
              {LONG_DAYS.map((d) => (
                <Toggle key={d} active={longRunDay === d} onClick={() => setLongRunDay(d)} small>
                  {t(`day.${d}`)}
                </Toggle>
              ))}
            </div>
          </Field>
          <Field label={t("ob.s2.volume")}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={120}
                value={weeklyKm}
                onChange={(e) => setWeeklyKm(Number(e.target.value))}
                className="w-40 accent-[var(--primary)]"
                aria-label={t("ob.s2.volume")}
              />
              <span className="tabular w-14 text-right text-base font-bold text-foreground">{weeklyKm} km</span>
            </div>
          </Field>
        </Section>

        {/* ===== UNITS ===== */}
        <Section icon={Ruler} title={t("prof.units")} mock>
          <Field label={t("prof.units.distance")}>
            <div className="flex gap-1.5">
              <Toggle active={units === "km"} onClick={() => setUnits("km")}>{t("prof.units.km")}</Toggle>
              <Toggle active={units === "mi"} onClick={() => setUnits("mi")}>{t("prof.units.mi")}</Toggle>
            </div>
          </Field>
        </Section>

        {/* ===== LANGUAGE (real) ===== */}
        <Section icon={Languages} title={t("prof.lang")}>
          <Field label={t("prof.lang")}>
            <div className="flex gap-1.5">
              <Toggle active={lang === "sv"} onClick={() => setLang("sv")}>Svenska</Toggle>
              <Toggle active={lang === "en"} onClick={() => setLang("en")}>English</Toggle>
            </div>
          </Field>
        </Section>

        {/* ===== THEME (real) ===== */}
        <Section icon={Palette} title={t("prof.theme")}>
          {mounted && (
            <Field label={t("prof.theme")}>
              <div className="flex gap-1.5">
                <Toggle active={isDark} onClick={() => setTheme("dark")}>{t("prof.theme.dark")}</Toggle>
                <Toggle active={!isDark} onClick={() => setTheme("light")}>{t("prof.theme.light")}</Toggle>
              </div>
            </Field>
          )}
        </Section>
      </div>

      {/* ===== SAVE + ACCOUNT ===== */}
      <button
        type="button"
        className="v2-ring-focus v2-transition mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-primary-foreground sm:w-auto sm:px-10"
        style={{ background: "var(--primary)", boxShadow: "0 14px 40px -14px var(--glow)" }}
      >
        {t("prof.save")}
        <MockTag className="!text-primary-foreground" />
      </button>

      <div className="mt-6 flex items-center justify-between border-t pt-6" style={{ borderColor: "var(--v2-hairline)" }}>
        <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("prof.account")}</span>
        <Link
          href="/v2"
          className="v2-ring-focus v2-transition inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
          style={{ border: "1px solid var(--v2-hairline)", color: "var(--destructive)" }}
        >
          <LogOut className="h-4 w-4" />
          {t("prof.signout")}
        </Link>
      </div>

      <div className="mt-6">
        <MockNote>{t("mock.app.persist")}</MockNote>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  mock,
  children,
}: {
  icon: typeof Target;
  title: string;
  mock?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="v2-card p-6">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {mock && <MockTag />}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`v2-ring-focus v2-transition tabular rounded-xl font-bold ${small ? "px-2.5 py-2 text-xs" : "px-4 py-2 text-sm"}`}
      style={
        active
          ? { background: "var(--primary)", color: "var(--primary-foreground)" }
          : { border: "1px solid var(--v2-hairline)", color: "var(--muted-foreground)" }
      }
    >
      {children}
    </button>
  );
}
