"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNav } from "@/components/NavContext";
import { Calendar, User } from "lucide-react";
import { db } from "@/lib/db";
import { SessionList } from "@/components/SessionList";
import { AskAI } from "@/components/AskAI";
import { ProjectsNav } from "@/components/ProjectsNav";
import { EditProject } from "@/components/EditProject";
import { SessionSummary } from "@/components/SessionSummary";
import { NewSessionModal } from "@/components/NewSessionModal";
import { Breadcrumbs } from "@primer/react";

const AI_PANEL_WIDTH = 360;
const NAV_PANEL_WIDTH = 260;
const BASE_PADDING = 48;

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Number(params.projectId);
  const [aiOpen, setAiOpen] = useState(true);
  const { isOpen: navOpen } = useNav();

  const project = useLiveQuery(
    () => (Number.isFinite(projectId) ? db.projects.get(projectId) : undefined),
    [projectId],
  );

  if (project === undefined) {
    return (
      <div className="mx-auto px-6 py-10" style={{ maxWidth: 960 }}>
        <p className="text-sm text-[#6d6d6f]">Loading...</p>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="mx-auto px-6 py-10" style={{ maxWidth: 960 }}>
        <p className="text-sm text-[#6d6d6f]">
          Project not found.{" "}
          <Link href="/" style={{ color: "#1460aa" }}>Back to projects</Link>
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Main content — shifts padding based on which panels are open */}
      <div
        className="py-8 flex flex-col gap-6 transition-[padding] duration-200"
        style={{
          paddingLeft: navOpen ? `${NAV_PANEL_WIDTH + BASE_PADDING}px` : `${BASE_PADDING}px`,
          paddingRight: aiOpen ? `${AI_PANEL_WIDTH + BASE_PADDING}px` : `${BASE_PADDING}px`,
        }}
      >
        {/* Breadcrumb */}
        <Breadcrumbs>
          <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
          <Breadcrumbs.Item selected>{project.name}</Breadcrumbs.Item>
        </Breadcrumbs>

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              className="text-2xl font-bold m-0"
              style={{ fontFamily: "var(--ac-font-family-display)" }}
            >
              {project.name}
            </h1>
            <EditProject project={project} />
          </div>

          {project.description && (
            <p className="text-sm text-[#6d6d6f]">{project.description}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
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
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-[#a3a4a6]" />
                <span className="text-xs text-[#6d6d6f]">Conducted by {project.conductedBy}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-[#c9cacc]" />
                <span className="text-xs text-[#a3a4a6] italic">Conducted by — unspecified</span>
              </div>
            )}
          </div>
        </div>

        {/* Session Summary */}
        <SessionSummary projectId={projectId} />

        {/* New Session button */}
        <div>
          <NewSessionModal projectId={projectId} />
        </div>

        {/* Sessions List */}
        <SessionList projectId={projectId} />
      </div>

      {/* Left: Projects nav panel */}
      <ProjectsNav currentProjectId={projectId} />

      {/* Right: Ask AI panel */}
      <AskAI
        projectId={projectId}
        isOpen={aiOpen}
        onToggle={() => setAiOpen((o) => !o)}
      />
    </>
  );
}
