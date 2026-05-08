"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronRight, Calendar, User } from "lucide-react";
import { db } from "@/lib/db";
import { SessionList } from "@/components/SessionList";
import { AskAI } from "@/components/AskAI";
import { EditProject } from "@/components/EditProject";
import { SessionSummary } from "@/components/SessionSummary";
import { NewSessionModal } from "@/components/NewSessionModal";

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Number(params.projectId);

  const project = useLiveQuery(
    () => (Number.isFinite(projectId) ? db.projects.get(projectId) : undefined),
    [projectId],
  );

  if (project === undefined) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 text-sm text-neutral-500">
        Loading...
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-sm text-neutral-600">
          Project not found.{" "}
          <Link href="/" className="text-blue-600 underline">
            Back to projects
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center text-xs text-neutral-500">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 mx-1" />
        <span className="text-neutral-900 font-medium">{project.name}</span>
      </nav>

      {/* 1. Header: title + edit button inline */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <EditProject project={project} />
        </div>
        {project.description && (
          <p className="text-sm text-neutral-600">{project.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-neutral-600 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-neutral-400" />
            <span>
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
              <User className="h-3 w-3 text-neutral-400" />
              <span>Conducted by {project.conductedBy}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-neutral-400 italic">
              <User className="h-3 w-3" />
              <span>Conducted by — unspecified</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Ask AI — full width */}
      <div className="h-[360px]">
        <AskAI projectId={projectId} />
      </div>

      {/* 3. Session Summary */}
      <SessionSummary projectId={projectId} />

      {/* 4. New Session button */}
      <div>
        <NewSessionModal projectId={projectId} />
      </div>

      {/* 5. Sessions List */}
      <SessionList projectId={projectId} />
    </div>
  );
}
