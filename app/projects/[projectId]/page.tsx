"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { UploadSession } from "@/components/UploadSession";
import { SessionList } from "@/components/SessionList";
import { AskAI } from "@/components/AskAI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="max-w-6xl mx-auto px-6 py-8">
      <nav className="flex items-center text-xs text-neutral-500 mb-4">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 mx-1" />
        <span className="text-neutral-900 font-medium">{project.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-neutral-600 mt-1">{project.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New session</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadSession projectId={projectId} />
            </CardContent>
          </Card>

          <SessionList projectId={projectId} />
        </div>

        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <AskAI projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
