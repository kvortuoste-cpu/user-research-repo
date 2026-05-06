"use client";

import { useState } from "react";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { db, type Sentiment } from "@/lib/db";
import {
  transcribeFile,
  type TranscribeProgress,
} from "@/lib/transcribe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

export function UploadSession({ projectId, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [participantInfo, setParticipantInfo] = useState("");
  const [transcript, setTranscript] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [transcribing, setTranscribing] = useState(false);
  const [transcribeStatus, setTranscribeStatus] =
    useState<TranscribeProgress | null>(null);

  function reset() {
    setTitle("");
    setParticipantInfo("");
    setTranscript("");
    setVideo(null);
    setError(null);
    setTranscribeStatus(null);
  }

  async function handleTranscribe() {
    if (!video || transcribing) return;
    setTranscribing(true);
    setError(null);
    setTranscribeStatus({ stage: "loading-model", progressPct: 0 });

    try {
      const text = await transcribeFile(video, (p) => setTranscribeStatus(p));
      setTranscript(text);
      toast.success("Transcription complete");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transcription failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setTranscribing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !transcript.trim()) {
      setError("Title and transcript are required");
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analyze", transcript }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Analysis failed (${res.status})`);
      }
      const result = (await res.json()) as AnalyzeResponse;

      const videoUrl = video ? URL.createObjectURL(video) : undefined;
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
        videoUrl,
        notes: "",
        createdAt: now,
        updatedAt: now,
      });

      toast.success("Session analyzed and saved");
      reset();
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  }

  const busy = analyzing || transcribing;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Onboarding Study - User 3"
          disabled={busy}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="participant">Participant info (optional)</Label>
        <Input
          id="participant"
          value={participantInfo}
          onChange={(e) => setParticipantInfo(e.target.value)}
          placeholder="e.g. Sarah, 34, Marketing Manager"
          disabled={busy}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="video">Video / audio (optional)</Label>
        <Input
          id="video"
          type="file"
          accept="video/*,audio/*"
          onChange={(e) => {
            setVideo(e.target.files?.[0] ?? null);
            setTranscribeStatus(null);
          }}
          disabled={busy}
        />
        {video && (
          <div className="flex items-center justify-between gap-2 rounded-md border bg-neutral-50 px-3 py-2">
            <div className="text-xs text-neutral-700 truncate">
              {video.name} · {(video.size / 1024 / 1024).toFixed(1)} MB
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleTranscribe}
              disabled={busy}
            >
              {transcribing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {transcribing ? "Transcribing..." : "Transcribe with Whisper"}
            </Button>
          </div>
        )}
        {transcribeStatus && transcribeStatus.stage !== "done" && (
          <div className="rounded-md border bg-blue-50 border-blue-200 px-3 py-2 space-y-1.5">
            <div className="text-xs text-blue-900">
              {transcribeStatus.message}
            </div>
            {transcribeStatus.progressPct !== undefined && (
              <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${transcribeStatus.progressPct}%` }}
                />
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-neutral-500">
          Whisper runs entirely in your browser. First use downloads the model
          (~290MB, cached locally after).
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="transcript">Transcript *</Label>
        <Textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste a transcript, or upload a video/audio above and click Transcribe."
          rows={10}
          className="font-mono text-xs"
          disabled={busy}
          required
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={busy} className="w-full">
        {analyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing with Claude...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload &amp; analyze
          </>
        )}
      </Button>
    </form>
  );
}
