import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-4-5";

interface AnalyzeBody {
  type: "analyze";
  transcript: string;
  attachmentTexts?: string[];
}

interface AskBody {
  type: "ask";
  query: string;
  transcripts: string[];
}

interface ProjectSummary {
  name: string;
  description?: string;
  sessionCount: number;
  participantCount: number;
  dateRange: string;
  keyFindings: string[];
}

interface AskCrossProjectBody {
  type: "ask-cross-project";
  query: string;
  projectSummaries: ProjectSummary[];
}

type RequestBody = AnalyzeBody | AskBody | AskCrossProjectBody;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    if (body.type === "analyze") {
      const truncated = body.transcript.substring(0, 5000);
      const attachmentSection = (body.attachmentTexts ?? [])
        .map((t, i) => `[Attachment ${i + 1}]\n${t.substring(0, 2000)}`)
        .join("\n\n");
      const fullContext = [
        truncated && `Transcript:\n${truncated}`,
        attachmentSection && `Attachments:\n${attachmentSection}`,
      ]
        .filter(Boolean)
        .join("\n\n---\n\n");

      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are a senior UX research analyst. Analyze this research session content and return a JSON object.

Return ONLY valid JSON. No markdown, no explanation, just the raw JSON object.

Required format:
{
  "summary": "2-3 sentence summary of the most important insights from this session",
  "keyFindings": ["Finding 1 as a complete sentence", "Finding 2 as a complete sentence", "Finding 3 as a complete sentence"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "sentiment": "positive | negative | neutral | mixed"
}

Rules:
- summary: 2-3 sentences, focus on what the user revealed about their experience
- keyFindings: 3-5 items, each a standalone insight a PM or designer could act on
- tags: 5-8 lowercase tags from this list or similar: pain_point, feature_request, onboarding, navigation, trust, confusion, delight, workaround, expectation_gap, competitor_mention, pricing, performance
- sentiment: overall emotional tone of the participant
- Use ALL provided content (transcript + any attachments) to form your analysis

Session content:
${fullContext}`,
          },
        ],
      });

      const block = msg.content[0];
      if (!block || block.type !== "text") {
        return NextResponse.json(
          { error: "Unexpected response format from Claude" },
          { status: 500 },
        );
      }
      const jsonMatch = block.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: "Parse failed" }, { status: 500 });
      }
      try {
        return NextResponse.json(JSON.parse(jsonMatch[0]));
      } catch {
        return NextResponse.json(
          { error: "Could not parse JSON from Claude response" },
          { status: 500 },
        );
      }
    }

    if (body.type === "ask") {
      const context = body.transcripts
        .slice(0, 8)
        .map((t, i) => `[Session ${i + 1}]\n${t.substring(0, 1200)}`)
        .join("\n\n---\n\n");

      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are a UX research analyst. Answer the following question based ONLY on the research sessions provided. Be specific, cite which sessions support your points (e.g., "In Session 2..."). If the data doesn't support an answer, say so.

Question: ${body.query}

Research sessions:
${context}`,
          },
        ],
      });

      const block = msg.content[0];
      if (!block || block.type !== "text") {
        return NextResponse.json(
          { error: "Unexpected response format from Claude" },
          { status: 500 },
        );
      }
      return NextResponse.json({ answer: block.text });
    }

    if (body.type === "ask-cross-project") {
      const summaries = body.projectSummaries.slice(0, 8);
      const context = summaries
        .map(
          (p) =>
            `## ${p.name}${p.description ? `\nDescription: ${p.description}` : ""}\nSessions: ${p.sessionCount} | Participants with info: ${p.participantCount} | Period: ${p.dateRange}\nKey Findings:\n${p.keyFindings.slice(0, 10).map((f) => `- ${f}`).join("\n")}`,
        )
        .join("\n\n---\n\n");

      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are a UX research analyst with access to a portfolio of research projects. Answer the question based on the research data provided. Be specific — reference project names and cite findings when relevant. If the data doesn't support a confident answer, say so.

Question: ${body.query}

Research Portfolio:
${context}`,
          },
        ],
      });

      const block = msg.content[0];
      if (!block || block.type !== "text") {
        return NextResponse.json(
          { error: "Unexpected response format from Claude" },
          { status: 500 },
        );
      }
      return NextResponse.json({ answer: block.text });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
