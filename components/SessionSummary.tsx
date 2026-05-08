"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BarChart2 } from "lucide-react";
import { db } from "@/lib/db";

interface Props {
  projectId: number;
}

export function SessionSummary({ projectId }: Props) {
  const sessions = useLiveQuery(
    () => db.sessions.where("projectId").equals(projectId).toArray(),
    [projectId],
  );

  const stats = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;

    const participantCount = sessions.filter((s) => s.participantInfo).length;

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
      sorted.length === 1
        ? fmt(sorted[0])
        : `${fmt(sorted[0])} – ${fmt(sorted[sorted.length - 1])}`;

    // Aggregate findings from most-recent sessions first, simple string dedup
    const seen = new Set<string>();
    const keyFindings = sessions
      .slice()
      .sort((a, b) => +b.createdAt - +a.createdAt)
      .flatMap((s) => s.keyFindings ?? [])
      .filter((f) => {
        const key = f.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);

    return {
      sessionCount: sessions.length,
      participantCount,
      dateRange,
      keyFindings,
    };
  }, [sessions]);

  if (sessions === undefined) return null;

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed bg-neutral-50 px-6 py-8 text-center text-sm text-neutral-500">
        Create your first session to see insights here.
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="rounded-lg border bg-neutral-50 overflow-hidden">
      <div className="h-1 bg-[var(--primary)]" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-neutral-400 shrink-0" />
          <span className="text-xs text-neutral-500">
            {stats.sessionCount} session{stats.sessionCount !== 1 ? "s" : ""}
            {stats.participantCount > 0
              ? ` · ${stats.participantCount} participant${stats.participantCount !== 1 ? "s" : ""}`
              : ""}
            {" · "}
            {stats.dateRange}
          </span>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">
            Key Findings Across All Sessions
          </h3>
          {stats.keyFindings.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No findings extracted yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {stats.keyFindings.map((finding, i) => (
                <li key={i} className="flex gap-2 text-sm text-neutral-700 leading-snug">
                  <span className="text-neutral-400 shrink-0 mt-0.5">•</span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
