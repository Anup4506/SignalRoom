"use client";

import { useEffect, useState } from "react";
import { BarChart3, LogOut, Sparkles } from "lucide-react";
import { LoginScreen } from "@/components/LoginScreen";
import { UploadPanel } from "@/components/UploadPanel";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import type { Analysis } from "@/lib/analysis-schema";

export default function Home() {
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/session").then((response) => response.json()).then((data) => {
      if (data.authenticated) setUsername(data.username);
    }).finally(() => setChecking(false));
  }, []);

  async function analyze() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fileName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Analysis failed.");
      setAnalysis(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setUsername("");
    setAnalysis(null);
  }

  if (checking) return <main className="loading-screen"><span className="brand-mark"><Sparkles size={20} /></span><div className="spinner dark" /></main>;
  if (!username) return <LoginScreen onSuccess={setUsername} />;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand"><span className="brand-mark"><Sparkles size={19} /></span><span>Signal<br />Room</span></div>
        <div className="header-center"><i /><BarChart3 size={16} /> Analysis desk</div>
        <div className="user-menu"><span>{username.slice(0, 1).toUpperCase()}</span><div><strong>{username}</strong><small>Analyst</small></div><button aria-label="Sign out" onClick={logout}><LogOut size={18} /></button></div>
      </header>
      <div className="app-content">
        {analysis ? <AnalysisDashboard analysis={analysis} fileName={fileName} onReset={() => { setAnalysis(null); setFileName(""); setText(""); setError(""); }} /> : <UploadPanel fileName={fileName} text={text} loading={loading} error={error} onChange={(name, value) => { setFileName(name); setText(value); setError(name || !value ? "" : "Please choose a .txt file."); }} onAnalyze={analyze} />}
      </div>
    </main>
  );
}
