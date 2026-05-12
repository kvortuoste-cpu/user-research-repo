"use client";

import { useCallback, useRef, useState } from "react";
import {
  CloudUpload,
  FileText,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import { db, type Attachment, type AttachmentKind, type Sentiment } from "@/lib/db";
import { transcribeFile } from "@/lib/transcribe";
import { extractPdfText, extractSheetText, extractDocxContent } from "@/lib/parseFile";
import { Button, Flash, FormControl, Spinner, TextInput } from "@primer/react";

// ─── Types ───────────────────────────────────────────────────────────────────

type FileStatus = "processing" | "done" | "error";

interface FileEntry {
  id: string;
  file: File;
  kind: AttachmentKind;
  status: FileStatus;
  statusMessage: string;
  progress?: number; // 0–100 for transcription progress
  url?: string;
  extractedText?: string;
  htmlContent?: string; // docx HTML preview
}

interface AnalyzeResponse {
  summary: string;
  keyFindings: string[];
  tags: string[];
  sentiment: Sentiment;
}

interface Props {
  projectId: number;
  onSuccess?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectKind(file: File): AttachmentKind | null {
  const name = file.name.toLowerCase();
  const type = file.type;
  if (type.startsWith("video/") || /\.(mp4|mov|avi|mkv|webm)$/.test(name)) return "video";
  if (type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|flac)$/.test(name)) return "audio";
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (type === "text/csv" || name.endsWith(".csv")) return "csv";
  if (type.includes("spreadsheet") || type.includes("excel") || /\.(xlsx|xls|ods)$/.test(name)) return "excel";
  if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || name.endsWith(".docx")) return "docx";
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const KIND_LABEL: Record<AttachmentKind, string> = {
  video: "Video",
  audio: "Audio",
  pdf: "PDF",
  excel: "Excel",
  csv: "CSV",
  docx: "Word",
};

function FileIcon({ kind, className }: { kind: AttachmentKind; className?: string }) {
  if (kind === "pdf")
    return (
      <span className={`inline-flex items-center justify-center rounded px-1 text-[10px] font-bold text-white bg-red-500 ${className ?? ""}`}>
        PDF
      </span>
    );
  if (kind === "docx")
    return (
      <span className={`inline-flex items-center justify-center rounded px-1 text-[10px] font-bold text-white bg-blue-600 ${className ?? ""}`}>
        DOC
      </span>
    );
  if (kind === "excel" || kind === "csv")
    return <FileSpreadsheet className={`text-green-600 ${className ?? ""}`} />;
  if (kind === "video") return <FileVideo className={`text-[#1460aa] ${className ?? ""}`} />;
  if (kind === "audio") return <FileAudio className={`text-purple-500 ${className ?? ""}`} />;
  return <FileText className={`text-[#6d6d6f] ${className ?? ""}`} />;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function UploadSession({ projectId, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [participantInfo, setParticipantInfo] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── File processing ──

  function updateEntry(id: string, patch: Partial<FileEntry>) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  async function processFile(entry: FileEntry) {
    try {
      if (entry.kind === "video" || entry.kind === "audio") {
        updateEntry(entry.id, { status: "processing", statusMessage: "Transcribing…" });
        const text = await transcribeFile(entry.file, (p) => {
          updateEntry(entry.id, {
            progress: p.progressPct,
            statusMessage: p.message ?? "Transcribing…",
          });
        });
        updateEntry(entry.id, {
          status: "done",
          statusMessage: "Transcribed",
          extractedText: text,
          url: URL.createObjectURL(entry.file),
          progress: 100,
        });
      } else if (entry.kind === "pdf") {
        updateEntry(entry.id, { status: "processing", statusMessage: "Extracting text…" });
        const text = await extractPdfText(entry.file);
        updateEntry(entry.id, {
          status: "done",
          statusMessage: "Text extracted",
          extractedText: text,
          url: URL.createObjectURL(entry.file),
        });
      } else if (entry.kind === "docx") {
        updateEntry(entry.id, { status: "processing", statusMessage: "Extracting text…" });
        const { text, html } = await extractDocxContent(entry.file);
        updateEntry(entry.id, {
          status: "done",
          statusMessage: "Text extracted",
          extractedText: text,
          htmlContent: html,
          url: URL.createObjectURL(entry.file),
        });
      } else {
        updateEntry(entry.id, { status: "processing", statusMessage: "Parsing…" });
        const text = await extractSheetText(entry.file);
        updateEntry(entry.id, {
          status: "done",
          statusMessage: "Parsed",
          extractedText: text,
          url: URL.createObjectURL(entry.file),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      updateEntry(entry.id, { status: "error", statusMessage: msg });
    }
  }

  function addFiles(incoming: File[]) {
    const newEntries: FileEntry[] = [];
    for (const file of incoming) {
      const kind = detectKind(file);
      if (!kind) {
        toast.error(`Unsupported file type: ${file.name}`);
        continue;
      }
      const entry: FileEntry = {
        id: uuid(),
        file,
        kind,
        status: "processing",
        statusMessage: "Starting…",
      };
      newEntries.push(entry);
    }
    if (newEntries.length === 0) return;
    setFiles((prev) => [...prev, ...newEntries]);
    for (const entry of newEntries) processFile(entry);
  }

  // ── Drag & drop ──

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function onDragLeave() { setDragging(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = "";
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ──

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Title is required"); return; }
    if (files.length === 0) { setError("Add at least one file"); return; }
    if (files.some((f) => f.status === "processing")) {
      setError("Wait for all files to finish processing"); return;
    }
    if (files.every((f) => f.status === "error")) {
      setError("All files failed to process"); return;
    }

    setAnalyzing(true);
    try {
      const done = files.filter((f) => f.status === "done");

      // Primary transcript: first video/audio transcription
      const videoEntry = done.find((f) => f.kind === "video" || f.kind === "audio");
      const transcript = videoEntry?.extractedText ?? "";

      // Attachment texts for non-video files
      const attachmentTexts = done
        .filter((f) => f.kind !== "video" && f.kind !== "audio" && f.extractedText)
        .map((f) => `[${f.file.name}]\n${f.extractedText}`);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analyze", transcript, attachmentTexts }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Analysis failed (${res.status})`);
      }
      const result = (await res.json()) as AnalyzeResponse;

      // Build attachments array for DB
      const attachments: Attachment[] = done.map((f) => ({
        id: f.id,
        name: f.file.name,
        kind: f.kind,
        url: f.url ?? "",
        size: f.file.size,
        extractedText: f.extractedText,
        htmlContent: f.htmlContent,
      }));

      const now = new Date();
      await db.sessions.add({
        projectId,
        title: title.trim(),
        participantInfo: participantInfo.trim() || undefined,
        transcript,
        summary: result.summary,
        keyFindings: result.keyFindings ?? [],
        tags: (result.tags ?? []).map((t) => t.toLowerCase()),
        sentiment: result.sentiment ?? "neutral",
        attachments,
        notes: "",
        createdAt: now,
        updatedAt: now,
      });

      toast.success("Session analyzed and saved");
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  }

  const allDone = files.length > 0 && files.every((f) => f.status !== "processing");
  const hasError = files.some((f) => f.status === "error");

  // ── Render ──

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Title + participant */}
      <div className="flex flex-col gap-3">
        <FormControl required>
          <FormControl.Label>Session title</FormControl.Label>
          <TextInput
            block
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Onboarding Study – User 3"
            disabled={analyzing}
          />
        </FormControl>
        <FormControl>
          <FormControl.Label>
            Participant info{" "}
            <span className="text-[#6d6d6f] font-normal">(optional)</span>
          </FormControl.Label>
          <TextInput
            block
            value={participantInfo}
            onChange={(e) => setParticipantInfo(e.target.value)}
            placeholder="e.g. Sarah, 34, Marketing Manager"
            disabled={analyzing}
          />
        </FormControl>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${
          dragging
            ? "border-[#1460aa] bg-[#f0f5ff]"
            : "border-[#d0d0d2] bg-[#fafafa] hover:border-[#1460aa] hover:bg-[#f7f9ff]"
        }`}
      >
        <CloudUpload className="h-9 w-9 text-[#a3a4a6]" />
        <div className="text-center">
          <p className="text-sm font-medium text-[#1c1c1e]">
            Choose files or drag &amp; drop here
          </p>
          <p className="text-xs text-[#6d6d6f] mt-1">
            MP4, MOV, MP3, PDF, DOCX, XLSX, CSV — up to 2 GB
          </p>
        </div>
        <button
          type="button"
          className="mt-1 px-4 py-1.5 rounded-md border border-[#d0d0d2] bg-white text-sm font-medium text-[#1c1c1e] hover:bg-[#f6f6f6] transition-colors"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          Browse Files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="video/*,audio/*,.pdf,.docx,.xlsx,.xls,.ods,.csv"
          className="hidden"
          onChange={onFileInput}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-lg border border-[#e2e3e5] bg-white px-3 py-2.5"
            >
              {/* Icon */}
              <div className="shrink-0 w-8 flex items-center justify-center">
                <FileIcon kind={entry.kind} className="h-5 w-5" />
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1c1c1e] truncate">{entry.file.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-[#6d6d6f]">{formatBytes(entry.file.size)}</span>
                  <span className="text-xs text-[#a3a4a6]">·</span>
                  {entry.status === "processing" && (
                    <span className="text-xs text-[#1460aa] flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {entry.statusMessage}
                    </span>
                  )}
                  {entry.status === "done" && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {entry.statusMessage}
                    </span>
                  )}
                  {entry.status === "error" && (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {entry.statusMessage}
                    </span>
                  )}
                </div>
                {/* Transcription progress bar */}
                {entry.status === "processing" && entry.progress !== undefined && (
                  <div className="mt-1.5 h-1 w-full rounded-full bg-[#e2e3e5] overflow-hidden">
                    <div
                      className="h-full bg-[#1460aa] rounded-full transition-all duration-300"
                      style={{ width: `${entry.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Kind badge */}
              <span className="shrink-0 text-xs text-[#6d6d6f] bg-[#f6f6f6] border border-[#e2e3e5] rounded px-1.5 py-0.5">
                {KIND_LABEL[entry.kind]}
              </span>

              {/* Remove */}
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((f) => f.id !== entry.id))}
                className="shrink-0 p-1 rounded text-[#a3a4a6] hover:text-[#1c1c1e] hover:bg-[#f6f6f6] transition-colors"
                aria-label={`Remove ${entry.file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <Flash variant="danger">{error}</Flash>}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        disabled={analyzing || !allDone || !title.trim() || hasError}
        block
        leadingVisual={() => analyzing ? <Spinner size="small" /> : undefined}
      >
        {analyzing ? "Analyzing with Claude…" : "Upload & analyze"}
      </Button>
    </form>
  );
}
