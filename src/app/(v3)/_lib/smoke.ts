"use client";

/* Smoke-test funnel plumbing: variant + UTM capture on campaign entry,
   session-scoped persistence, and fire-and-forget event tracking to
   /v3/api/funnel. Organic traffic (no campaign entry) is variant "direct"
   so the paid test stays clean while still giving a free baseline. */

export type SmokeVariant = "klassiker" | "lopp" | "coach" | "direct";

export interface SmokeContext {
  variant: SmokeVariant;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  session_key: string;
}

const CTX_KEY = "parrot-smoke";
const FIRED_PREFIX = "parrot-smoke-fired:";

function clamp(v: string | null): string | null {
  return v ? v.slice(0, 80) : null;
}

function newSessionKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Read the stored context, or initialize an organic "direct" one. */
export function getSmoke(): SmokeContext {
  if (typeof window === "undefined") {
    return { variant: "direct", utm_source: null, utm_medium: null, utm_campaign: null, session_key: "ssr" };
  }
  try {
    const raw = sessionStorage.getItem(CTX_KEY);
    if (raw) return JSON.parse(raw) as SmokeContext;
  } catch {
    /* corrupted storage → re-initialize */
  }
  const ctx: SmokeContext = {
    variant: "direct",
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    session_key: newSessionKey(),
  };
  try {
    sessionStorage.setItem(CTX_KEY, JSON.stringify(ctx));
  } catch {
    /* private mode etc. — tracking degrades, product keeps working */
  }
  return ctx;
}

/** Called on campaign page mount: bind this session to the variant + UTM. */
export function captureCampaign(variant: Exclude<SmokeVariant, "direct">): SmokeContext {
  const params = new URLSearchParams(window.location.search);
  const ctx: SmokeContext = {
    variant,
    utm_source: clamp(params.get("utm_source")),
    utm_medium: clamp(params.get("utm_medium")),
    utm_campaign: clamp(params.get("utm_campaign")),
    session_key: getSmoke().session_key,
  };
  try {
    sessionStorage.setItem(CTX_KEY, JSON.stringify(ctx));
  } catch {
    /* see above */
  }
  return ctx;
}

/** Fire-and-forget funnel event. `once` dedupes per session (view-style events). */
export function track(event: string, opts?: { once?: boolean }): void {
  if (typeof window === "undefined") return;
  if (opts?.once) {
    const flag = FIRED_PREFIX + event;
    try {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, "1");
    } catch {
      /* still send */
    }
  }
  const ctx = getSmoke();
  const body = JSON.stringify({ kind: "event", event, ...ctx });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/v3/api/funnel", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/v3/api/funnel", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
  } catch {
    /* analytics must never break the product */
  }
}
