import { NextResponse } from "next/server";
import { chatWithCoach } from "@/lib/coach";
import { buildDemoCoachContext } from "../../_lib/coach-context";

/* POST /v2/api/coach
   Server-side coach for the v2 preview. Reuses the SHARED chatWithCoach engine
   (the same one production uses) but feeds it a context built from the in-memory
   demo plan — no auth, no DB, no persistence. The Anthropic key stays on the
   server and is never exposed to the client.

   Body: { messages: { role: "user" | "assistant"; content: string }[], language }
   200 → { message, proposal }
   400 → { error }   (bad input)
   502 → { error }   (coach/LLM call failed — UI shows a friendly fallback) */

interface InMsg {
  role: "user" | "assistant";
  content: string;
}

function sanitize(raw: unknown): InMsg[] {
  if (!Array.isArray(raw)) return [];
  const out: InMsg[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role === "user" || role === "assistant") && typeof content === "string" && content.trim()) {
      out.push({ role, content: content.trim() });
    }
  }
  return out;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = sanitize(body.messages);
  // Anthropic requires the conversation to start with a user turn.
  if (messages.length === 0 || messages[0].role !== "user") {
    return NextResponse.json({ error: "A user message is required." }, { status: 400 });
  }

  const language = body.language === "en" ? "en" : "sv";
  const context = buildDemoCoachContext(language);
  if (!context) {
    return NextResponse.json({ error: "Demo plan unavailable." }, { status: 502 });
  }

  try {
    const result = await chatWithCoach(messages, context);
    return NextResponse.json({ message: result.content, proposal: result.proposal });
  } catch (err) {
    console.error("[v2 coach] chat failed", err);
    return NextResponse.json({ error: "Coach request failed." }, { status: 502 });
  }
}
