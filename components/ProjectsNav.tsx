"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useNav } from "@/components/NavContext";

interface Props {
  currentProjectId?: number;
}

const PANEL_WIDTH = 260;

export function ProjectsNav({ currentProjectId }: Props) {
  const { isOpen, toggle } = useNav();

  const projects = useLiveQuery(() =>
    db.projects.orderBy("createdAt").reverse().toArray(),
  );

  return (
    <div
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col bg-white border-r border-[#e2e3e5] shadow-2xl transition-transform duration-200 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ width: PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e2e3e5] flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold">Projects</span>
        <button
          onClick={toggle}
          aria-label="Close projects list"
          className="ml-auto p-1 rounded text-[#6d6d6f] hover:text-black hover:bg-[#f0f0f0] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto py-2">
        {projects === undefined ? (
          <div className="px-4 py-3 text-sm text-[#6d6d6f]">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="px-4 py-3 text-sm text-[#6d6d6f]">No projects yet.</div>
        ) : (
          projects.map((p) => {
            const isCurrent = p.id === currentProjectId;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className={`flex flex-col gap-0.5 px-4 py-3 text-sm transition-colors border-l-2 ${
                  isCurrent
                    ? "bg-[#f0f5ff] border-l-[#1460aa] text-[#1460aa] font-medium"
                    : "border-l-transparent text-[#1c1c1e] hover:bg-[#f6f6f6] hover:border-l-[#c9cacc]"
                }`}
              >
                <span className="truncate">{p.name}</span>
                {p.description && (
                  <span className="text-xs text-[#6d6d6f] truncate font-normal">{p.description}</span>
                )}
              </Link>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#e2e3e5] p-3 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-[#1460aa] hover:underline"
        >
          ← All projects
        </Link>
      </div>
    </div>
  );
}
