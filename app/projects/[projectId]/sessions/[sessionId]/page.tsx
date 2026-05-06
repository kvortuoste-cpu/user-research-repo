"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db, type Sentiment } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const sentimentColor: Record<Sentiment, string> = {
  positive: "bg-green-500",
  negative: "bg-red-500",
  neutral: "bg-neutral-400",
  mixed: "bg-amber-500",
};

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

  useEffect(() => {
    if (session && !notesLoaded) {
      setNotes(session.notes ?? "");
      setNotesLoaded(true);
    }
  }, [session, notesLoaded]);

  async function saveNotes() {
    if (!session?.id) return;
    await db.sessions.update(session.id, {
      notes,
      updatedAt: new Date(),
    });
    toast.success("Notes saved");
  }

  async function handleDelete() {
    if (!session?.id) return;
    await db.sessions.delete(session.id);
    toast.success("Session deleted");
    router.push(`/projects/${projectId}`);
  }

  if (session === undefined || project === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 text-sm text-neutral-500">
        Loading...
      </div>
    );
  }

  if (!session || !project) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-sm text-neutral-600">
          Session not found.{" "}
          <Link
            href={`/projects/${projectId}`}
            className="text-blue-600 underline"
          >
            Back to project
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <nav className="flex items-center text-xs text-neutral-500">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 mx-1" />
        <Link
          href={`/projects/${projectId}`}
          className="hover:text-blue-600"
        >
          {project.name}
        </Link>
        <ChevronRight className="h-3 w-3 mx-1" />
        <span className="text-neutral-900 font-medium line-clamp-1">
          {session.title}
        </span>
      </nav>

      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {session.title}
            </h1>
            {session.participantInfo && (
              <p className="text-sm text-neutral-600">
                {session.participantInfo}
              </p>
            )}
            <p className="text-xs text-neutral-500">
              {new Date(session.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${sentimentColor[session.sentiment]}`}
            />
            <span className="text-sm capitalize">{session.sentiment}</span>
          </div>
        </div>
      </div>

      {session.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {session.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-neutral-800">
            {session.summary || "No summary generated."}
          </p>
        </CardContent>
      </Card>

      {session.keyFindings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key findings</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 list-decimal list-inside text-sm leading-relaxed">
              {session.keyFindings.map((f, i) => (
                <li key={i} className="text-neutral-800">
                  {f}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {session.videoUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recording</CardTitle>
          </CardHeader>
          <CardContent>
            <video
              src={session.videoUrl}
              controls
              className="w-full rounded"
              onError={() => {
                /* blob URLs don't survive page reload */
              }}
            />
            <p className="text-xs text-neutral-500 mt-2">
              Note: video is held in browser memory and resets on page reload.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Researcher notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Add your own observations, decisions, follow-ups..."
            rows={4}
          />
          <p className="text-xs text-neutral-500 mt-2">
            Auto-saves when you click outside.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Full transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs font-mono whitespace-pre-wrap bg-neutral-50 border rounded p-4 max-h-96 overflow-y-auto">
            {session.transcript}
          </pre>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-red-600">
              <Trash2 className="h-4 w-4" />
              Delete session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this session?</DialogTitle>
              <DialogDescription>
                This permanently removes the transcript, summary, findings, and
                notes for &quot;{session.title}&quot;. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
