"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { Button, Spinner, Textarea } from "@primer/react";

const SUGGESTED_PROMPTS = [
  "What insights appear across multiple projects?",
  "Which project has the most validated insights?",
  "What patterns do you see in participant feedback?",
  "What are the most common pain points?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export function AskAIDashboard({ isOpen, onToggle }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(query: string) {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setInput("");

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const projects = await db.projects.orderBy("createdAt").toArray();
      if (projects.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "No projects found yet. Create some projects and upload sessions to get cross-project insights.",
          },
        ]);
        return;
      }

      const projectSummaries = await Promise.all(
        projects.map(async (p) => {
          const sessions = await db.sessions.where("projectId").equals(p.id!).toArray();
          const keyFindings = sessions.slice().reverse().flatMap((s) => s.keyFindings ?? []).slice(0, 10);
          const participantCount = sessions.filter((s) => s.participantInfo).length;
          const sorted = sessions.map((s) => s.createdAt).sort((a, b) => +a - +b);
          const fmt = (d: Date) =>
            d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
          const dateRange =
            sorted.length > 0
              ? sorted.length === 1
                ? fmt(sorted[0])
                : `${fmt(sorted[0])} – ${fmt(sorted[sorted.length - 1])}`
              : "No sessions";
          return { name: p.name, description: p.description, sessionCount: sessions.length, participantCount, dateRange, keyFindings };
        }),
      );

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ask-cross-project", query: trimmed, projectSummaries }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { answer: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, I hit an error: ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Collapsed tab */}
      <button
        onClick={onToggle}
        aria-label="Open Ask AI"
        className={`fixed top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 bg-white border border-[#e2e3e5] border-r-0 rounded-l-lg px-2 py-4 shadow-md hover:bg-[#f6f6f6] transition-all duration-200 ${
          isOpen ? "right-[-56px] pointer-events-none opacity-0" : "right-0"
        }`}
      >
        <Sparkles className="h-4 w-4 text-[#1460aa]" />
        <span
          className="text-xs font-semibold text-[#1c1c1e]"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Ask AI
        </span>
      </button>

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-screen z-40 flex flex-col bg-white border-l border-[#e2e3e5] shadow-2xl transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: 360 }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#e2e3e5] flex items-center gap-2 shrink-0">
          <Sparkles className="h-4 w-4 text-[#1460aa]" />
          <span className="text-sm font-semibold">Ask AI</span>
          <span className="text-xs text-[#6d6d6f] ml-auto">Synthesizes across all projects</span>
          <button
            onClick={onToggle}
            aria-label="Close Ask AI"
            className="ml-2 p-1 rounded text-[#6d6d6f] hover:text-black hover:bg-[#f0f0f0] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
          {messages.length === 0 && !loading && (
            <p className="text-sm text-[#6d6d6f]">
              Ask anything across your entire research portfolio.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                  m.role === "user" ? "bg-[#1460aa] text-white" : "bg-[#f6f6f6] text-black"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-lg bg-[#f6f6f6] text-sm flex items-center gap-2 text-[#6d6d6f]">
                <Spinner size="small" />
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Suggested prompts — always visible */}
        <div className="px-4 py-3 border-t border-[#e2e3e5] flex flex-col gap-1.5 shrink-0">
          <p className="text-xs text-[#6d6d6f] font-medium">Suggested</p>
          <div className="flex flex-col gap-1">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => send(p)}
                disabled={loading}
                className="text-left text-xs px-2.5 py-1.5 rounded-md border border-[#e2e3e5] bg-[#f6f6f6] text-black hover:bg-[#eff0f2] hover:border-[#1460aa] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-[#e2e3e5] p-2 flex gap-2 shrink-0"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask something across all projects..."
            rows={2}
            disabled={loading}
            style={{ flex: 1, resize: "none" }}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !input.trim()}
            aria-label="Send"
            style={{ alignSelf: "flex-end" }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
