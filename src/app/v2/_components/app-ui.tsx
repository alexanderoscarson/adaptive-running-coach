"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { useV2I18n } from "../_lib/i18n";

/** Small uppercase MOCK chip to tag a single fabricated value inline. */
export function MockTag({ className = "" }: { className?: string }) {
  const { t } = useV2I18n();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] ${className}`}
      style={{
        color: "var(--accent)",
        background: "color-mix(in oklab, var(--accent) 12%, transparent)",
        border: "1px solid color-mix(in oklab, var(--accent) 26%, transparent)",
      }}
    >
      {t("mock.tag")}
    </span>
  );
}

/** Dashed accent panel explaining what's mocked on a surface. */
export function MockNote({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-2xl p-4"
      style={{
        border: "1px dashed color-mix(in oklab, var(--accent) 40%, transparent)",
        background: "color-mix(in oklab, var(--accent) 6%, transparent)",
      }}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <p className="text-xs font-medium leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

/** Consistent page heading used across the in-app surfaces. */
export function PageHeader({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{title}</h1>
        {sub && <p className="mt-3 max-w-xl text-base font-medium leading-relaxed text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
