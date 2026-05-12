"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { ProjectCard } from "@/components/ProjectCard";
import { CreateProject } from "@/components/CreateProject";
import { ExportData } from "@/components/ExportData";
import { AskAIDashboard } from "@/components/AskAIDashboard";
import { ProjectsNav } from "@/components/ProjectsNav";
import { SkeletonBox } from "@primer/react";
import { useNav } from "@/components/NavContext";

const AI_PANEL_WIDTH = 360;
const NAV_PANEL_WIDTH = 260;
const BASE_PADDING = 48;

export default function Home() {
  const [aiOpen, setAiOpen] = useState(true);
  const { isOpen: navOpen } = useNav();

  const projects = useLiveQuery(() =>
    db.projects.orderBy("createdAt").reverse().toArray(),
  );

  return (
    <>
      <div
        className="py-10 flex flex-col gap-8 transition-[padding] duration-200"
        style={{
          paddingLeft: navOpen ? `${NAV_PANEL_WIDTH + BASE_PADDING}px` : `${BASE_PADDING}px`,
          paddingRight: aiOpen ? `${AI_PANEL_WIDTH + BASE_PADDING}px` : `${BASE_PADDING}px`,
        }}
      >
        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="text-sm text-[#6d6d6f] mt-1">
              Group research sessions by initiative, study, or quarter.
            </p>
          </div>
          <ExportData />
        </div>

        {/* Projects grid */}
        {projects === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <SkeletonBox key={i} height="160px" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <CreateProject />
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
            {projects.length === 0 && (
              <p className="text-center text-sm text-[#6d6d6f]">
                No projects yet. Create your first one above.
              </p>
            )}
          </>
        )}
      </div>

      <ProjectsNav />
      <AskAIDashboard isOpen={aiOpen} onToggle={() => setAiOpen((o) => !o)} />
    </>
  );
}
