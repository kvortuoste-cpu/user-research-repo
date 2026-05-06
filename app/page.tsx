"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { ProjectCard } from "@/components/ProjectCard";
import { CreateProject } from "@/components/CreateProject";
import { ExportData } from "@/components/ExportData";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const projects = useLiveQuery(() =>
    db.projects.orderBy("createdAt").reverse().toArray(),
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Group research sessions by initiative, study, or quarter.
          </p>
        </div>
        <ExportData />
      </div>

      {projects === undefined ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CreateProject />
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {projects?.length === 0 && (
        <p className="mt-8 text-center text-sm text-neutral-500">
          No projects yet. Create your first one above.
        </p>
      )}
    </div>
  );
}
