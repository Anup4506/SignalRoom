"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { ArrowRight, FileText, ShieldCheck, Sparkles, UploadCloud, X } from "lucide-react";

const SAMPLE = `Customer: Hi, I was charged twice for my internet plan this month and I am really frustrated.\nAgent: I am sorry about the duplicate charge. I understand how concerning that must be. Let me check the billing history for you.\nCustomer: Thank you. I need this fixed today because the extra payment affected my other bills.\nAgent: I found the duplicate transaction. I have submitted an immediate refund, which should appear within 3 to 5 business days. I have also added a credit to your account for the inconvenience.\nCustomer: That helps. I wish the refund were instant, but I appreciate you resolving it and adding the credit.\nAgent: You are welcome. I will email the confirmation now and personally monitor the refund until it is complete.`;

type Props = {
  fileName: string;
  text: string;
  loading: boolean;
  error: string;
  onChange: (name: string, text: string) => void;
  onAnalyze: () => void;
};

export function UploadPanel({ fileName, text, loading, error, onChange, onAnalyze }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState("");

  async function accept(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setFileError("Please choose a .txt transcript file.");
      onChange("", "");
      return;
    }
    setFileError("");
    onChange(file.name, await file.text());
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    void accept(event.target.files?.[0]);
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void accept(event.dataTransfer.files[0]);
  }

  return (
    <div className="upload-layout">
      <section className="upload-intro">
        <div className="analysis-index">01 <i /> New analysis</div>
        <div className="eyebrow"><Sparkles size={14} /> Signal intake</div>
        <h1>Drop in the call.<br /><span>We’ll surface the signal.</span></h1>
        <p>Bring a plain-text conversation. SignalRoom maps sentiment, emotional turns, service quality, and escalation risk.</p>
        <div className="benefit-row">
          <span><ShieldCheck size={16} /> Server-side processing</span>
          <span><FileText size={16} /> 50,000 character limit</span>
        </div>
      </section>
      <section className="upload-card">
        <div
          className={`drop-zone ${dragging ? "dragging" : ""} ${fileName ? "has-file" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={drop}
        >
          <input ref={inputRef} type="file" accept=".txt,text/plain" onChange={choose} hidden />
          {fileName ? (
            <>
              <button className="remove-file" type="button" onClick={() => { setFileError(""); onChange("", ""); }} aria-label="Remove file"><X size={17} /></button>
              <div className="file-icon"><FileText size={26} /></div>
              <strong>{fileName}</strong>
              <span>{text.length.toLocaleString()} characters · ready to analyze</span>
            </>
          ) : (
            <>
              <div className="upload-icon"><UploadCloud size={27} /></div>
              <strong>Place transcript in the room</strong>
              <span>Drag a file here or choose one from your device</span>
              <button className="secondary-button" type="button" onClick={() => inputRef.current?.click()}>Choose transcript</button>
              <small>.TXT only · Maximum 50 KB</small>
            </>
          )}
        </div>
        {fileName && <div className="text-preview">{text.slice(0, 340)}{text.length > 340 ? "…" : ""}</div>}
        {(fileError || error) && <div className="form-error" role="alert">{fileError || error}</div>}
        <div className="upload-actions">
          <button className="text-button" type="button" onClick={() => { setFileError(""); onChange("sample-support-call.txt", SAMPLE); }}>Try sample transcript</button>
          <button className="primary-button" type="button" disabled={!text || loading} onClick={onAnalyze}>
            {loading ? <><span className="spinner" /> Analyzing conversation</> : <>Analyze conversation <ArrowRight size={18} /></>}
          </button>
        </div>
      </section>
      <div className="process-strip">
        <div><b>A</b><span><strong>Transcript</strong><small>Plain text input</small></span></div>
        <i />
        <div><b>B</b><span><strong>Signal engine</strong><small>Structured AI analysis</small></span></div>
        <i />
        <div><b>C</b><span><strong>Field report</strong><small>Insights ready to use</small></span></div>
      </div>
    </div>
  );
}
