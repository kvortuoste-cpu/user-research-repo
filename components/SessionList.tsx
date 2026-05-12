"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Sentiment } from "@/lib/db";
import { filterSessions, uniqueTags } from "@/lib/search";
import { SessionCard } from "./SessionCard";
import { SearchBar } from "./SearchBar";
import { SkeletonBox } from "@primer/react";

interface Props {
  projectId: number;
}

export function SessionList({ projectId }: Props) {
  const [query, setQuery] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | "all">("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const sessions = useLiveQuery(
    () =>
      db.sessions
        .where("projectId")
        .equals(projectId)
        .reverse()
        .sortBy("createdAt"),
    [projectId],
  );

  const availableTags = useMemo(
    () => (sessions ? uniqueTags(sessions) : []),
    [sessions],
  );

  const filtered = useMemo(
    () =>
      sessions
        ? filterSessions(sessions, { query, sentiment, tags: selectedTags })
        : [],
    [sessions, query, sentiment, selectedTags],
  );

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function clearFilters() {
    setQuery("");
    setSentiment("all");
    setSelectedTags([]);
  }

  if (sessions === undefined) {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonBox height="40px" />
        <SkeletonBox height="96px" />
        <SkeletonBox height="96px" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="text-sm font-semibold text-[#6d6d6f]">
        Sessions ({sessions.length})
      </span>

      <SearchBar
        query={query}
        sentiment={sentiment}
        selectedTags={selectedTags}
        availableTags={availableTags}
        onQueryChange={setQuery}
        onSentimentChange={setSentiment}
        onTagToggle={toggleTag}
        onClearFilters={clearFilters}
      />

      {sessions.length === 0 ? (
        <div className="text-center py-10 text-sm text-[#6d6d6f] border-2 border-dashed border-[#e2e3e5] rounded-lg">
          No sessions yet. Upload your first transcript above.
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-[#6d6d6f]">
          No sessions match these filters.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              projectId={projectId}
              onTagClick={(tag) => {
                if (!selectedTags.includes(tag)) {
                  setSelectedTags((prev) => [...prev, tag]);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
