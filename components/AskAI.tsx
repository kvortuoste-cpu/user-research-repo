"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  projectId: number;
}

const SUGGESTED_PROMPTS = [
  "What are the top pain points?",
  "What features were most requested?",
  "How do users feel about onboarding?",
  "What surprised you most in the data?",
];

export function AskAI({ projectId }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messages = useLiveQuery(
    () =>
      db.askAIMessages
        .where("projectId")
        .equals(projectId)
        .sortBy("createdAt"),
    [projectId],
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
        projectId,
        role: "user",
        content: trimmed,
        createdAt: new Date(),
      });

      const sessions = await db.sessions
        .where("projectId")
        .equals(projectId)
        .toArray();

      if (sessions.length === 0) {
        await db.askAIMessages.add({
          projectId,
          role: "assistant",
          content:
            "There are no sessions in this project yet. Upload some transcripts first and I'll analyze them.",
          createdAt: new Date(),
        });
        return;
      }

      const transcripts = sessions.map(
        (s) => `Title: ${s.title}\n\n${s.transcript}`,
      );

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ask", query: trimmed, transcripts }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { answer: string };

      await db.askAIMessages.add({
        projectId,
        role: "assistant",
        content: data.answer,
        createdAt: new Date(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
      await db.askAIMessages.add({
        projectId,
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
    <div className="flex flex-col h-full bg-white border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <h2 className="text-sm font-semibold">Ask AI</h2>
        <span className="text-xs text-neutral-500 ml-auto">
          Synthesizes across all sessions
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages === undefined || messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Ask a question across every session in this project. Try:
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
                    ? "bg-blue-600 text-white"
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

      <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask something..."
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
