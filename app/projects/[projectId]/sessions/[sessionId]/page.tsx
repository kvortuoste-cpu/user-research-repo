"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { FileSpreadsheet, FileText, FileVideo, FileAudio, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db, type Attachment, type Sentiment } from "@/lib/db";
import { Breadcrumbs, Button, Dialog, Label, Spinner, Textarea, Token } from "@primer/react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sentimentVariant: Record<Sentiment, "primary" | "danger" | "secondary" | "attention"> = {
  positive: "primary",
  negative: "danger",
  neutral: "secondary",
  mixed: "attention",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function AttachmentIcon({ kind }: { kind: Attachment["kind"] }) {
  if (kind === "pdf")
    return <span className="inline-flex items-center justify-center rounded px-1 text-[10px] font-bold text-white bg-red-500">PDF</span>;
  if (kind === "docx")
    return <span className="inline-flex items-center justify-center rounded px-1 text-[10px] font-bold text-white bg-blue-600">DOC</span>;
  if (kind === "excel" || kind === "csv")
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  if (kind === "video") return <FileVideo className="h-4 w-4 text-[#1460aa]" />;
  if (kind === "audio") return <FileAudio className="h-4 w-4 text-purple-500" />;
  return <FileText className="h-4 w-4 text-[#6d6d6f]" />;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#e2e3e5] rounded-lg overflow-hidden bg-white">
      <div className="px-4 py-2.5 border-b border-[#e2e3e5] bg-[#f6f6f6]">
        <span className="text-sm font-semibold">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Attachment preview dialog ────────────────────────────────────────────────

function AttachmentPreview({
  attachment,
  onClose,
}: {
  attachment: Attachment;
  onClose: () => void;
}) {
  const isPdf = attachment.kind === "pdf";
  const isDocx = attachment.kind === "docx";
  const hasUrl = !!attachment.url;

  return (
    <Dialog
      onClose={onClose}
      title={attachment.name}
      width="xlarge"
    >
      <Dialog.Body>
        {/* PDF: iframe preview if blob URL is still alive */}
        {isPdf && hasUrl && (
          <div className="flex flex-col gap-2">
            <iframe
              src={attachment.url}
              className="w-full rounded border border-[#e2e3e5]"
              style={{ height: "60vh" }}
              title={attachment.name}
            />
            <p className="text-xs text-[#a3a4a6]">
              PDF preview is only available during this browser session.
            </p>
          </div>
        )}
        {isPdf && !hasUrl && attachment.extractedText && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[#a3a4a6] mb-2">
              The original file is no longer available (blob URLs reset on page reload). Showing extracted text instead.
            </p>
            <pre className="text-xs font-mono whitespace-pre-wrap bg-[#f6f6f6] border border-[#e2e3e5] rounded-md p-3 max-h-[60vh] overflow-y-auto">
              {attachment.extractedText}
            </pre>
          </div>
        )}

        {/* DOCX: render mammoth HTML, fall back to plain text */}
        {isDocx && attachment.htmlContent && (
          <div
            className="prose prose-sm max-w-none max-h-[60vh] overflow-y-auto p-1"
            dangerouslySetInnerHTML={{ __html: attachment.htmlContent }}
          />
        )}
        {isDocx && !attachment.htmlContent && attachment.extractedText && (
          <pre className="text-xs font-mono whitespace-pre-wrap bg-[#f6f6f6] border border-[#e2e3e5] rounded-md p-3 max-h-[60vh] overflow-y-auto">
            {attachment.extractedText}
          </pre>
        )}

        {/* Excel / CSV: extracted text */}
        {(attachment.kind === "excel" || attachment.kind === "csv") && attachment.extractedText && (
          <pre className="text-xs font-mono whitespace-pre-wrap bg-[#f6f6f6] border border-[#e2e3e5] rounded-md p-3 max-h-[60vh] overflow-y-auto">
            {attachment.extractedText}
          </pre>
        )}

        {/* Fallback */}
        {!attachment.extractedText && !attachment.htmlContent && !hasUrl && (
          <p className="text-sm text-[#6d6d6f]">No preview available.</p>
        )}
      </Dialog.Body>

      {/* Open in new tab button for PDF when URL is live */}
      {isPdf && hasUrl && (
        <Dialog.Footer>
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[#1460aa] hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in new tab
          </a>
        </Dialog.Footer>
      )}
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string; sessionId: string }>();
  const projectId = Number(params.projectId);
  const sessionId = Number(params.sessionId);

  const project = useLiveQuery(
    () => (Number.isFinite(projectId) ? db.projects.get(projectId) : undefined),
    [projectId],
  );
  const session = useLiveQuery(
    () => (Number.isFinite(sessionId) ? db.sessions.get(sessionId) : undefined),
    [sessionId],
  );

  const [notes, setNotes] = useState("");
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (session && !notesLoaded) {
      setNotes(session.notes ?? "");
      setNotesLoaded(true);
    }
  }, [session, notesLoaded]);

  async function saveNotes() {
    if (!session?.id) return;
    await db.sessions.update(session.id, { notes, updatedAt: new Date() });
    toast.success("Notes saved");
  }

  async function handleDelete() {
    if (!session?.id) return;
    setDeleting(true);
    await db.sessions.delete(session.id);
    toast.success("Session deleted");
    router.push(`/projects/${projectId}`);
  }

  if (session === undefined || project === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-12 py-10">
        <p className="text-sm text-[#6d6d6f]">Loading...</p>
      </div>
    );
  }

  if (!session || !project) {
    return (
      <div className="max-w-4xl mx-auto px-12 py-10">
        <p className="text-sm text-[#6d6d6f]">
          Session not found.{" "}
          <Link href={`/projects/${projectId}`} style={{ color: "#1460aa" }}>Back to project</Link>
        </p>
      </div>
    );
  }

  const attachments = session.attachments ?? [];
  const videoAttachment =
    attachments.find((a) => a.kind === "video" || a.kind === "audio") ??
    (session.videoUrl ? { id: "legacy", name: "Recording", kind: "video" as const, url: session.videoUrl, size: 0 } : null);
  const otherAttachments = attachments.filter((a) => a.kind !== "video" && a.kind !== "audio");

  return (
    <div className="max-w-4xl mx-auto px-12 py-8 flex flex-col gap-6">
      {/* Breadcrumb */}
      <Breadcrumbs>
        <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href={`/projects/${projectId}`}>{project.name}</Breadcrumbs.Item>
        <Breadcrumbs.Item selected>{session.title}</Breadcrumbs.Item>
      </Breadcrumbs>

      {/* Title + sentiment */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1
            className="text-2xl font-bold m-0"
            style={{ fontFamily: "var(--ac-font-family-display)" }}
          >
            {session.title}
          </h1>
          {session.participantInfo && (
            <p className="text-sm text-[#6d6d6f]">{session.participantInfo}</p>
          )}
          <p className="text-xs text-[#a3a4a6]">
            {new Date(session.createdAt).toLocaleString()}
          </p>
        </div>
        <Label variant={sentimentVariant[session.sentiment]}>
          {session.sentiment.charAt(0).toUpperCase() + session.sentiment.slice(1)}
        </Label>
      </div>

      {/* Tags */}
      {session.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {session.tags.map((tag) => (
            <Token key={tag} text={tag} size="small" />
          ))}
        </div>
      )}

      {/* Summary */}
      <SectionCard title="Summary">
        <div className="p-4">
          <p className="text-sm leading-relaxed text-[#1c1c1e]">
            {session.summary || "No summary generated."}
          </p>
        </div>
      </SectionCard>

      {/* Key findings */}
      {session.keyFindings.length > 0 && (
        <SectionCard title="Key findings">
          <div className="p-4">
            <ol className="m-0 pl-5 flex flex-col gap-1 list-decimal">
              {session.keyFindings.map((f, i) => (
                <li key={i} className="text-sm leading-relaxed text-[#1c1c1e]">{f}</li>
              ))}
            </ol>
          </div>
        </SectionCard>
      )}

      {/* Recording & Transcript */}
      <SectionCard title="Recording &amp; Transcript">
        {videoAttachment ? (
          <div className="p-4 flex flex-col gap-3">
            <video
              src={videoAttachment.url}
              controls
              className="w-full rounded-md"
              onError={() => {}}
            />
            <p className="text-xs text-[#a3a4a6]">
              Video is held in browser memory — it resets on page reload.
            </p>
          </div>
        ) : null}
        {session.transcript ? (
          <div className={videoAttachment ? "border-t border-[#e2e3e5] p-4" : "p-4"}>
            <pre className="text-xs font-mono whitespace-pre-wrap bg-[#f6f6f6] border border-[#e2e3e5] rounded-md p-3 max-h-96 overflow-y-auto m-0">
              {session.transcript}
            </pre>
          </div>
        ) : !videoAttachment ? (
          <div className="p-4">
            <p className="text-sm text-[#a3a4a6] italic">No recording or transcript for this session.</p>
          </div>
        ) : null}
      </SectionCard>

      {/* Other attachments — PDFs, DOCX, Excel, CSV */}
      {otherAttachments.length > 0 && (
        <SectionCard title="Attachments">
          <div className="divide-y divide-[#e2e3e5]">
            {otherAttachments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="shrink-0 w-6 flex items-center justify-center">
                  <AttachmentIcon kind={a.kind} />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Clickable filename → opens preview dialog */}
                  <button
                    type="button"
                    onClick={() => setPreviewAttachment(a)}
                    className="text-sm font-medium text-[#1460aa] hover:underline truncate block text-left"
                  >
                    {a.name}
                  </button>
                  <p className="text-xs text-[#6d6d6f]">{formatBytes(a.size)}</p>
                </div>
                {/* Download button */}
                {a.url && (
                  <a
                    href={a.url}
                    download={a.name}
                    className="shrink-0 text-xs text-[#1460aa] hover:underline"
                  >
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Researcher notes */}
      <SectionCard title="Researcher notes">
        <div className="p-4 flex flex-col gap-1">
          <Textarea
            block
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Add your own observations, decisions, follow-ups…"
            rows={4}
          />
          <p className="text-xs text-[#a3a4a6]">Auto-saves when you click outside.</p>
        </div>
      </SectionCard>

      {/* Delete */}
      <div className="border-t border-[#e2e3e5] pt-4 flex justify-end">
        <Button
          ref={deleteRef}
          variant="danger"
          size="small"
          onClick={() => setDeleteOpen(true)}
          leadingVisual={() => <Trash2 className="h-4 w-4" />}
        >
          Delete session
        </Button>

        {deleteOpen && (
          <Dialog
            returnFocusRef={deleteRef}
            onClose={() => setDeleteOpen(false)}
            title="Delete this session?"
          >
            <Dialog.Body>
              <p className="text-sm text-[#1c1c1e]">
                This permanently removes the transcript, summary, findings, and notes for{" "}
                <strong>&quot;{session.title}&quot;</strong>. This cannot be undone.
              </p>
            </Dialog.Body>
            <Dialog.Footer>
              <div className="flex gap-2 justify-end">
                <Button variant="default" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Spinner size="small" /> : "Delete"}
                </Button>
              </div>
            </Dialog.Footer>
          </Dialog>
        )}
      </div>

      {/* Attachment preview dialog */}
      {previewAttachment && (
        <AttachmentPreview
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      )}
    </div>
  );
}
