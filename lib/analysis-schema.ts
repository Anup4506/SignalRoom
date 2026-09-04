import { z } from "zod";

export const sentimentLabelSchema = z.enum(["Positive", "Neutral", "Negative"]);

export const analysisSchema = z.object({
  overall: z.object({
    sentiment: sentimentLabelSchema,
    confidence: z.number().min(0).max(100),
    rationale: z.string(),
  }),
  summary: z.string(),
  sentences: z.array(
    z.object({
      speaker: z.string(),
      text: z.string(),
      sentiment: sentimentLabelSchema,
      emotion: z.enum(["Joy", "Trust", "Surprise", "Neutral", "Concern", "Frustration", "Anger", "Sadness"]),
      confidence: z.number().min(0).max(100),
    }),
  ),
  kpis: z.object({
    customerSatisfaction: z.number().min(0).max(100),
    agentPerformance: z.number().min(0).max(100),
    resolutionLikelihood: z.number().min(0).max(100),
    empathyScore: z.number().min(0).max(100),
    escalationRisk: z.number().min(0).max(100),
  }),
  insights: z.object({
    primaryTopic: z.string(),
    customerIntent: z.string(),
    resolutionStatus: z.enum(["Resolved", "Partially resolved", "Unresolved", "Unknown"]),
    keyIssues: z.array(z.string()).max(5),
    actionItems: z.array(z.string()).max(5),
  }),
});

export type Analysis = z.infer<typeof analysisSchema>;
export type SentimentLabel = z.infer<typeof sentimentLabelSchema>;
