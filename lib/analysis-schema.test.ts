import { describe, expect, it } from "vitest";
import { analysisSchema } from "./analysis-schema";

const validAnalysis = {
  overall: { sentiment: "Positive", confidence: 91, rationale: "The issue was resolved." },
  summary: "The customer reported a billing issue and the agent resolved it.",
  sentences: [{ speaker: "Customer", text: "Thank you for fixing this.", sentiment: "Positive", emotion: "Joy", confidence: 94 }],
  kpis: { customerSatisfaction: 88, agentPerformance: 93, resolutionLikelihood: 96, empathyScore: 90, escalationRisk: 8 },
  insights: { primaryTopic: "Billing", customerIntent: "Refund request", resolutionStatus: "Resolved", keyIssues: ["Duplicate charge"], actionItems: ["Monitor refund"] },
};

describe("analysisSchema", () => {
  it("accepts a complete conversation analysis", () => {
    expect(analysisSchema.parse(validAnalysis)).toEqual(validAnalysis);
  });

  it("rejects scores outside the percentage range", () => {
    expect(() => analysisSchema.parse({ ...validAnalysis, kpis: { ...validAnalysis.kpis, empathyScore: 120 } })).toThrow();
  });

  it("rejects unsupported sentiment labels", () => {
    expect(() => analysisSchema.parse({ ...validAnalysis, overall: { ...validAnalysis.overall, sentiment: "Mixed" } })).toThrow();
  });
});
