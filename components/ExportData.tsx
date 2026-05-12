"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { Button } from "@primer/react";

export function ExportData() {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const [projects, sessions, askAIMessages] = await Promise.all([
        db.projects.toArray(),
        db.sessions.toArray(),
        db.askAIMessages.toArray(),
      ]);
      const data = {
        exportedAt: new Date().toISOString(),
        projects,
        sessions: sessions.map((s) => ({ ...s, videoUrl: undefined })),
        askAIMessages,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `research-repo-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Data exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="default"
      size="small"
      onClick={handleExport}
      disabled={busy}
      leadingVisual={() => <Download className="h-3.5 w-3.5" />}
    >
      {busy ? "Exporting..." : "Export all data"}
    </Button>
  );
}
