"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
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
          <CardTitle className="text-base group-hover:text-blue-600">
            {project.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {project.description ? (
            <p className="text-sm text-neutral-600 line-clamp-2">
              {project.description}
            </p>
          ) : (
            <p className="text-sm text-neutral-400 italic">No description</p>
          )}
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>
              {sessionCount} session{sessionCount === 1 ? "" : "s"}
            </span>
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
