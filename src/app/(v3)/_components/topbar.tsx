"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { motion, useScroll, useSpring } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useV3I18n } from "../_lib/i18n";

const emptySubscribe = () => () => {};

function ThemeToggle({ label }: { label: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // Hydration-safe "mounted" flag: false on the server render, true on the client.
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="grid size-9 place-items-center rounded-full border border-[var(--v3-hairline-strong)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--foreground)]"
    >
      {mounted ? (dark ? <Sun className="size-4" /> : <Moon className="size-4" />) : <Sun className="size-4 opacity-0" />}
    </button>
  );
}

function LangToggle() {
  const { lang, setLang, t } = useV3I18n();
  return (
    <button
      type="button"
      aria-label={t("nav.lang")}
      onClick={() => setLang(lang === "sv" ? "en" : "sv")}
      className="v3-mono rounded-full border border-[var(--v3-hairline-strong)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--foreground)]"
    >
      {lang === "sv" ? "EN" : "SV"}
    </button>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/v3" className={`group inline-flex items-baseline gap-2 ${className}`}>
      <span className="font-[family-name:var(--font-display-v3)] text-2xl uppercase leading-none tracking-wide">
        Parrot
      </span>
      <span
        aria-hidden
        className="size-2 translate-y-[-1px] rounded-full bg-[var(--v3-electric)] transition-transform duration-300 group-hover:scale-150"
      />
    </Link>
  );
}

/** Landing topbar: wordmark, anchors, theme/lang toggles + scroll progress. */
export function Topbar({ showProgress = true }: { showProgress?: boolean }) {
  const { t } = useV3I18n();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-[var(--v3-hairline)] bg-[color-mix(in_oklab,var(--background)_82%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Wordmark />
            <span className="v3-mono hidden rounded-full border border-[var(--v3-hairline-strong)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)] sm:inline-block">
              {t("nav.badge")}
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--muted-foreground)] md:flex">
            <a href="#races" className="transition-colors hover:text-[var(--foreground)]">
              {t("nav.races")}
            </a>
            <a href="#how" className="transition-colors hover:text-[var(--foreground)]">
              {t("nav.how")}
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            <LangToggle />
            <ThemeToggle label={t("nav.theme")} />
            <Link href="/v3/onboarding" className="v3-btn v3-btn-primary hidden !px-5 !py-2.5 !text-sm sm:inline-flex">
              {t("nav.start")}
            </Link>
          </div>
        </div>
        {showProgress && (
          <motion.div
            aria-hidden
            className="h-px origin-left bg-gradient-to-r from-[var(--v3-electric)] via-[var(--v3-cyan)] to-[var(--v3-ember)]"
            style={{ scaleX: progress }}
          />
        )}
      </div>
    </header>
  );
}
