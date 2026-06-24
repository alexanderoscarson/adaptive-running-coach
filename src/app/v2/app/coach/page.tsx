"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { useV2I18n } from "../../_lib/i18n";
import { useAppPlan } from "../../_lib/app-data";
import { PageHeader, MockNote } from "../../_components/app-ui";

interface Msg {
  role: "coach" | "user";
  text: string;
}

export default function CoachPage() {
  const { t, lang } = useV2I18n();
  const race = useAppPlan().race;
  const [messages, setMessages] = useState<Msg[]>([{ role: "coach", text: t("coach.intro", { race: race.name }) }]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || typing) return;

    // The real coach route (/api/coach) is authenticated, loads the athlete's
    // plan + recent training as context, persists the exchange, and returns the
    // reply. We send the latest message + language; history lives server-side.
    setMessages((m) => [...m, { role: "user", text: clean }]);
    setDraft("");
    setTyping(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, language: lang }),
      });
      const data = await res.json();
      const reply =
        res.ok && (data?.message || data?.proposal?.summary)
          ? data.message || data.proposal.summary
          : t("coach.error");
      setMessages((m) => [...m, { role: "coach", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "coach", text: t("coach.error") }]);
    } finally {
      setTyping(false);
    }
  }

  const showSuggestions = messages.length <= 1;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl flex-col px-5 py-8 sm:px-8 lg:min-h-[100dvh]">
      <PageHeader eyebrow={t("coach.eyebrow")} title={t("coach.title")} sub={t("coach.sub")} />

      {/* ===== MESSAGES ===== */}
      <div className="mt-6 flex-1 space-y-3">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.text} />
        ))}
        {typing && (
          <div className="flex items-center gap-2">
            <CoachAvatar />
            <div className="flex gap-1 rounded-2xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--v2-hairline)" }}>
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--muted-foreground)", animation: `v2-pulse-glow 1s ease-in-out ${d * 0.15}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ===== SUGGESTIONS ===== */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {["coach.suggest.1", "coach.suggest.2", "coach.suggest.3"].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => send(t(k))}
                className="v2-ring-focus v2-transition rounded-full px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-[var(--secondary)]"
                style={{ border: "1px solid var(--v2-hairline)" }}
              >
                {t(k)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== INPUT ===== */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="mt-4 flex items-end gap-2"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          rows={1}
          placeholder={t("coach.placeholder")}
          className="v2-ring-focus max-h-32 flex-1 resize-none rounded-2xl bg-[var(--card)] px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground"
          style={{ border: "1px solid var(--v2-hairline)" }}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="v2-ring-focus v2-transition flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary-foreground disabled:opacity-40"
          style={{ background: "var(--primary)" }}
          aria-label={t("coach.send")}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      <div className="mt-4">
        <MockNote>{t("coach.note")}</MockNote>
      </div>
    </div>
  );
}

function CoachAvatar() {
  return (
    <span
      className="font-display-v2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm text-primary-foreground"
      style={{ background: "linear-gradient(135deg, var(--v2-electric-bright), var(--v2-cyan))" }}
    >
      P
    </span>
  );
}

function Bubble({ role, text }: { role: "coach" | "user"; text: string }) {
  const isCoach = role === "coach";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-end gap-2 ${isCoach ? "" : "flex-row-reverse"}`}
    >
      {isCoach && <CoachAvatar />}
      <div
        className="max-w-[80%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed"
        style={
          isCoach
            ? { background: "var(--card)", border: "1px solid var(--v2-hairline)", color: "var(--foreground)" }
            : { background: "var(--primary)", color: "var(--primary-foreground)" }
        }
      >
        {text}
      </div>
    </motion.div>
  );
}
