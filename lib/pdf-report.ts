import type { Analysis, SentimentLabel } from "./analysis-schema";

const sentimentColors: Record<SentimentLabel, [number, number, number]> = {
  Positive: [31, 157, 118],
  Neutral: [125, 137, 129],
  Negative: [228, 91, 79],
};

function safe(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E]/g, "");
}

export async function downloadPdfReport(analysis: Analysis, fileName: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const distribution = { Positive: 0, Neutral: 0, Negative: 0 };
  const emotions = new Map<string, number>();

  analysis.sentences.forEach((sentence) => {
    distribution[sentence.sentiment] += 1;
    emotions.set(sentence.emotion, (emotions.get(sentence.emotion) ?? 0) + 1);
  });

  doc.setFillColor(18, 74, 54);
  doc.rect(0, 0, pageWidth, 34, "F");
  doc.setFillColor(215, 242, 96);
  doc.roundedRect(margin, 9, 14, 14, 3, 3, "F");
  doc.setTextColor(18, 74, 54);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("AI", margin + 7, 18, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("SignalRoom", margin + 19, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(202, 220, 211);
  doc.text("CONVERSATION INTELLIGENCE REPORT", pageWidth - margin, 17, { align: "right" });

  doc.setTextColor(23, 33, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Conversation report", margin, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 120, 113);
  doc.text(`${safe(fileName)}  |  ${analysis.sentences.length} analyzed utterances  |  ${new Date().toLocaleDateString("en-GB")}`, margin, 55);

  const overallColor = sentimentColors[analysis.overall.sentiment];
  doc.setFillColor(...overallColor);
  doc.roundedRect(margin, 63, contentWidth, 34, 4, 4, "F");
  doc.setTextColor(235, 246, 240);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("OVERALL SENTIMENT", margin + 8, 74);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.text(analysis.overall.sentiment, margin + 8, 86);
  doc.setFillColor(255, 255, 255);
  doc.circle(margin + 59, 80, 10, "F");
  doc.setTextColor(...overallColor);
  doc.setFontSize(11);
  doc.text(`${Math.round(analysis.overall.confidence)}%`, margin + 59, 83, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.3);
  const rationale = doc.splitTextToSize(safe(analysis.overall.rationale), contentWidth - 90);
  doc.text(rationale.slice(0, 3), margin + 78, 77);

  doc.setTextColor(21, 107, 80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("SERVICE HEALTH", margin, 108);
  doc.setTextColor(23, 33, 27);
  doc.setFontSize(13);
  doc.text("Key performance indicators", margin, 115);

  const kpis = [
    ["Customer satisfaction", analysis.kpis.customerSatisfaction],
    ["Agent performance", analysis.kpis.agentPerformance],
    ["Resolution likelihood", analysis.kpis.resolutionLikelihood],
    ["Empathy score", analysis.kpis.empathyScore],
    ["Escalation risk", analysis.kpis.escalationRisk],
  ] as const;
  const cardGap = 3;
  const cardWidth = (contentWidth - cardGap * 4) / 5;
  kpis.forEach(([label, score], index) => {
    const x = margin + index * (cardWidth + cardGap);
    doc.setFillColor(248, 250, 248);
    doc.setDrawColor(222, 229, 224);
    doc.roundedRect(x, 121, cardWidth, 27, 3, 3, "FD");
    doc.setTextColor(105, 117, 109);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.3);
    doc.text(doc.splitTextToSize(label, cardWidth - 7).slice(0, 2), x + 4, 129);
    doc.setTextColor(23, 33, 27);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(String(Math.round(score)), x + 4, 142);
    doc.setFontSize(6);
    doc.setTextColor(148, 159, 151);
    doc.text("/100", x + 13, 142);
    doc.setFillColor(229, 234, 230);
    doc.roundedRect(x + 4, 145, cardWidth - 8, 1.4, .7, .7, "F");
    doc.setFillColor(index === 4 ? 228 : 31, index === 4 ? 91 : 157, index === 4 ? 79 : 118);
    doc.roundedRect(x + 4, 145, (cardWidth - 8) * (score / 100), 1.4, .7, .7, "F");
  });

  doc.setTextColor(21, 107, 80);
  doc.setFontSize(7);
  doc.text("CONVERSATION INSIGHTS", margin, 160);
  doc.setTextColor(23, 33, 27);
  doc.setFontSize(13);
  doc.text("Summary and signals", margin, 167);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 88, 79);
  doc.setFontSize(8.2);
  const summaryLines = doc.splitTextToSize(safe(analysis.summary), contentWidth);
  doc.text(summaryLines, margin, 175);
  let y = 175 + summaryLines.length * 4.1 + 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    body: [
      ["Primary topic", safe(analysis.insights.primaryTopic), "Resolution", safe(analysis.insights.resolutionStatus)],
      ["Customer intent", safe(analysis.insights.customerIntent), "Top emotion", safe([...emotions.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Neutral")],
    ],
    styles: { font: "helvetica", fontSize: 7.3, cellPadding: 3, lineColor: [224, 230, 226], textColor: [45, 56, 49] },
    columnStyles: { 0: { fontStyle: "bold", textColor: [21, 107, 80], cellWidth: 25 }, 1: { cellWidth: 67 }, 2: { fontStyle: "bold", textColor: [21, 107, 80], cellWidth: 23 } },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;

  const total = Math.max(analysis.sentences.length, 1);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(23, 33, 27);
  doc.setFontSize(10);
  doc.text("Sentiment breakdown", margin, y);
  doc.text("Detected emotions", margin + contentWidth / 2 + 4, y);
  y += 7;
  (["Positive", "Neutral", "Negative"] as SentimentLabel[]).forEach((label, index) => {
    const rowY = y + index * 7;
    const percent = Math.round((distribution[label] / total) * 100);
    doc.setFillColor(...sentimentColors[label]);
    doc.circle(margin + 2, rowY - 1, 1.5, "F");
    doc.setTextColor(70, 82, 74);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(label, margin + 6, rowY);
    doc.setFont("helvetica", "bold");
    doc.text(`${percent}%  (${distribution[label]})`, margin + 47, rowY, { align: "right" });
  });
  [...emotions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([emotion, count], index) => {
    const rowY = y + index * 7;
    doc.setTextColor(70, 82, 74);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(safe(emotion), margin + contentWidth / 2 + 4, rowY);
    doc.setFont("helvetica", "bold");
    doc.text(String(count), pageWidth - margin, rowY, { align: "right" });
  });

  y += 28;
  const issueItems = analysis.insights.keyIssues.map((item) => `- ${safe(item)}`).join("\n") || "- No material issues identified";
  const actionItems = analysis.insights.actionItems.map((item) => `- ${safe(item)}`).join("\n") || "- No follow-up action required";
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Key issues", "Recommended actions"]],
    body: [[issueItems, actionItems]],
    theme: "grid",
    headStyles: { fillColor: [232, 243, 237], textColor: [21, 107, 80], fontStyle: "bold", fontSize: 8 },
    styles: { font: "helvetica", fontSize: 7.3, cellPadding: 4, lineColor: [224, 230, 226], textColor: [65, 77, 69], valign: "top" },
  });

  const tableStart = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  autoTable(doc, {
    startY: tableStart,
    margin: { left: margin, right: margin, top: 18, bottom: 16 },
    head: [["#", "Speaker", "Utterance", "Sentiment", "Emotion", "Confidence"]],
    body: analysis.sentences.map((sentence, index) => [
      index + 1,
      safe(sentence.speaker),
      safe(sentence.text),
      sentence.sentiment,
      sentence.emotion,
      `${Math.round(sentence.confidence)}%`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [18, 74, 54], textColor: [255, 255, 255], fontSize: 7, cellPadding: 3 },
    styles: { font: "helvetica", fontSize: 6.8, cellPadding: 3, textColor: [45, 56, 49], lineColor: [231, 235, 232], lineWidth: .1 },
    columnStyles: { 0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: 21 }, 2: { cellWidth: 78 }, 3: { cellWidth: 20 }, 4: { cellWidth: 20 }, 5: { cellWidth: 20, halign: "right" } },
    didDrawPage: () => {
      if (doc.getCurrentPageInfo().pageNumber > 1) {
        doc.setTextColor(21, 107, 80);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("SignalRoom - Sentence-level analysis", margin, 11);
      }
    },
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(225, 231, 227);
    doc.line(margin, 287, pageWidth - margin, 287);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(130, 141, 133);
    doc.text("AI-generated indicators should support, not replace, human quality review.", margin, 292);
    doc.text(`Page ${page} of ${pages}`, pageWidth - margin, 292, { align: "right" });
  }

  const baseName = fileName.replace(/\.txt$/i, "").replace(/[^a-z0-9-_]+/gi, "-") || "conversation";
  doc.save(`${baseName}-sentiment-report.pdf`);
}
