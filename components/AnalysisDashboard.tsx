"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, ChevronDown, Download, Gauge, HeartHandshake, Lightbulb, Minus, RotateCcw, Smile, Target, TrendingUp } from "lucide-react";
import type { Analysis, SentimentLabel } from "@/lib/analysis-schema";
import { downloadPdfReport } from "@/lib/pdf-report";

const colors: Record<SentimentLabel, string> = { Positive: "#1f9d76", Neutral: "#8d96a5", Negative: "#e45b4f" };
const icons = { Positive: ArrowUp, Neutral: Minus, Negative: ArrowDown };

type Props = { analysis: Analysis; fileName: string; onReset: () => void };

function scoreTone(value: number, reverse = false) {
  const adjusted = reverse ? 100 - value : value;
  return adjusted >= 75 ? "good" : adjusted >= 50 ? "fair" : "poor";
}

function KpiCard({ label, value, icon: Icon, reverse = false }: { label: string; value: number; icon: typeof Gauge; reverse?: boolean }) {
  return (
    <article className="kpi-card">
      <div className={`kpi-icon ${scoreTone(value, reverse)}`}><Icon size={18} /></div>
      <div><span>{label}</span><strong>{Math.round(value)}<small>/100</small></strong></div>
      <div className="score-track"><i className={scoreTone(value, reverse)} style={{ width: `${value}%` }} /></div>
    </article>
  );
}

export function AnalysisDashboard({ analysis, fileName, onReset }: Props) {
  const [filter, setFilter] = useState<SentimentLabel | "All">("All");
  const [exporting, setExporting] = useState(false);
  const distribution = useMemo(() => {
    const base = { Positive: 0, Neutral: 0, Negative: 0 };
    analysis.sentences.forEach((sentence) => base[sentence.sentiment]++);
    const total = Math.max(analysis.sentences.length, 1);
    return Object.entries(base).map(([label, count]) => ({ label: label as SentimentLabel, count, percent: Math.round((count / total) * 100) }));
  }, [analysis.sentences]);
  const emotionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    analysis.sentences.forEach((sentence) => counts.set(sentence.emotion, (counts.get(sentence.emotion) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [analysis.sentences]);
  const visibleSentences = filter === "All" ? analysis.sentences : analysis.sentences.filter((sentence) => sentence.sentiment === filter);
  const positive = distribution.find((item) => item.label === "Positive")?.percent ?? 0;
  const neutral = distribution.find((item) => item.label === "Neutral")?.percent ?? 0;
  const donut = { background: `conic-gradient(${colors.Positive} 0 ${positive}%, ${colors.Neutral} ${positive}% ${positive + neutral}%, ${colors.Negative} ${positive + neutral}% 100%)` };

  async function download() {
    setExporting(true);
    try {
      await downloadPdfReport(analysis, fileName);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-heading">
        <div>
          <button className="secondary-button restart-analysis" onClick={onReset}><RotateCcw size={16} /> Analyze another transcript</button>
          <div className="analysis-index">02 <i /> Signal report</div>
          <h1>Conversation field report</h1>
          <p>{fileName} · {analysis.sentences.length} analyzed utterances</p>
        </div>
        <button className="secondary-button export" onClick={download} disabled={exporting}><Download size={17} /> {exporting ? "Preparing PDF" : "Export PDF"}</button>
      </div>

      <section className={`overall-banner ${analysis.overall.sentiment.toLowerCase()}`}>
        <div className="overall-label"><span>Overall sentiment</span><strong>{analysis.overall.sentiment}</strong></div>
        <div className="confidence-ring" style={{ "--score": `${analysis.overall.confidence * 3.6}deg` } as React.CSSProperties}><span>{Math.round(analysis.overall.confidence)}%</span></div>
        <p>{analysis.overall.rationale}</p>
        <div className="signal-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
      </section>

      <section>
        <div className="section-heading"><div><span className="eyebrow">Service health</span><h2>Key performance indicators</h2></div><small>AI-estimated scores</small></div>
        <div className="kpi-grid">
          <KpiCard label="Customer satisfaction" value={analysis.kpis.customerSatisfaction} icon={Smile} />
          <KpiCard label="Agent performance" value={analysis.kpis.agentPerformance} icon={TrendingUp} />
          <KpiCard label="Resolution likelihood" value={analysis.kpis.resolutionLikelihood} icon={Target} />
          <KpiCard label="Empathy score" value={analysis.kpis.empathyScore} icon={HeartHandshake} />
          <KpiCard label="Escalation risk" value={analysis.kpis.escalationRisk} icon={AlertTriangle} reverse />
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel sentiment-panel">
          <div className="panel-title"><div><span className="eyebrow">Breakdown</span><h2>Sentiment mix</h2></div><Gauge size={20} /></div>
          <div className="donut-wrap"><div className="donut" style={donut}><div><strong>{analysis.sentences.length}</strong><span>utterances</span></div></div>
            <div className="legend">{distribution.map((item) => <div key={item.label}><i style={{ background: colors[item.label] }} /><span>{item.label}</span><strong>{item.percent}%</strong><small>{item.count} lines</small></div>)}</div>
          </div>
        </section>
        <section className="panel emotion-panel">
          <div className="panel-title"><div><span className="eyebrow">Emotional signals</span><h2>Detected emotions</h2></div><HeartHandshake size={20} /></div>
          <div className="emotion-list">{emotionCounts.map(([emotion, count]) => <div key={emotion}><span>{emotion}</span><div><i style={{ width: `${(count / Math.max(...emotionCounts.map((item) => item[1]))) * 100}%` }} /></div><strong>{count}</strong></div>)}</div>
        </section>
      </div>

      <section className="panel summary-panel">
        <div className="panel-title"><div><span className="eyebrow">At a glance</span><h2>Conversation summary</h2></div><Lightbulb size={20} /></div>
        <p className="summary-copy">{analysis.summary}</p>
        <div className="insight-grid">
          <div><span>Primary topic</span><strong>{analysis.insights.primaryTopic}</strong></div>
          <div><span>Customer intent</span><strong>{analysis.insights.customerIntent}</strong></div>
          <div><span>Resolution</span><strong className="resolution"><CheckCircle2 size={16} />{analysis.insights.resolutionStatus}</strong></div>
        </div>
        <div className="list-grid">
          <div><h3>Key issues</h3><ul>{analysis.insights.keyIssues.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div><h3>Recommended actions</h3><ul>{analysis.insights.actionItems.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
      </section>

      <section className="panel transcript-panel">
        <div className="panel-title transcript-title">
          <div><span className="eyebrow">Line by line</span><h2>Sentiment timeline</h2></div>
          <label>Show <select value={filter} onChange={(event) => setFilter(event.target.value as SentimentLabel | "All")}><option>All</option><option>Positive</option><option>Neutral</option><option>Negative</option></select><ChevronDown size={15} /></label>
        </div>
        <div className="sentence-list">{visibleSentences.map((sentence, index) => {
          const Icon = icons[sentence.sentiment];
          return <article key={`${sentence.text}-${index}`}>
            <div className="speaker-avatar">{sentence.speaker.slice(0, 1).toUpperCase()}</div>
            <div className="sentence-copy"><div><strong>{sentence.speaker}</strong><span>{sentence.emotion}</span></div><p>{sentence.text}</p></div>
            <div className={`sentiment-pill ${sentence.sentiment.toLowerCase()}`}><Icon size={13} />{sentence.sentiment}<small>{Math.round(sentence.confidence)}%</small></div>
          </article>;
        })}</div>
      </section>
    </div>
  );
}
