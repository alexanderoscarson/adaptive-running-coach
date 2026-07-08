"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, Loader2, X } from "lucide-react";
import { getRaceById } from "@/lib/races";
import { useV3I18n } from "../../_lib/i18n";
import { getSmoke, track } from "../../_lib/smoke";
import { EASE } from "../../_components/motion";
import { Wordmark } from "../../_components/topbar";

/* Smoke-test waitlist step ("the paid door", part 2). Reached from the plan
   preview via /v3/start?race=<id>&paid=1 (paid-door click) or without paid
   (low-emphasis waitlist link). Nothing is charged — the email goes into
   smoke_funnel_signups with clean intent flags. */

function StartInner() {
  const { t, lang } = useV3I18n();
  const params = useSearchParams();

  const paid = params.get("paid") === "1";
  const race = useMemo(() => {
    const id = params.get("race");
    return id ? getRaceById(id) : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [email, setEmail] = useState("");
  const [targetRace, setTargetRace] = useState(race?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError(t("queue.invalidEmail"));
      return;
    }
    setBusy(true);
    setError(null);
    const ctx = getSmoke();
    try {
      const res = await fetch("/v3/api/funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "signup",
          email: email.trim(),
          variant: ctx.variant,
          clicked_paid_door: paid,
          waitlist_only: !paid,
          target_race: targetRace.trim() || null,
          utm_source: ctx.utm_source,
          utm_medium: ctx.utm_medium,
          utm_campaign: ctx.utm_campaign,
        }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) throw new Error("signup failed");
      track("waitlist_signup");
      setDone(true);
    } catch {
      setError(t("queue.error"));
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-[var(--v3-hairline)] bg-[color-mix(in_oklab,var(--background)_84%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Wordmark />
          <Link
            href="/v3"
            aria-label={t("queue.back")}
            className="grid size-9 place-items-center rounded-full border border-[var(--v3-hairline-strong)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--foreground)]"
          >
            <X className="size-4" />
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-md px-5 pb-24 pt-12 sm:pt-16">
        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-center"
          >
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[color-mix(in_oklab,var(--v3-cyan)_18%,transparent)] text-[var(--v3-cyan)]">
              <Check className="size-6" />
            </span>
            <h1 className="v3-h2 mt-6">{t("queue.confirm.title")}</h1>
            <p className="mt-3 text-base leading-relaxed text-[var(--muted-foreground)]">
              {t("queue.confirm.body")}
            </p>
            <Link href="/v3" className="v3-btn v3-btn-ghost mt-8">
              {t("queue.back")}
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <p className="v3-eyebrow">{lang === "sv" ? "Snart" : "Soon"}</p>
            <h1 className="v3-h2 mt-3">{t("queue.title")}</h1>

            <form onSubmit={submit} className="mt-8 grid gap-4">
              <label className="block">
                <span className="v3-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {t("queue.email")}
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-[var(--v3-hairline-strong)] bg-[var(--card)] px-4 py-3.5 text-base outline-none transition-colors focus:border-[var(--primary)]"
                />
              </label>
              <label className="block">
                <span className="v3-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {t("queue.race")}
                </span>
                <input
                  type="text"
                  value={targetRace}
                  onChange={(e) => setTargetRace(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-[var(--v3-hairline-strong)] bg-[var(--card)] px-4 py-3.5 text-base outline-none transition-colors focus:border-[var(--primary)]"
                />
              </label>

              <div aria-live="polite">
                {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
              </div>

              <button type="submit" disabled={busy} className="v3-btn v3-btn-primary w-full disabled:opacity-60">
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <>
                    {t("queue.cta")}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <StartInner />
    </Suspense>
  );
}
