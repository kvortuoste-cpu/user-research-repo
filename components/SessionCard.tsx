"use client";

import Link from "next/link";
import type { ResearchSession, Sentiment } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sentimentColor: Record<Sentiment, string> = {
  positive: "bg-green-500",
  negative: "bg-red-500",
  neutral: "bg-neutral-400",
  mixed: "bg-amber-500",
};

const sentimentLabel: Record<Sentiment, string> = {
  positive: "Positive",
  negative: "Negative",
  neutral: "Neutral",
  mixed: "Mixed",
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
    <Card className="hover:border-blue-400 transition-colors">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/projects/${projectId}/sessions/${session.id}`}
            className="font-medium text-sm hover:text-blue-600 line-clamp-2 flex-1"
          >
            {session.title}
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`h-2 w-2 rounded-full ${sentimentColor[session.sentiment]}`}
              aria-hidden
            />
            <span className="text-xs text-neutral-600">
              {sentimentLabel[session.sentiment]}
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
          {session.summary || "No summary"}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onTagClick?.(tag);
              }}
              className="cursor-pointer"
            >
              <Badge variant="secondary" className="text-[10px] hover:bg-blue-100">
                {tag}
              </Badge>
            </button>
          ))}
          {extraCount > 0 && (
            <Badge variant="outline" className="text-[10px]">
              +{extraCount} more
            </Badge>
          )}
        </div>

        <div className="text-[11px] text-neutral-500">
          {new Date(session.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
