"use client";

import { Search, X } from "lucide-react";
import type { Sentiment } from "@/lib/db";
import { Button, TextInput, Token } from "@primer/react";

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
  const hasFilters = query.length > 0 || sentiment !== "all" || selectedTags.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <TextInput
        block
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search transcripts, summaries, titles..."
        leadingVisual={() => <Search className="h-4 w-4 text-[#a3a4a6]" />}
      />

      {/* Sentiment filter pills */}
      <div className="flex flex-wrap gap-1">
        {sentimentOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSentimentChange(opt.value)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
              sentiment === opt.value
                ? "bg-[#1460aa] text-white border-[#1460aa]"
                : "bg-white text-[#333] border-[#e2e3e5] hover:border-[#1460aa] hover:bg-[#eff0f2]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tag tokens */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {availableTags.map((tag) => (
            <Token
              key={tag}
              text={tag}
              size="small"
              isSelected={selectedTags.includes(tag)}
              onClick={() => onTagToggle(tag)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </div>
      )}

      {hasFilters && (
        <div>
          <Button
            variant="invisible"
            size="small"
            onClick={onClearFilters}
            leadingVisual={() => <X className="h-3 w-3" />}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
