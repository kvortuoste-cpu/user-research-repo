"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { User, Calendar } from "lucide-react";
import { db, type Project } from "@/lib/db";

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
    <Link href={`/projects/${project.id}`} className="block group" style={{ textDecoration: "none" }}>
      <div className="border border-[#e2e3e5] rounded-lg bg-white overflow-hidden h-full flex flex-col transition-colors hover:border-[#1460aa]">
        <div className="p-4 flex flex-col gap-2 h-full">
          <span className="text-sm font-semibold text-black group-hover:text-[#1460aa] transition-colors">
            {project.name}
          </span>

          {project.description ? (
            <span className="text-xs text-[#6d6d6f] line-clamp-2">{project.description}</span>
          ) : (
            <span className="text-xs text-[#a3a4a6] italic">No description</span>
          )}

          <div className="flex flex-col gap-1 mt-auto pt-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-[#a3a4a6]" />
              <span className="text-xs text-[#6d6d6f]">
                Created{" "}
                {new Date(project.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {project.conductedBy ? (
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-[#a3a4a6]" />
                <span className="text-xs text-[#6d6d6f] truncate">Conducted by {project.conductedBy}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-[#c9cacc]" />
                <span className="text-xs text-[#a3a4a6] italic">Conducted by — unspecified</span>
              </div>
            )}

            <span className="text-xs text-[#a3a4a6]">
              {sessionCount} session{sessionCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
