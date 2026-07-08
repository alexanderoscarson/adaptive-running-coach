"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useV3I18n } from "../_lib/i18n";
import type { PreviewInput } from "../_lib/preview-plan";
import { persistAndGenerate } from "../_lib/persist-plan";
import { EASE } from "./motion";

/* Final onboarding step: create an account (or sign in) and save the plan
   for real — same tables and server-side generation as the production app.
   On success the user lands in the app at /v2/app. */

type Mode = "signup" | "signin";

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="v3-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={type !== "text"}
        minLength={minLength}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block w-full rounded-xl border border-[var(--v3-hairline-strong)] bg-[var(--card)] px-4 py-3.5 text-base outline-none transition-colors focus:border-[var(--primary)]"
      />
    </label>
  );
}

export function AccountStep({ input }: { input: PreviewInput }) {
  const { t, lang } = useV3I18n();
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw new Error(err.message);
        // Returning user — straight to their saved plan, nothing overwritten.
        router.push("/v2/app");
        router.refresh();
        return;
      }

      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (err) throw new Error(err.message);
      if (!data.session) {
        // Existing confirmed account: Supabase anti-enumeration returns a
        // ghost user with no identities and sends no email — say so plainly.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setMode("signin");
          setError(t("ob.acc.exists"));
        } else {
          // Genuinely new account — email confirmation required.
          setError(t("ob.acc.confirmEmail"));
        }
        setBusy(false);
        return;
      }
      setSaving(true);
      await persistAndGenerate(supabase, input, fullName, lang);
      router.push("/v2/app");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(/fetch|network/i.test(msg) ? t("ob.acc.offline") : msg || t("ob.acc.error"));
      setBusy(false);
      setSaving(false);
    }
  }

  if (saving) {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-5 text-center">
        <Loader2 className="size-8 animate-spin text-[var(--v3-electric-bright)]" aria-hidden />
        <h1 className="v3-h3 mt-6">{t("ob.acc.saving")}</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">{t("ob.acc.savingSub")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-28 pt-10 sm:pt-14">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
        <p className="v3-eyebrow">{mode === "signup" ? t("ob.acc.eyebrow") : t("ob.acc.signinEyebrow")}</p>
        <h1 className="v3-h2 mt-3">{mode === "signup" ? t("ob.acc.title") : t("ob.acc.signinTitle")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {mode === "signup" ? t("ob.acc.sub") : t("ob.acc.signinSub")}
        </p>

        <div className="v3-mono mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--v3-hairline-strong)] px-4 py-2 text-xs uppercase tracking-[0.14em]">
          <span className="text-[var(--muted-foreground)]">{t("ob.race.selected")}:</span>
          <span className="font-bold text-[var(--v3-electric-bright)]">{input.race.name}</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          {mode === "signup" && (
            <Field label={t("ob.acc.name")} type="text" value={fullName} onChange={setFullName} autoComplete="name" />
          )}
          <Field label={t("ob.acc.email")} type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field
            label={t("ob.acc.password")}
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={6}
          />

          <div aria-live="polite">
            {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
          </div>

          <button type="submit" disabled={busy} className="v3-btn v3-btn-primary w-full disabled:opacity-60">
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <>
                {mode === "signup" ? t("ob.acc.cta") : t("ob.acc.signinCta")}
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError(null);
          }}
          className="mt-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          {mode === "signup" ? t("ob.acc.toSignin") : t("ob.acc.toSignup")}
        </button>
      </motion.div>
    </div>
  );
}
