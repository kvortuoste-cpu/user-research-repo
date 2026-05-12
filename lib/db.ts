import Dexie, { type Table } from "dexie";

export interface Project {
  id?: number;
  name: string;
  description?: string;
  conductedBy?: string;
  createdAt: Date;
}

export type Sentiment = "positive" | "negative" | "neutral" | "mixed";

export type AttachmentKind = "video" | "audio" | "pdf" | "excel" | "csv" | "docx";

export interface Attachment {
  id: string;
  name: string;
  kind: AttachmentKind;
  url: string;        // blob URL — survives the session but not a page reload
  size: number;       // bytes
  extractedText?: string;
  htmlContent?: string; // mammoth HTML output for .docx preview
}

export interface ResearchSession {
  id?: number;
  projectId: number;
  title: string;
  transcript: string;
  summary: string;
  keyFindings: string[];
  tags: string[];
  sentiment: Sentiment;
  participantInfo?: string;
  /** @deprecated use attachments instead — kept for backwards compat with v1 data */
  videoUrl?: string;
  attachments?: Attachment[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AskAIMessage {
  id?: number;
  projectId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export class ResearchDB extends Dexie {
  projects!: Table<Project, number>;
  sessions!: Table<ResearchSession, number>;
  askAIMessages!: Table<AskAIMessage, number>;

  constructor() {
    super("ResearchRepositoryPOC");
    this.version(1).stores({
      projects: "++id, createdAt",
      sessions: "++id, projectId, createdAt, sentiment",
      askAIMessages: "++id, projectId, createdAt",
    });
    // Version 2: adds attachments[] to sessions (non-indexed, no migration needed)
    this.version(2).stores({
      projects: "++id, createdAt",
      sessions: "++id, projectId, createdAt, sentiment",
      askAIMessages: "++id, projectId, createdAt",
    });
  }
}

export const db = new ResearchDB();
