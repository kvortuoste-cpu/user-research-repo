import type { ResearchSession, Sentiment } from "./db";

export interface FilterState {
  query: string;
  sentiment: Sentiment | "all";
  tags: string[];
}

export function filterSessions(
  sessions: ResearchSession[],
  filters: FilterState,
): ResearchSession[] {
  const q = filters.query.trim().toLowerCase();

  return sessions.filter((s) => {
    if (filters.sentiment !== "all" && s.sentiment !== filters.sentiment) {
      return false;
    }
    if (filters.tags.length > 0) {
      const hasAll = filters.tags.every((t) => s.tags.includes(t));
      if (!hasAll) return false;
    }
    if (q) {
      const haystack =
        s.title.toLowerCase() +
        " " +
        s.transcript.toLowerCase() +
        " " +
        s.summary.toLowerCase() +
        " " +
        s.tags.join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function uniqueTags(sessions: ResearchSession[]): string[] {
  const set = new Set<string>();
  sessions.forEach((s) => s.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort();
}
