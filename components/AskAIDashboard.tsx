"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const DASHBOARD_PROJECT_ID = 0;

const SUGGESTED_PROMPTS = [
  "What insights appear across multiple projects?",
  "Which project has the most validated insights?",
  "What patterns do you see in participant feedback?",
  "What are the most common pain points?",
];

export function AskAIDashboard() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messages = useLiveQuery(
    () =>
      db.askAIMessages
        .where("projectId")
        .equals(DASHBOARD_PROJECT_ID)
        .sortBy("createdAt"),
    [],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(query: string) {
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setInput("");

    try {
      await db.askAIMessages.add({
        projectId: DASHBOARD_PROJECT_ID,
        role: "user",
        content: trimmed,
        createdAt: new Date(),
      });

      const projects = await db.projects.orderBy("createdAt").toArray();

      if (projects.length === 0) {
        await db.askAIMessages.add({
          projectId: DASHBOARD_PROJECT_ID,
          role: "assistant",
          content:
            "No projects found yet. Create some projects and upload sessions to get cross-project insights.",
          createdAt: new Date(),
        });
        return;
      }

      const projectSummaries = await Promise.all(
        projects.map(async (p) => {
          const sessions = await db.sessions
            .where("projectId")
            .equals(p.id!)
            .toArray();

          const keyFindings = sessions
            .slice()
            .reverse()
            .flatMap((s) => s.keyFindings ?? [])
            .slice(0, 10);

          const participantCount = sessions.filter(
            (s) => s.participantInfo,
          ).length;

          const sorted = sessions
            .map((s) => s.createdAt)
            .sort((a, b) => +a - +b);
          const fmt = (d: Date) =>
            d.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          const dateRange =
            sorted.length > 0
              ? sorted.length === 1
                ? fmt(sorted[0])
                : `${fmt(sorted[0])} – ${fmt(sorted[sorted.length - 1])}`
              : "No sessions";

          return {
            name: p.name,
            description: p.description,
            sessionCount: sessions.length,
            participantCount,
            dateRange,
            keyFindings,
          };
        }),
      );

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ask-cross-project",
          query: trimmed,
          projectSummaries,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { answer: string };

      await db.askAIMessages.add({
        projectId: DASHBOARD_PROJECT_ID,
        role: "assistant",
        content: data.answer,
        createdAt: new Date(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
      await db.askAIMessages.add({
        projectId: DASHBOARD_PROJECT_ID,
        role: "assistant",
        content: `Sorry, I hit an error: ${msg}`,
        createdAt: new Date(),
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="flex flex-col h-[360px] bg-white border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center gap-2 shrink-0">
        <Sparkles className="h-4 w-4 text-[var(--ac-blue-400)]" />
        <h2 className="text-sm font-semibold">Ask AI</h2>
        <span className="text-xs text-neutral-500 ml-auto">
          Synthesizes across all projects
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages === undefined || messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Ask anything across your entire research portfolio. Try:
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  disabled={loading}
                  className="text-left text-sm px-3 py-2 rounded-md border bg-neutral-50 hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-neutral-100 text-neutral-900"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg bg-neutral-100 text-sm flex items-center gap-2 text-neutral-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2 shrink-0">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask something across all projects..."
          rows={2}
          className="resize-none text-sm"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
