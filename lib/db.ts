import Dexie, { type Table } from "dexie";

export interface Project {
  id?: number;
  name: string;
  description?: string;
  owner?: string;
  createdAt: Date;
}

export type Sentiment = "positive" | "negative" | "neutral" | "mixed";

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
  videoUrl?: string;
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
  }
}

export const db = new ResearchDB();
