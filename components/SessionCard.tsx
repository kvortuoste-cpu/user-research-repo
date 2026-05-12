"use client";

import Link from "next/link";
import type { ResearchSession, Sentiment } from "@/lib/db";
import { Label, Token } from "@primer/react";

const sentimentVariant: Record<Sentiment, "primary" | "danger" | "secondary" | "attention"> = {
  positive: "primary",
  negative: "danger",
  neutral: "secondary",
  mixed: "attention",
};

interface Props {
  session: ResearchSession;
  projectId: number;
  onTagClick?: (tag: string) => void;
}

export function SessionCard({ session, projectId, onTagClick }: Props) {
  const visibleTags = session.tags.slice(0, 4);
  const extraCount = session.tags.length - visibleTags.length;

  return (
    <div className="border border-[#e2e3e5] rounded-lg bg-white p-4 flex flex-col gap-2 transition-colors hover:border-[#1460aa]">
      {/* Title + sentiment */}
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/projects/${projectId}/sessions/${session.id}`}
          className="text-sm font-semibold text-black hover:text-[#1460aa] line-clamp-2 flex-1"
          style={{ textDecoration: "none" }}
        >
          {session.title}
        </Link>
        <Label variant={sentimentVariant[session.sentiment]} size="small" className="shrink-0">
          {session.sentiment.charAt(0).toUpperCase() + session.sentiment.slice(1)}
        </Label>
      </div>

      {/* Summary */}
      <p className="text-xs text-[#6d6d6f] line-clamp-2 leading-relaxed">
        {session.summary || "No summary"}
      </p>

      {/* Tags */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <Token
              key={tag}
              text={tag}
              size="small"
              onClick={onTagClick ? (e) => { e.preventDefault(); onTagClick(tag); } : undefined}
              style={{ cursor: onTagClick ? "pointer" : "default" }}
            />
          ))}
          {extraCount > 0 && (
            <span className="text-xs text-[#a3a4a6] self-center">+{extraCount} more</span>
          )}
        </div>
      )}

      <span className="text-xs text-[#a3a4a6]">
        {new Date(session.createdAt).toLocaleDateString()}
      </span>
    </div>
  );
}
