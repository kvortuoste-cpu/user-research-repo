"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Lock, User, Calendar } from "lucide-react";
import { db, type Project } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  project: Project;
}

export function ProjectCard({ project }: Props) {
  const sessionCount = useLiveQuery(
    () =>
      project.id !== undefined
        ? db.sessions.where("projectId").equals(project.id).count()
        : Promise.resolve(0),
    [project.id],
    0,
  );

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <Card className="hover:border-blue-400 transition-colors h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base group-hover:text-blue-600">
              {project.name}
            </CardTitle>
            {project.owner && (
              <Lock
                className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-1"
                aria-label="Locked"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {project.description ? (
            <p className="text-sm text-neutral-600 line-clamp-2">
              {project.description}
            </p>
          ) : (
            <p className="text-sm text-neutral-400 italic">No description</p>
          )}
          <div className="space-y-1.5 text-xs text-neutral-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-neutral-400" />
              <span>
                Created {new Date(project.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            {project.owner ? (
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-neutral-400" />
                <span className="truncate">{project.owner}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-neutral-400 italic">
                <User className="h-3 w-3" />
                <span>No owner</span>
              </div>
            )}
            <div className="text-neutral-500">
              {sessionCount} session{sessionCount === 1 ? "" : "s"}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
