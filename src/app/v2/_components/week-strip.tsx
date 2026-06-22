"use client";

import Link from "next/link";
import { useV2I18n } from "../_lib/i18n";
import { isSameDay } from "../_lib/race-meta";
import { SESSION_TONE, SESSION_ICON, sessionDetail } from "../_lib/session-style";
import type { AppWeek } from "../_lib/mock-app-data";

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun

export function WeekStrip({ week, compact = false }: { week: AppWeek; compact?: boolean }) {
  const { lang, t } = useV2I18n();
  const today = new Date();

  const byDay = new Map<number, typeof week.appSessions>();
  for (const s of week.appSessions) {
    if (!byDay.has(s.dayOfWeek)) byDay.set(s.dayOfWeek, []);
    byDay.get(s.dayOfWeek)!.push(s);
  }

  return (
    <div className={`grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 ${compact ? "" : ""}`}>
      {WEEK_ORDER.map((d) => {
        const sessions = byDay.get(d) ?? [];
        const offset = d === 0 ? 6 : d - 1;
        const cellDate = new Date(week.weekStart);
        cellDate.setDate(cellDate.getDate() + offset);
        const isToday = isSameDay(cellDate, today);

        return (
          <div
            key={d}
            className={`rounded-2xl ${compact ? "p-2.5" : "p-3"}`}
            style={{
              minHeight: compact ? 78 : 96,
              background: sessions.length ? "var(--card)" : "transparent",
              border: isToday
                ? "1.5px solid color-mix(in oklab, var(--primary) 60%, transparent)"
                : "1px solid var(--v2-hairline)",
              opacity: sessions.length ? 1 : 0.55,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                {t(`day.${d}`)}
              </span>
              <span
                className="tabular text-[10px] font-bold"
                style={{ color: isToday ? "var(--accent)" : "var(--muted-foreground)" }}
              >
                {cellDate.getDate()}
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="mt-2 text-sm font-semibold text-muted-foreground">{t("ob.prev.rest")}</div>
            ) : (
              sessions.map((s) => {
                const Icon = SESSION_ICON[s.type];
                return (
                  <Link
                    key={s.id}
                    href={`/v2/app/session/${s.id}`}
                    className="v2-transition mt-2 block border-l-2 pl-2 hover:opacity-80"
                    style={{ borderColor: SESSION_TONE[s.type] }}
                  >
                    <div className="flex items-center gap-1" style={{ color: SESSION_TONE[s.type] }}>
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="text-sm font-bold leading-tight">{t(`sessiontype.${s.type}`)}</span>
                    </div>
                    <div className="tabular text-xs font-semibold text-muted-foreground">{sessionDetail(s, lang)}</div>
                  </Link>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}
