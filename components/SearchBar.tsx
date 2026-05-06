"use client";

import { Search, X } from "lucide-react";
import type { Sentiment } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const sentimentOptions: Array<{ value: Sentiment | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "positive", label: "Positive" },
  { value: "negative", label: "Negative" },
  { value: "neutral", label: "Neutral" },
  { value: "mixed", label: "Mixed" },
];

interface Props {
  query: string;
  sentiment: Sentiment | "all";
  selectedTags: string[];
  availableTags: string[];
  onQueryChange: (q: string) => void;
  onSentimentChange: (s: Sentiment | "all") => void;
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
}

export function SearchBar({
  query,
  sentiment,
  selectedTags,
  availableTags,
  onQueryChange,
  onSentimentChange,
  onTagToggle,
  onClearFilters,
}: Props) {
  const hasFilters =
    query.length > 0 || sentiment !== "all" || selectedTags.length > 0;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search transcripts, summaries, titles..."
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {sentimentOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSentimentChange(opt.value)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              sentiment === opt.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagToggle(tag)}
                className="cursor-pointer"
              >
                <Badge
                  variant={active ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {tag}
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-7 text-xs"
        >
          <X className="h-3 w-3" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
