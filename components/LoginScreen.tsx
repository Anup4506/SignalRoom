"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react";

type Props = { onSuccess: (username: string) => void };

export function LoginScreen({ onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to sign in.");
      onSuccess(data.username);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand brand-light"><span className="brand-mark"><Sparkles size={19} /></span>SignalRoom</div>
        <div className="story-copy">
          <div className="eyebrow light">Conversation signal system</div>
          <h1>Read the room.<br />In every line.</h1>
          <p>One transcript becomes a map of emotion, service quality, and the moments that matter.</p>
          <div className="story-metrics">
            <div><strong>01</strong><span>Upload the call</span></div>
            <div><strong>02</strong><span>Decode the tone</span></div>
            <div><strong>03</strong><span>Act on the signal</span></div>
          </div>
        </div>
        <div className="signal-map" aria-hidden="true">
          <span style={{ height: "25%" }} /><span style={{ height: "62%" }} /><span style={{ height: "42%" }} /><span style={{ height: "88%" }} /><span style={{ height: "54%" }} /><span style={{ height: "72%" }} /><span style={{ height: "34%" }} /><span style={{ height: "66%" }} /><span style={{ height: "45%" }} /><span style={{ height: "80%" }} />
        </div>
        <div className="signal-tag tag-positive">+ Positive shift</div>
        <div className="signal-tag tag-risk">! Escalation cue</div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="mobile-brand brand"><span className="brand-mark"><Sparkles size={19} /></span>SignalRoom</div>
          <div className="login-icon"><LockKeyhole size={24} /></div>
          <div>
            <div className="eyebrow">Analyst access</div>
            <h2>Enter the room</h2>
            <p>Your conversation workspace is ready.</p>
          </div>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" autoComplete="username" required />
          </label>
          <label>
            Password
            <span className="password-field">
              <input type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
              <button type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </span>
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button login-button" disabled={loading}>
            {loading ? "Signing in..." : <>Enter workspace <ArrowRight size={18} /></>}
          </button>
          <p className="privacy-note">Your transcript is processed securely and is never stored by this application.</p>
        </form>
      </section>
    </main>
  );
}
