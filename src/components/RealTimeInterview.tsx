"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic, MicOff, PhoneOff, Loader2, User,
  ShieldCheck, Activity, Phone, AlertCircle, Send,
  CheckCircle, TrendingUp, TrendingDown, Award, RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Report {
  overallScore: number;
  verdict: string;
  summary: string;
  nervousnessLevel: number;
  scores: { communication: number; technicalDepth: number; confidence: number; clarity: number; problemSolving: number; };
  strengths: string[];
  improvements: string[];
  topicsDiscussed: string[];
  recommendation: string;
  detailedFeedback: string;
}

interface Message {
  role: "ai" | "user";
  content: string;
}

const DOMAINS = ["Frontend", "Backend", "Full Stack", "Data Science", "Mobile", "DevOps"];

export default function RealTimeInterview() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [stage, setStage] = useState<"welcome" | "technical" | "followup">("welcome");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [customDomainValue, setCustomDomainValue] = useState("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionTimeRef = useRef(0);

  // Stable refs — all recognition handlers read these instead of stale closures
  const messagesRef = useRef<Message[]>([]);
  const isCallActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isThinkingRef = useRef(false);
  const isMutedRef = useRef(false);
  const stageRef = useRef<"welcome" | "technical" | "followup">("welcome");
  const questionCountRef = useRef(0);
  const selectedDomainRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { isCallActiveRef.current = isCallActive; }, [isCallActive]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { isThinkingRef.current = isThinking; }, [isThinking]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { questionCountRef.current = questionCount; }, [questionCount]);
  useEffect(() => { selectedDomainRef.current = selectedDomain; }, [selectedDomain]);

  // Session Timer
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => setSessionTime((p) => { sessionTimeRef.current = p + 1; return p + 1; }), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isCallActive]);

  // Audio Visualizer
  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyzer = audioCtx.createAnalyser();
      analyzer.fftSize = 64;
      source.connect(analyzer);
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const draw = () => {
        if (!visualizerCanvasRef.current) return;
        const canvas = visualizerCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        analyzer.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          ctx.fillStyle = `rgba(59,130,246,${dataArray[i] / 255 + 0.2})`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
        animationFrameRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch (e) {
      console.error("Visualizer error:", e);
    }
  };

  useEffect(() => {
    if (isCallActive && !isMuted) {
      startVisualizer();
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [isCallActive, isMuted]);

  // Speak
  const speak = useCallback(async (text: string) => {
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis) return resolve();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.1;
      utter.pitch = 1.0;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => { setIsSpeaking(false); resolve(); };
      utter.onerror = () => { setIsSpeaking(false); resolve(); };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    });
  }, []);

  // AI Response — reads everything from refs, never stale
  const handleAIResponse = useCallback(async (currentMessages: Message[]) => {
    if (isThinkingRef.current) return;
    setIsThinking(true);
    setError(null);
    try {
      const res = await fetch("/api/real-time-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: selectedDomainRef.current,
          stage: stageRef.current,
          messages: currentMessages,
          candidateName: "Candidate",
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (data.success) {
        const aiMsg: Message = { role: "ai", content: data.response };
        setMessages((prev) => [...prev, aiMsg]);
        setIsThinking(false);
        if (stageRef.current === "welcome" && currentMessages.length >= 2) setStage("technical");
        else if (stageRef.current === "technical") {
          setQuestionCount((prev) => prev + 1);
          if (questionCountRef.current >= 5) setStage("followup");
        }
        await speak(data.response);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error("Call Error:", err);
      setIsThinking(false);
      setError("AI failed to respond.");
    }
  }, [speak]);

  // Build recognition instance — always fresh, never reuses stale instance
  const buildAndStartRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Speech recognition not supported. Use Chrome."); return; }
    if (!isCallActiveRef.current || isMutedRef.current || isSpeakingRef.current || isThinkingRef.current) return;

    // Always destroy old instance first
    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch (_) { }
      recognitionRef.current = null;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    // Watchdog: if no speech is heard in 8s, force a fresh restart
    const resetWatchdog = () => {
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      watchdogRef.current = setTimeout(() => {
        console.log("Watchdog: restarting stale recognition");
        buildAndStartRecognition();
      }, 8000);
    };

    rec.onstart = () => { setIsListening(true); setError(null); resetWatchdog(); };

    rec.onresult = (event: any) => {
      resetWatchdog(); // Reset watchdog on every result
      let current = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);

      // Barge-in: stop AI if user speaks
      if (current.trim().length > 0 && isSpeakingRef.current) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (current.trim().length > 2) {
          const userMsg: Message = { role: "user", content: current };
          setMessages((prev) => [...prev, userMsg]);
          setTranscript("");
          if (watchdogRef.current) clearTimeout(watchdogRef.current);
          try { rec.onend = null; rec.stop(); } catch (_) { }
          recognitionRef.current = null;
          handleAIResponse([...messagesRef.current, userMsg]);
        }
      }, 1400);
    };

    rec.onerror = (event: any) => {
      if (event.error === "not-allowed") setError("Mic Access Denied — allow in browser.");
      else if (event.error !== "no-speech") console.warn("Recognition error:", event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      // Restart with a FRESH instance (critical fix — never reuse stale rec)
      if (isCallActiveRef.current && !isSpeakingRef.current && !isThinkingRef.current && !isMutedRef.current) {
        setTimeout(() => buildAndStartRecognition(), 300);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch (_) { }
  }, [handleAIResponse]);

  // Fixed-size dependency array — no more hook size error
  useEffect(() => {
    if (!isCallActive || isMuted || isSpeaking || isThinking) {
      try { recognitionRef.current?.stop(); } catch (_) { }
      return;
    }
    buildAndStartRecognition();
    return () => { try { recognitionRef.current?.stop(); } catch (_) { } };
  }, [isCallActive, isMuted, isSpeaking, isThinking, buildAndStartRecognition]);

  // Manual push fallback
  const manualPush = () => {
    const current = transcript;
    if (current.trim().length > 1) {
      const userMsg: Message = { role: "user", content: current };
      setMessages((prev) => [...prev, userMsg]);
      setTranscript("");
      try { recognitionRef.current?.stop(); } catch (_) { }
      handleAIResponse([...messagesRef.current, userMsg]);
    }
  };

  const startCall = async () => {
    recognitionRef.current = null;
    setError(null);
    setIsCallActive(true);
    const welcome = "Hello, how are you? Can we start the interview?";
    setMessages([{ role: "ai", content: welcome }]);
    await speak(welcome);
  };

  const toggleVideo = async () => {
    if (isVideoEnabled) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setIsVideoEnabled(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        setIsVideoEnabled(true);
        // We'll attach the stream in a useEffect once the video element exists
      } catch (err) {
        setError("Camera access denied");
      }
    }
  };

  // Attach video stream when enabled
  useEffect(() => {
    if (isVideoEnabled && streamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = streamRef.current;
    }
  }, [isVideoEnabled]);

  const endCall = async () => {
    setIsCallActive(false);
    window.speechSynthesis.cancel();
    try { recognitionRef.current?.stop(); } catch (_) { }
    recognitionRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);

    const finalMessages = messagesRef.current;
    const finalTime = sessionTimeRef.current;

    setTranscript("");
    setError(null);

    if (finalMessages.length < 3) {
      // Not enough conversation to generate report, just reset
      setMessages([]); setQuestionCount(0); setStage("welcome"); setSessionTime(0);
      return;
    }

    setIsGeneratingReport(true);
    try {
      const res = await fetch("/api/real-time-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: finalMessages, domain: selectedDomainRef.current, sessionDuration: finalTime }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Report API error ${res.status}: ${text.slice(0, 200)}`);
      }
      const data = await res.json();
      if (data.success) setReport(data.report);
    } catch (e) {
      console.error("Report error:", e);
    } finally {
      setIsGeneratingReport(false);
      setMessages([]);
      setQuestionCount(0);
      setStage("welcome");
      setSessionTime(0);
    }
  };

  const resetAll = () => {
    setReport(null);
    setSelectedDomain(null);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="w-36 shrink-0 text-sm text-slate-600">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-slate-800 rounded-full"
        />
      </div>
      <span className="w-10 text-right text-sm font-bold text-slate-800">{value}%</span>
    </div>
  );

  const downloadReport = () => {
    if (!report) return;
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Interview Report — ${selectedDomain}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #ffffff; color: #0f172a; padding: 48px; max-width: 760px; margin: 0 auto; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 24px; margin-bottom: 32px; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #64748b; }
    .title { font-size: 1.6rem; font-weight: 700; margin: 12px 0 4px; }
    .meta { font-size: 0.8rem; color: #64748b; }
    .score-block { text-align: right; }
    .score-num { font-size: 3rem; font-weight: 700; line-height: 1; }
    .score-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
    .verdict { display: inline-block; font-size: 0.75rem; font-weight: 700; border: 1.5px solid #0f172a; padding: 3px 12px; border-radius: 4px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px; }
    p { font-size: 0.88rem; line-height: 1.7; color: #334155; }
    .bar-row { display: flex; align-items: center; gap: 16px; padding: 7px 0; border-bottom: 1px solid #f1f5f9; }
    .bar-label { width: 150px; font-size: 0.82rem; color: #475569; }
    .bar-track { flex: 1; height: 4px; background: #e2e8f0; border-radius: 2px; }
    .bar-fill { height: 100%; background: #0f172a; border-radius: 2px; }
    .bar-pct { width: 36px; text-align: right; font-size: 0.82rem; font-weight: 600; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    ul { list-style: none; }
    li { font-size: 0.85rem; color: #334155; padding: 5px 0; border-bottom: 1px solid #f1f5f9; display: flex; gap: 10px; align-items: flex-start; line-height: 1.5; }
    li::before { content: "–"; color: #94a3b8; flex-shrink: 0; }
    .tag { display: inline-block; font-size: 0.75rem; padding: 3px 10px; border: 1px solid #e2e8f0; border-radius: 3px; color: #475569; margin: 3px; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 0.7rem; color: #94a3b8; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <div>
        <div class="brand">MockMate — InterviewerAI</div>
        <div class="title">Interview Performance Report</div>
        <div class="meta">${selectedDomain} Assessment &nbsp;•&nbsp; ${date}</div>
      </div>
      <div class="score-block">
        <div class="score-num">${report.overallScore}</div>
        <div class="score-label">Score / 100</div>
        <div class="verdict">${report.recommendation}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Overall Verdict</div>
    <p><strong>${report.verdict}.</strong> ${report.summary}</p>
  </div>

  <div class="section">
    <div class="section-title">Performance Breakdown</div>
    ${[["Communication", report.scores.communication], ["Technical Depth", report.scores.technicalDepth], ["Confidence", report.scores.confidence], ["Clarity", report.scores.clarity], ["Problem Solving", report.scores.problemSolving]].map(([label, val]) => `
    <div class="bar-row">
      <span class="bar-label">${label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${val}%"></div></div>
      <span class="bar-pct">${val}%</span>
    </div>`).join("")}
  </div>

  <div class="two-col">
    <div class="section">
      <div class="section-title">Strengths</div>
      <ul>${report.strengths.map(s => `<li>${s}</li>`).join("")}</ul>
    </div>
    <div class="section">
      <div class="section-title">Areas to Improve</div>
      <ul>${report.improvements.map(s => `<li>${s}</li>`).join("")}</ul>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Detailed Feedback</div>
    <p>${report.detailedFeedback}</p>
  </div>

  <div class="section">
    <div class="section-title">Nervousness Detection</div>
    <div class="bar-row">
      <span class="bar-label">Anxiety Index</span>
      <div class="bar-track"><div class="bar-fill" style="width:${report.nervousnessLevel}%"></div></div>
      <span class="bar-pct">${report.nervousnessLevel}%</span>
    </div>
    <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 8px;">* Based on speech patterns, filler words, and hesitation pauses.</p>
  </div>

  <div class="section">
    <div class="section-title">Topics Discussed</div>
    <div>${report.topicsDiscussed.map(t => `<span class="tag">${t}</span>`).join("")}</div>
  </div>

  <div class="footer">
    <span>InterviewerAI by MockMate</span>
    <span>${date}</span>
  </div>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `InterviewReport_${selectedDomain?.replace(" ", "_")}_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Generating report screen ─── */
  if (isGeneratingReport) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="animate-spin text-slate-700" />
        <p className="text-lg font-semibold text-slate-800">Analyzing your interview...</p>
        <p className="text-sm text-slate-500">This will take a few seconds</p>
      </div>
    );
  }

  /* ─── Report screen ─── */
  if (report) {
    return (
      <div className="min-h-screen bg-white py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-2">MockMate — InterviewerAI</p>
                <h1 className="text-2xl font-bold text-slate-900">Interview Performance Report</h1>
                <p className="text-sm text-slate-500 mt-1">{selectedDomain} Assessment</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-slate-900 leading-none">{report.overallScore}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Score / 100</div>
                <div className="mt-2 inline-block border border-slate-900 text-slate-900 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm">
                  {report.recommendation}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mb-8">
            <button onClick={downloadReport}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Download Report
            </button>
            <button onClick={resetAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors">
              <RotateCcw size={14} /> New Interview
            </button>
          </div>

          {/* Verdict */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">Overall Verdict</p>
            <p className="text-base font-semibold text-slate-900 mb-1">{report.verdict}</p>
            <p className="text-sm text-slate-600 leading-relaxed">{report.summary}</p>
          </div>

          {/* Performance Breakdown */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-4">Performance Breakdown</p>
            <ScoreBar label="Communication" value={report.scores.communication} />
            <ScoreBar label="Technical Depth" value={report.scores.technicalDepth} />
            <ScoreBar label="Confidence" value={report.scores.confidence} />
            <ScoreBar label="Problem Solving" value={report.scores.problemSolving} />
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">Nervousness Detection</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-700">Anxiety Index</span>
                <span className="text-sm font-black text-slate-900">{report.nervousnessLevel}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${report.nervousnessLevel}%` }}
                  className={`h-full ${report.nervousnessLevel > 50 ? 'bg-red-500' : 'bg-slate-900'}`}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">* Analyzed via speech speed, filler words (um/uh), and hesitation markers.</p>
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">Strengths</p>
              <ul className="space-y-2">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700 leading-snug">
                    <span className="text-slate-400 shrink-0 mt-0.5">—</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">Areas to Improve</p>
              <ul className="space-y-2">
                {report.improvements.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700 leading-snug">
                    <span className="text-slate-400 shrink-0 mt-0.5">—</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Feedback */}
          <div className="mb-8 border-l-2 border-slate-200 pl-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">Detailed Feedback</p>
            <p className="text-sm text-slate-700 leading-relaxed">{report.detailedFeedback}</p>
          </div>

          {/* Topics */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-3">Topics Discussed</p>
            <div className="flex flex-wrap gap-2">
              {report.topicsDiscussed.map((t, i) => (
                <span key={i} className="px-3 py-1 border border-slate-200 text-slate-600 text-xs rounded-sm">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
            <p className="text-xs text-slate-400">InterviewerAI by MockMate</p>
            <p className="text-xs text-slate-400">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── Pre-call screen ─── */
  if (!isCallActive) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-xl p-10  text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
        >
          <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-8 shadow-sm">
            <Mic size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Mockmate</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.15em] text-[10px] mb-12">
            Secure Voice Line • Professional Assessment
          </p>

          <div className="space-y-6 text-left mb-10">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 block">
              Select Assessment Line
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DOMAINS.map((d) => (
                <button
                  key={d}
                  onClick={() => { setSelectedDomain(d); setIsCustomDomain(false); }}
                  className={`py-3.5 rounded-lg border transition-all font-bold text-xs uppercase tracking-wider ${selectedDomain === d && !isCustomDomain
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-500"
                    }`}
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => { setIsCustomDomain(true); setSelectedDomain(null); }}
                className={`py-3.5 rounded-lg border transition-all font-bold text-xs uppercase tracking-wider ${isCustomDomain
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-500"
                  }`}
              >
                Other / Custom
              </button>
            </div>

            <AnimatePresence>
              {isCustomDomain && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden pt-4"
                >
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block">
                    Type Your Domain
                  </label>
                  <input
                    type="text"
                    value={customDomainValue}
                    onChange={(e) => {
                      setCustomDomainValue(e.target.value);
                      setSelectedDomain(e.target.value);
                    }}
                    placeholder="e.g. Cloud Architect"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-300 transition-all placeholder:text-slate-300"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            disabled={!selectedDomain || (isCustomDomain && !customDomainValue.trim())}
            onClick={startCall}
            className="w-full py-5 bg-slate-900 hover:bg-slate-800 disabled:opacity-20 text-white rounded-lg font-black text-sm uppercase tracking-[0.2em] transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <Phone size={18} /> Start Mock Interview
          </button>

          <div className="mt-8 flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-slate-300" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">End-to-End Encrypted Session</span>
          </div>
        </motion.div>
      </div >
    );
  }

  /* ─── Active call screen ─── */
  return (
    <div className="fixed inset-0 bg-[#0B0D13] z-[100] flex flex-col items-center overflow-hidden font-sans select-none">
      {/* Background Blurs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-900/[0.03] blur-[120px] rounded-full pointer-events-none" />

      {/* Main Split Layout */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-2 gap-0">

        {/* Left Side: Interviewer (Sarah) */}
        <div className="relative flex flex-col items-center justify-center p-8 border-r border-white/5">
          {/* Top Info */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-full backdrop-blur-md">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Live Interview</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 rounded-full backdrop-blur-md">
              <ShieldCheck size={10} className="text-slate-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Encrypted</span>
            </div>
          </div>

          <div className="flex flex-col items-center text-center max-w-md w-full">
            <div className="relative mb-8 scale-90 md:scale-100">
              <AnimatePresence>
                {isSpeaking && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: [0.1, 0.2, 0.1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -inset-6 rounded-full blur-3xl"
                  />
                )}
              </AnimatePresence>

              <div className="w-40 h-40 rounded-full border-4 border-slate-800/50 p-1 relative z-10 ">
                <div className="w-full h-full rounded-full overflow-hidden border-2 relative">
                    <img src="https://imamiddleeast.org/cma-ramdan-offer/assets/images/career-success.webp" alt="Interviewer" className="w-full h-40 object-cover" />
                  {isThinking && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={24} className="text-white animate-spin opacity-50" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1 mb-10">
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">Adiya Dhar</h2>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Senior DevOps Engineer</p>
            </div>

            {/* Audio Waveform Compact */}
            <div className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-5 mb-10 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5 h-3 items-end">
                  {[...Array(4)].map((_, i) => (
                    <motion.div key={i} animate={{ height: isSpeaking ? [4, 12, 4] : 4 }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }} className="w-0.5 bg-blue-500/60 rounded-full" />
                  ))}
                </div>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Voice Processing</span>
              </div>
              <canvas ref={visualizerCanvasRef} className="w-full h-8 opacity-40" width={400} height={32} />
            </div>

            <div className="h-24 flex items-center justify-center text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={messages[messages.length - 1]?.content}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-lg font-medium text-white/70 leading-relaxed italic"
                >
                  {isSpeaking ? `"${messages[messages.length - 1]?.content}"` : (transcript ? `"${transcript}"` : "Waiting for your response...")}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Side: Candidate Video */}
        <div className="relative flex flex-col items-center justify-center p-8 bg-[#08090D]">
          <div className="w-full max-w-xl aspect-video rounded-2xl bg-slate-900 border border-white/5 overflow-hidden shadow-2xl relative">
            {!isVideoEnabled ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-700">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                  <User size={40} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Video Camera Off</p>
              </div>
            ) : (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale-[10%]" />
            )}

            {/* Nervousness Tracker Overlay */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 shadow-xl">
                <Activity size={12} className={isVideoEnabled ? "text-blue-400 animate-pulse" : "text-slate-600"} />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Nervousness Analysis</span>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/5 w-32"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Stress Index</span>
                  <span className={`text-[10px] font-black ${isVideoEnabled ? "text-blue-400" : "text-slate-600"}`}>
                    {isVideoEnabled ? "Tracking" : "0%"}
                  </span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: isVideoEnabled ? ["15%", "22%", "18%", "25%"] : "0%" }}
                    transition={{ repeat: isVideoEnabled ? Infinity : 0, duration: 4, ease: "easeInOut" }}
                    className={`h-full ${isVideoEnabled ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-slate-800"}`}
                  />
                </div>
              </motion.div>
            </div>

            <div className="absolute bottom-4 left-4 flex flex-col gap-1">
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Candidate Feed</span>
              <h4 className="text-xs font-bold text-white">Live Session</h4>
            </div>
          </div>

          {/* Controls Footer - Now on Right Side bottom */}
          <div className="mt-12 w-full max-w-md flex items-center justify-around">
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border ${isMuted ? "bg-white text-slate-900 border-white" : "bg-slate-800/30 text-white border-white/10 hover:bg-slate-800"
                  }`}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Mute</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border ${isVideoEnabled ? "bg-white text-slate-900 border-white" : "bg-slate-800/30 text-white border-white/10 hover:bg-slate-800"
                  }`}
              >
                <div className="relative">
                  <Activity size={22} />
                  {!isVideoEnabled && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-500 rotate-45" />}
                </div>
              </button>
              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Video</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={endCall}
                className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-500/20 active:scale-95 transition-all"
              >
                <PhoneOff size={32} fill="currentColor" />
              </button>
              <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">End Call</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button className="w-14 h-14 bg-slate-800/30 text-white rounded-full flex items-center justify-center border border-white/10 hover:bg-slate-800 transition-all">
                <Activity size={22} />
              </button>
              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Signal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar (Full Width Top) */}
      <div className="w-full flex gap-1 px-1 shrink-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex-1 h-0.5 transition-all duration-700 ${i < questionCount ? "bg-blue-500/50" : "bg-white/5"}`} />
        ))}
      </div>
    </div>
  );
}
