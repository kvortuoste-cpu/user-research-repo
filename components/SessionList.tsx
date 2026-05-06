"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Sentiment } from "@/lib/db";
import { filterSessions, uniqueTags } from "@/lib/search";
import { SessionCard } from "./SessionCard";
import { SearchBar } from "./SearchBar";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="space-y-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-700">
          Sessions ({sessions.length})
        </h2>
      </div>

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
        <div className="text-center py-10 text-sm text-neutral-500 border-2 border-dashed rounded-lg">
          No sessions yet. Upload your first transcript above.
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-neutral-500">
          No sessions match these filters.
        </div>
      ) : (
        <div className="space-y-3">
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
