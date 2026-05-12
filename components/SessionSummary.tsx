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
    const sorted = sessions.map((s) => s.createdAt).sort((a, b) => +a - +b);
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const dateRange =
      sorted.length === 1
        ? fmt(sorted[0])
        : `${fmt(sorted[0])} – ${fmt(sorted[sorted.length - 1])}`;

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

    return { sessionCount: sessions.length, participantCount, dateRange, keyFindings };
  }, [sessions]);

  if (sessions === undefined) return null;

  if (sessions.length === 0) {
    return (
      <div className="border-2 border-dashed border-[#e2e3e5] rounded-lg p-8 text-center text-sm text-[#6d6d6f]">
        Create your first session to see insights here.
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="border border-[#e2e3e5] rounded-lg bg-[#f6f6f6] overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 bg-[#1460aa]" />
      <div className="p-4 flex flex-col gap-4">
        {/* Stats row */}
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-[#a3a4a6] shrink-0" />
          <span className="text-xs text-[#6d6d6f]">
            {stats.sessionCount} session{stats.sessionCount !== 1 ? "s" : ""}
            {stats.participantCount > 0
              ? ` · ${stats.participantCount} participant${stats.participantCount !== 1 ? "s" : ""}`
              : ""}
            {" · "}
            {stats.dateRange}
          </span>
        </div>

        {/* Key findings */}
        <div>
          <span className="text-sm font-semibold block mb-2">Key Findings Across All Sessions</span>
          {stats.keyFindings.length === 0 ? (
            <p className="text-sm text-[#6d6d6f]">No findings extracted yet.</p>
          ) : (
            <ul className="list-none p-0 m-0 flex flex-col gap-1">
              {stats.keyFindings.map((finding, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-[#a3a4a6] shrink-0 mt-0.5">•</span>
                  <span className="text-sm text-black leading-relaxed">{finding}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
