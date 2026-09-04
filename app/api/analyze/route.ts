import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { analysisSchema } from "@/lib/analysis-schema";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a senior conversation-quality analyst. Analyze customer support call transcripts with precision and avoid guessing details that are not present.

Return sentence-level results for each meaningful utterance in transcript order. Preserve the wording, detect a speaker label when present, and use "Unknown" otherwise. Use only Positive, Neutral, or Negative for sentiment. Use only Joy, Trust, Surprise, Neutral, Concern, Frustration, Anger, or Sadness for emotion. Scores are percentages from 0 to 100. Overall sentiment should reflect the entire interaction, weighted toward the customer's experience and the final outcome. Agent performance measures clarity, helpfulness, accuracy, and ownership. Customer satisfaction estimates the customer's likely satisfaction. Resolution likelihood estimates whether the issue was resolved. Empathy measures how well the agent acknowledged and responded to the customer. Escalation risk estimates the likelihood of escalation or churn. Keep the summary to 2-3 sentences. Make key issues and action items concise and evidence-based.`;

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });

  const body = (await request.json()) as { text?: string; fileName?: string };
  const text = body.text?.trim();
  if (!text) return NextResponse.json({ error: "The transcript is empty." }, { status: 400 });
  if (text.length > 50000) return NextResponse.json({ error: "The transcript exceeds the 50,000 character limit." }, { status: 413 });
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: "GROQ_API_KEY is not configured on the server." }, { status: 503 });

  try {
    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
    const preferredModel = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";
    const models = [...new Set([preferredModel, "openai/gpt-oss-120b"])];

    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await openai.chat.completions.parse({
            model,
            temperature: 0,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: `File: ${body.fileName ?? "conversation.txt"}\n\nTranscript:\n${text}` },
            ],
            response_format: zodResponseFormat(analysisSchema, "conversation_analysis"),
          });

          const analysis = response.choices[0]?.message.parsed;
          if (analysis) return NextResponse.json(analysis);
        } catch {
          continue;
        }
      }
    }

    return NextResponse.json({ error: "The AI could not structure this transcript. Please try the analysis again." }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "The analysis service is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
