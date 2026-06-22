"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useV2I18n } from "../_lib/i18n";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display-v2 text-2xl tracking-tight ${className}`}>
      P<span className="v2-gradient-text">arro</span>t
    </span>
  );
}

export function Topbar() {
  const { lang, setLang, t } = useV2I18n();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme !== "light";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl">
      <div
        className="absolute inset-0 -z-10 border-b"
        style={{
          background: "color-mix(in oklab, var(--background) 72%, transparent)",
          borderColor: "var(--v2-hairline)",
        }}
      />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/v2" className="flex items-center gap-2.5">
          <Wordmark />
          <span
            className="hidden rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] sm:inline-block"
            style={{
              color: "var(--accent)",
              background: "color-mix(in oklab, var(--accent) 12%, transparent)",
              border: "1px solid color-mix(in oklab, var(--accent) 24%, transparent)",
            }}
          >
            {t("nav.badge")}
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLang(lang === "sv" ? "en" : "sv")}
            className="v2-ring-focus v2-transition rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            aria-label="Toggle language"
          >
            {lang === "sv" ? "SV" : "EN"}
          </button>
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="v2-ring-focus v2-transition flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
              style={{ border: "1px solid var(--v2-hairline)" }}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
          <Link
            href="/v2/app"
            className="v2-ring-focus v2-transition ml-1 hidden rounded-full px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground sm:block"
          >
            {t("nav.signin")}
          </Link>
          <Link
            href="/v2/app"
            className="v2-ring-focus v2-transition hidden rounded-full px-4 py-2 text-sm font-bold text-primary-foreground sm:block"
            style={{ background: "var(--primary)" }}
          >
            {t("app.open")}
          </Link>
        </div>
      </div>
    </header>
  );
}
