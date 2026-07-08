import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* POST /v3/api/funnel — smoke-test funnel capture (server-side inserts only).

   { kind: "event",  event, variant, utm_*, session_key }
     → smoke_funnel_events (fire-and-forget from the client)

   { kind: "signup", email, variant, clicked_paid_door, waitlist_only,
     target_race, utm_* }
     → smoke_funnel_signups (upsert on email; paid-door click wins)

   Uses the service-role key: the tables have RLS enabled with no public
   policies, so nothing is readable or writable from the browser. */

const VARIANTS = new Set(["klassiker", "lopp", "coach", "direct"]);
const EVENTS = new Set([
  "campaign_page_view",
  "onboarding_started",
  "plan_preview_reached",
  "paid_door_clicked",
  "waitlist_signup",
]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function str(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim().slice(0, max) : null;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = svc();
  if (!supabase) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });

  const variant = VARIANTS.has(body.variant as string) ? (body.variant as string) : "direct";
  const utm = {
    utm_source: str(body.utm_source, 80),
    utm_medium: str(body.utm_medium, 80),
    utm_campaign: str(body.utm_campaign, 80),
  };

  if (body.kind === "event") {
    const event = body.event as string;
    if (!EVENTS.has(event)) return NextResponse.json({ ok: false }, { status: 400 });
    const { error } = await supabase.from("smoke_funnel_events").insert({
      event,
      variant,
      session_key: str(body.session_key, 64),
      ...utm,
    });
    // Fire-and-forget on the client — errors are logged, not surfaced.
    if (error) console.error("smoke_funnel_events insert failed:", error.message);
    return NextResponse.json({ ok: !error });
  }

  if (body.kind === "signup") {
    const email = str(body.email, 200)?.toLowerCase() ?? null;
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid email" }, { status: 400 });
    }
    const clickedPaidDoor = body.clicked_paid_door === true;
    const { error } = await supabase.from("smoke_funnel_signups").upsert(
      {
        email,
        variant,
        clicked_paid_door: clickedPaidDoor,
        waitlist_only: body.waitlist_only === true && !clickedPaidDoor,
        target_race: str(body.target_race, 120),
        ...utm,
      },
      { onConflict: "email" }
    );
    if (error) {
      console.error("smoke_funnel_signups upsert failed:", error.message);
      return NextResponse.json({ ok: false, error: "storage" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
