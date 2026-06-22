"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import {
  Home,
  CalendarDays,
  Trophy,
  TrendingUp,
  MessageCircle,
  Settings,
  Moon,
  Sun,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { useV2I18n } from "../_lib/i18n";
import { Wordmark } from "./topbar";

interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
  bottom?: boolean; // shown in the mobile bottom bar
}

const NAV: NavItem[] = [
  { key: "home", href: "/v2/app", icon: Home, labelKey: "app.nav.home", bottom: true },
  { key: "plan", href: "/v2/app/plan", icon: CalendarDays, labelKey: "app.nav.plan", bottom: true },
  { key: "races", href: "/v2/app/races", icon: Trophy, labelKey: "app.nav.races", bottom: true },
  { key: "progress", href: "/v2/app/progress", icon: TrendingUp, labelKey: "app.nav.progress", bottom: true },
  { key: "coach", href: "/v2/app/coach", icon: MessageCircle, labelKey: "app.nav.coach", bottom: true },
  { key: "profile", href: "/v2/app/profile", icon: Settings, labelKey: "app.nav.profile" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/v2/app") return pathname === "/v2/app";
  if (href === "/v2/app/plan") return pathname.startsWith("/v2/app/plan") || pathname.startsWith("/v2/app/session");
  return pathname.startsWith(href);
}

function ThemeLangControls({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useV2I18n();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = resolvedTheme !== "light";

  return (
    <div className={`flex items-center gap-1.5 ${compact ? "" : "w-full"}`}>
      <button
        type="button"
        onClick={() => setLang(lang === "sv" ? "en" : "sv")}
        className="v2-ring-focus v2-transition rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        style={{ border: "1px solid var(--v2-hairline)" }}
        aria-label="Toggle language"
      >
        {lang === "sv" ? "SV" : "EN"}
      </button>
      {mounted && (
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="v2-ring-focus v2-transition flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          style={{ border: "1px solid var(--v2-hairline)" }}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useV2I18n();
  const bottomItems = NAV.filter((n) => n.bottom);

  return (
    <div className="lg:grid lg:min-h-[100dvh] lg:grid-cols-[244px_1fr]">
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        className="sticky top-0 hidden h-[100dvh] flex-col border-r p-5 lg:flex"
        style={{ borderColor: "var(--v2-hairline)", background: "color-mix(in oklab, var(--card) 50%, var(--background))" }}
      >
        <Link href="/v2/app" className="flex items-center gap-2">
          <Wordmark className="text-xl" />
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{
              color: "var(--accent)",
              background: "color-mix(in oklab, var(--accent) 12%, transparent)",
              border: "1px solid color-mix(in oklab, var(--accent) 24%, transparent)",
            }}
          >
            {t("app.badge")}
          </span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className="v2-ring-focus v2-transition flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold"
                style={
                  active
                    ? { background: "color-mix(in oklab, var(--primary) 14%, transparent)", color: "var(--foreground)" }
                    : { color: "var(--muted-foreground)" }
                }
              >
                <item.icon className="h-[18px] w-[18px]" style={active ? { color: "var(--accent)" } : undefined} />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: "var(--v2-hairline)" }}>
          <ThemeLangControls />
          <Link
            href="/v2"
            className="v2-ring-focus v2-transition flex items-center gap-2 px-1 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("app.backToSite")}
          </Link>
        </div>
      </aside>

      {/* ===== CONTENT COLUMN ===== */}
      <div className="min-w-0">
        {/* mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b px-5 py-3 backdrop-blur-xl lg:hidden"
          style={{ borderColor: "var(--v2-hairline)", background: "color-mix(in oklab, var(--background) 78%, transparent)" }}
        >
          <Link href="/v2/app" className="flex items-center gap-2">
            <Wordmark className="text-lg" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeLangControls compact />
            <Link
              href="/v2/app/profile"
              className="v2-ring-focus v2-transition flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-primary-foreground"
              style={{ background: "var(--primary)" }}
              aria-label={t("app.nav.profile")}
            >
              A
            </Link>
          </div>
        </header>

        <main className="pb-28 lg:pb-12">{children}</main>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        style={{ borderColor: "var(--v2-hairline)", background: "color-mix(in oklab, var(--background) 90%, transparent)" }}
      >
        {bottomItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className="v2-ring-focus flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-bold"
              style={{ color: active ? "var(--accent)" : "var(--muted-foreground)" }}
            >
              <item.icon className="h-5 w-5" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
