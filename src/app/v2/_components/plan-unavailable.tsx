"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useV2I18n } from "../_lib/i18n";

/* Shown when plan generation produced output that failed validation. We render
   this clean, honest fallback instead of a broken plan. */
export function PlanUnavailable() {
  const { t } = useV2I18n();
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)" }}
      >
        <AlertTriangle className="h-7 w-7 text-accent" />
      </div>
      <h1 className="mt-6 text-3xl sm:text-4xl">{t("planError.title")}</h1>
      <p className="mt-3 text-base font-medium leading-relaxed text-muted-foreground">
        {t("planError.body")}
      </p>
      <Link
        href="/v2/onboarding"
        className="v2-ring-focus v2-transition mt-8 inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-bold text-primary-foreground"
        style={{ background: "var(--primary)", boxShadow: "0 14px 40px -12px var(--glow)" }}
      >
        <RotateCcw className="h-4 w-4" />
        {t("planError.retry")}
      </Link>
    </div>
  );
}
