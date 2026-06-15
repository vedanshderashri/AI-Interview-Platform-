"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic, MicOff, PhoneOff, Loader2, User,
  ShieldCheck, Activity, Phone, AlertCircle, Send,
  CheckCircle, TrendingUp, TrendingDown, Award, RotateCcw,
  Eye, Shield, Smartphone, BookOpen, AlertTriangle,
  Code, Database, Layers, LineChart, Cloud, Grid, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Anti-Cheat Detection Rules ──────────────────────────────────────────────
const CHEAT_DETECTION_RULES: Record<string, {
  label: string;
  severity: 'critical' | 'high' | 'medium';
  message: string;
  gracePeriod: number; // seconds before auto-end
  icon: string;
}> = {
  'cell phone': {
    label: 'Mobile Phone',
    severity: 'critical',
    message: 'Mobile phone detected in frame. Remove immediately or interview will be terminated.',
    gracePeriod: 10,
    icon: '📱',
  },
  'remote': {
    label: 'Unauthorized Device',
    severity: 'high',
    message: 'Unauthorized electronic device detected. This may constitute use of an earpiece remote.',
    gracePeriod: 12,
    icon: '🎮',
  },
  'book': {
    label: 'Printed Materials',
    severity: 'high',
    message: 'Reference materials detected. Notes and books are not permitted during assessment.',
    gracePeriod: 12,
    icon: '📚',
  },
  'laptop': {
    label: 'Secondary Device',
    severity: 'medium',
    message: 'A secondary laptop screen detected. Please ensure no external resources are visible.',
    gracePeriod: 15,
    icon: '💻',
  },
  'tv': {
    label: 'External Screen',
    severity: 'medium',
    message: 'External screen detected. Ensure no reference materials are displayed.',
    gracePeriod: 15,
    icon: '📺',
  },
};

const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-950/90', border: 'border-red-500/50', text: 'text-red-300', bar: 'bg-red-500', glow: 'shadow-red-500/30' },
  high: { bg: 'bg-orange-950/90', border: 'border-orange-500/50', text: 'text-orange-300', bar: 'bg-orange-500', glow: 'shadow-orange-500/30' },
  medium: { bg: 'bg-yellow-950/80', border: 'border-yellow-500/40', text: 'text-yellow-300', bar: 'bg-yellow-500', glow: 'shadow-yellow-500/20' },
};

const loadScript = (src: string) => {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
};

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

const getDomainIcon = (domain: string) => {
  switch (domain.toLowerCase()) {
    case 'frontend': return Code;
    case 'backend': return Database;
    case 'full stack': return Layers;
    case 'data science': return LineChart;
    case 'mobile': return Smartphone;
    case 'devops': return Cloud;
    default: return Grid;
  }
};

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

  // Anti-Cheat Detection States & Refs
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [model, setModel] = useState<any>(null);
  const [personWarning, setPersonWarning] = useState<string | null>(null);
  const [warningTimeout, setWarningTimeout] = useState<number>(0);
  const [cheatWarning, setCheatWarning] = useState<{
    ruleKey: string;
    label: string;
    severity: 'critical' | 'high' | 'medium';
    message: string;
    gracePeriod: number;
    icon: string;
  } | null>(null);
  const [cheatWarningSeconds, setCheatWarningSeconds] = useState(0);
  const [integrityViolations, setIntegrityViolations] = useState(0);
  const [integrityStatus, setIntegrityStatus] = useState<'clean' | 'warning' | 'violated'>('clean');
  const cheatWarningSecondsRef = useRef<number>(0);
  const cheatRuleRef = useRef<string | null>(null);
  const detectorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningSecondsRef = useRef<number>(0);

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

  // Load TensorFlow & COCO-SSD Model Dynamically
  useEffect(() => {
    let active = true;
    if (isVideoEnabled && !model && !isModelLoading) {
      setIsModelLoading(true);
      const loadModel = async () => {
        try {
          await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs");
          await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd");
          if (!active) return;
          const loadedModel = await (window as any).cocoSsd.load();
          setModel(loadedModel);
        } catch (err) {
          console.error("Failed to load object detection model", err);
        } finally {
          setIsModelLoading(false);
        }
      };
      loadModel();
    }
    return () => { active = false; };
  }, [isVideoEnabled, model, isModelLoading]);

  // ─── Enhanced Anti-Cheat Detection Loop ─────────────────────────────────
  useEffect(() => {
    if (isVideoEnabled && model && isCallActive) {
      detectorIntervalRef.current = setInterval(async () => {
        if (!localVideoRef.current || localVideoRef.current.readyState !== 4) return;
        try {
          const predictions = await model.detect(localVideoRef.current);

          // ── 1. Multiple person detection ──
          const persons = predictions.filter((p: any) => p.class === 'person');
          if (persons.length > 1) {
            setPersonWarning(`⚠ ${persons.length} people detected! This interview requires you to be alone.`);
            warningSecondsRef.current += 1;
            setWarningTimeout(warningSecondsRef.current);
            setIntegrityStatus('warning');
            if (warningSecondsRef.current >= 10) {
              if (detectorIntervalRef.current) clearInterval(detectorIntervalRef.current);
              setPersonWarning(null);
              warningSecondsRef.current = 0;
              setWarningTimeout(0);
              setIntegrityStatus('violated');
              setIntegrityViolations(v => v + 1);
              endCall();
            }
          } else {
            if (personWarning) {
              setPersonWarning(null);
              warningSecondsRef.current = 0;
              setWarningTimeout(0);
              if (integrityStatus === 'warning') setIntegrityStatus('clean');
            }
          }

          // ── 2. Forbidden object detection ──
          const forbiddenClasses = Object.keys(CHEAT_DETECTION_RULES);
          let foundCheat: string | null = null;
          for (const pred of predictions) {
            if (forbiddenClasses.includes(pred.class) && pred.score > 0.45) {
              foundCheat = pred.class;
              break;
            }
          }

          if (foundCheat) {
            const rule = CHEAT_DETECTION_RULES[foundCheat];
            // New cheat or same cheat — continue incrementing
            if (cheatRuleRef.current !== foundCheat) {
              cheatRuleRef.current = foundCheat;
              cheatWarningSecondsRef.current = 0;
              setCheatWarning({ ruleKey: foundCheat, ...rule });
              setIntegrityStatus('warning');
              setIntegrityViolations(v => v + 1);
            }
            cheatWarningSecondsRef.current += 1;
            setCheatWarningSeconds(cheatWarningSecondsRef.current);

            if (cheatWarningSecondsRef.current >= rule.gracePeriod) {
              if (detectorIntervalRef.current) clearInterval(detectorIntervalRef.current);
              setCheatWarning(null);
              cheatWarningSecondsRef.current = 0;
              cheatRuleRef.current = null;
              setIntegrityStatus('violated');
              endCall();
            }
          } else {
            // No forbidden object — clear cheat warning
            if (cheatRuleRef.current) {
              cheatRuleRef.current = null;
              cheatWarningSecondsRef.current = 0;
              setCheatWarning(null);
              setCheatWarningSeconds(0);
              if (integrityStatus === 'warning') setIntegrityStatus('clean');
            }
          }
        } catch (e) {
          console.error('Detection error:', e);
        }
      }, 1000);
    } else {
      if (detectorIntervalRef.current) clearInterval(detectorIntervalRef.current);
      setPersonWarning(null);
      warningSecondsRef.current = 0;
      setWarningTimeout(0);
      setCheatWarning(null);
      cheatWarningSecondsRef.current = 0;
      cheatRuleRef.current = null;
    }
    return () => { if (detectorIntervalRef.current) clearInterval(detectorIntervalRef.current); };
  }, [isVideoEnabled, model, isCallActive, personWarning, integrityStatus]);

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
    setIsSpeaking(true);
    isSpeakingRef.current = true;
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis) {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        return resolve();
      }
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.1;
      utter.pitch = 1.0;
      utter.onstart = () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
      };
      utter.onend = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        resolve();
      };
      utter.onerror = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        resolve();
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    });
  }, []);

  // AI Response — reads everything from refs, never stale
  const handleAIResponse = useCallback(async (currentMessages: Message[]) => {
    if (isThinkingRef.current) return;
    setIsThinking(true);
    isThinkingRef.current = true;
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
        setIsSpeaking(true);
        isSpeakingRef.current = true;
        setIsThinking(false);
        isThinkingRef.current = false;
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
      isThinkingRef.current = false;
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

    let hasSubmitted = false;

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
      if (hasSubmitted) return;
      resetWatchdog(); // Reset watchdog on every result
      let current = "";
      for (let i = 0; i < event.results.length; i++) {
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
        if (hasSubmitted) return;
        if (current.trim().length > 2) {
          hasSubmitted = true;
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
      else if (event.error !== "no-speech" && event.error !== "aborted") console.warn("Recognition error:", event.error);
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
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch (_) { }
        recognitionRef.current = null;
      }
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
    <div className="flex items-center gap-4 py-2 border-b border-[var(--sidebar-border)] last:border-0">
      <span className="w-36 shrink-0 text-sm text-[var(--text-slate-or-dark)] font-bold">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--sidebar-profile-bg)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] rounded-full"
        />
      </div>
      <span className="w-10 text-right text-sm font-black text-[var(--text-white-or-dark)]">{value}%</span>
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center bg-[var(--background)] transition-colors duration-300">
        <Loader2 size={40} className="animate-spin text-[#3b82f6]" />
        <div className="space-y-2">
          <p className="text-xl font-bold text-[var(--text-white-or-dark)] font-display">Parsing Communication Core & Technical Depth...</p>
          <p className="text-xs text-[var(--text-slate-or-dark)] font-black uppercase tracking-widest animate-pulse text-glow-cyan">Sarah AI Engine is evaluating semantic performance logs</p>
        </div>
      </div>
    );
  }

  /* ─── Report screen ─── */
  if (report) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-12 px-4 text-[var(--foreground)] transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto bg-[var(--card-bg)] border border-[#E7E5E4] p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0A1628]/10 blur-[120px] pointer-events-none rounded-full" />
          {/* Header */}
          <div className="border-b border-[var(--sidebar-border)] pb-6 mb-8">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#2563eb] mb-1.5 text-glow-cyan">MockMate — InterviewerAI Core</p>
                <h1 className="text-2xl font-black text-[var(--text-white-or-dark)] font-display uppercase tracking-wide">Interview Diagnostic Report</h1>
                <p className="text-xs text-[var(--text-slate-or-dark)] font-bold mt-1">{selectedDomain} Standard Assessment</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black text-[var(--text-white-or-dark)] leading-none font-display text-glow-violet">{report.overallScore}</div>
                <div className="text-[9px] uppercase tracking-widest text-[var(--text-slate-or-dark)] font-black mt-1">SCORE / 100</div>
                <div className="mt-3 inline-block border border-[#0A1628]/20 bg-[#00021C]/10 text-[#3b82f6] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg">
                  {report.recommendation}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 mb-8">
            <button onClick={downloadReport}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--sidebar-profile-bg)] hover:bg-[var(--card-bg-hover)] border border-[var(--sidebar-border)] text-[var(--text-white-or-dark)] text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Download PDF Report
            </button>
            <button onClick={resetAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] hover:from-[#00021C] hover:to-[#00021C] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all hover:shadow-[0_0_15px_rgba(59,0,32,0.45)] cursor-pointer active:scale-95">
              <RotateCcw size={14} className="stroke-[2.5px]" /> New Assessment
            </button>
          </div>

          {/* Verdict */}
          <div className="mb-8 p-5 bg-[var(--sidebar-profile-bg)] border border-[var(--sidebar-border)] rounded-2xl">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-slate-or-dark)] mb-2.5">Overall Diagnostic Verdict</p>
            <p className="text-base font-bold text-[var(--text-white-or-dark)] mb-1.5 font-display">{report.verdict}</p>
            <p className="text-xs text-[var(--text-slate-or-dark)] leading-relaxed font-bold">{report.summary}</p>
          </div>

          {/* Performance Breakdown */}
          <div className="mb-8 space-y-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-slate-or-dark)] mb-1">Performance Breakdown</p>
            <ScoreBar label="Communication" value={report.scores.communication} />
            <ScoreBar label="Technical Depth" value={report.scores.technicalDepth} />
            <ScoreBar label="Confidence" value={report.scores.confidence} />
            <ScoreBar label="Problem Solving" value={report.scores.problemSolving} />

            <div className="mt-6 pt-6 border-t border-[var(--sidebar-border)]">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-slate-or-dark)] mb-3">Nervousness Detection</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--text-slate-or-dark)]">Anxiety Index</span>
                <span className="text-sm font-black text-[var(--text-white-or-dark)] font-display">{report.nervousnessLevel}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--sidebar-profile-bg)] rounded-full overflow-hidden border border-[var(--sidebar-border)]">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${report.nervousnessLevel}%` }}
                  className={`h-full ${report.nervousnessLevel > 50 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-[#0A1628] shadow-[0_0_8px_rgba(6,182,212,0.5)]'}`}
                />
              </div>
              <p className="text-[9px] text-[var(--text-slate-or-dark)] mt-2 font-semibold italic">* Analyzed via real-time speech analytics, filler words, and acoustic response latencies.</p>
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-5 bg-[var(--sidebar-profile-bg)] border border-[var(--sidebar-border)] rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-3">Core Strengths</p>
              <ul className="space-y-2">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs text-[var(--text-slate-or-dark)] leading-relaxed font-bold">
                    <span className="text-emerald-500 shrink-0 font-bold">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5 bg-[var(--sidebar-profile-bg)] border border-[var(--sidebar-border)] rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-slate-or-dark)] mb-3">Areas to Improve</p>
              <ul className="space-y-2">
                {report.improvements.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs text-[var(--text-slate-or-dark)] leading-relaxed font-bold">
                    <span className="text-[#2563eb] shrink-0 font-bold">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Feedback */}
          <div className="mb-8 border-l-2 border-[#00021C] bg-[var(--sidebar-profile-bg)] p-5 rounded-r-2xl border border-[var(--sidebar-border)]">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#2563eb] mb-2.5">Detailed Advisory Feedback</p>
            <p className="text-xs text-[var(--text-slate-or-dark)] leading-relaxed font-bold">{report.detailedFeedback}</p>
          </div>

          {/* Topics */}
          <div className="mb-8">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-slate-or-dark)] mb-3">Topics Discussed</p>
            <div className="flex flex-wrap gap-1.5">
              {report.topicsDiscussed.map((t, i) => (
                <span key={i} className="px-2.5 py-1 bg-[var(--sidebar-profile-bg)] border border-[var(--sidebar-border)] text-[var(--text-slate-or-dark)] text-xs rounded-lg font-bold">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--sidebar-border)] pt-4 flex justify-between items-center opacity-60">
            <p className="text-[10px] font-bold text-[var(--text-slate-or-dark)] uppercase tracking-wider">InterviewerAI by MockMate</p>
            <p className="text-[10px] font-bold text-[var(--text-slate-or-dark)] uppercase tracking-wider">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── Pre-call screen ─── */
  if (!isCallActive) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-[var(--card-bg)] border border-[#E7E5E4] rounded-3xl p-10 text-center shadow-lg relative overflow-hidden"
        >
          {/* Logo & Wave Animation Container */}
          <div className="relative w-36 h-36 mx-auto mb-4 flex items-center justify-center">
            {/* Pulsing Concentric Sound Waves (Outer to Inner) */}
            <div className="absolute inset-0 rounded-full border border-[var(--primary)]/5 dark:border-white/5 animate-pulse-glow animate-pulse" />
            <div className="absolute inset-4 rounded-full border border-[var(--primary)]/10 dark:border-white/10" />
            <div className="absolute inset-8 rounded-full border border-[var(--primary)]/20 dark:border-white/15" />

            {/* Center Vibrant Icon Box */}
            <div className="relative z-10 w-16 h-16 bg-gradient-to-tr from-[#635BFF] to-[#7C74FF] dark:from-[#635BFF]/95 dark:to-[#7C74FF]/95 rounded-full flex items-center justify-center text-white shadow-lg shadow-[#635BFF]/20 dark:shadow-[#635BFF]/10 transition-transform duration-300 hover:scale-105">
              <Mic size={28} className="stroke-[2.2px]" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-[var(--text-white-or-dark)] uppercase tracking-widest mb-1.5 font-display transition-colors">
            Mockmate
          </h1>
          <p className="text-[#635BFF] font-black uppercase tracking-[0.2em] text-[10px] mb-8 transition-colors">
            Secure Voice Line • Diagnostic Assessment
          </p>

          <div className="space-y-4 text-left mb-6">
            <label className="text-[10px] font-black text-[var(--text-slate-or-dark)] uppercase tracking-[0.25em] mb-3 block transition-colors">
              Select Assessment Line
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DOMAINS.map((d) => {
                const IconComponent = getDomainIcon(d);
                const isSelected = selectedDomain === d && !isCustomDomain;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setSelectedDomain(d); setIsCustomDomain(false); }}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-95 text-left ${isSelected
                      ? "border-[#635BFF] bg-[#635BFF]/5 dark:bg-[#635BFF]/10 text-[#635BFF] dark:text-[#7C74FF] shadow-sm font-black"
                      : "border-[var(--border)] bg-[var(--card-bg)] hover:border-[#635BFF]/30 dark:hover:border-[#635BFF]/35 text-[var(--text-slate-or-dark)] hover:text-[var(--text-white-or-dark)]"
                      }`}
                  >
                    <IconComponent size={15} className={`shrink-0 transition-colors ${isSelected ? "text-[#635BFF] dark:text-[#7C74FF]" : "text-[var(--text-slate-or-dark)]"}`} />
                    <span className="truncate">{d}</span>
                  </button>
                );
              })}

              {/* Other / Custom Button */}
              <button
                type="button"
                onClick={() => { setIsCustomDomain(true); setSelectedDomain(null); }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-95 text-left ${isCustomDomain
                  ? "border-[#635BFF] bg-[#635BFF]/5 dark:bg-[#635BFF]/10 text-[#635BFF] dark:text-[#7C74FF] shadow-sm font-black"
                  : "border-[var(--border)] bg-[var(--card-bg)] hover:border-[#635BFF]/30 dark:hover:border-[#635BFF]/35 text-[var(--text-slate-or-dark)] hover:text-[var(--text-white-or-dark)]"
                  }`}
              >
                <Grid size={15} className={`shrink-0 transition-colors ${isCustomDomain ? "text-[#635BFF] dark:text-[#7C74FF]" : "text-[var(--text-slate-or-dark)]"}`} />
                <span className="truncate">Other / Custom</span>
              </button>
            </div>

            <AnimatePresence>
              {isCustomDomain && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden pt-2"
                >
                  <label className="text-[10px] font-black text-[var(--text-slate-or-dark)] uppercase tracking-[0.25em] mb-2 block transition-colors">
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
                    className="w-full px-4 py-3.5 bg-[var(--card-bg)] border border-[var(--border)] focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/15 rounded-xl text-xs font-bold text-[var(--text-white-or-dark)] focus:outline-none transition-all placeholder:text-[var(--text-slate-or-dark)]/50"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            disabled={!selectedDomain || (isCustomDomain && !customDomainValue.trim())}
            onClick={startCall}
            className="w-full py-4.5 bg-[#635BFF] hover:bg-[#7C74FF] disabled:opacity-20 text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#635BFF]/15 disabled:cursor-not-allowed mb-6"
          >
            <Phone size={14} className="stroke-[2.5px]" /> Start Mock Interview
          </button>

          {/* Integrity Monitor Notice */}
          <div className="p-5 bg-[#FFF7ED] dark:bg-amber-950/10 border border-[#FFEDD5] dark:border-amber-950/20 rounded-2xl text-left space-y-4 transition-colors">
            <div className="flex items-center gap-2.5">
              <Shield size={14} className="text-[#C2410C] dark:text-amber-500 shrink-0 stroke-[2px]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C2410C] dark:text-amber-500">
                AI Integrity Monitor Active
              </span>
            </div>

            <p className="text-[10px] text-[#C2410C]/80 dark:text-gray-400 font-semibold leading-relaxed">
              This interview is monitored by an AI anti-cheat system. The following are <strong className="text-[#C2410C] dark:text-amber-500 font-extrabold uppercase">strictly prohibited</strong> during the session:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3.5 gap-x-6">
              {[
                { icon: '📱', text: 'Mobile phones' },
                { icon: '🎧', text: 'Earpieces / headphones' },
                { icon: '👥', text: 'Other persons' },
                { icon: '📚', text: 'Books / notes' },
                { icon: '💻', text: 'Second screens in view' },
                { icon: '🎮', text: 'Remote devices' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-[9px] font-extrabold text-[#C2410C]/80 dark:text-gray-400 uppercase tracking-wider">
                  <span className="text-xs shrink-0 select-none">{icon}</span>
                  <span className="truncate leading-none">{text}</span>
                </div>
              ))}
            </div>

            <p className="text-[9px] text-[#C2410C] dark:text-red-400 font-black uppercase tracking-[0.15em] border-t border-[#FFEDD5]/40 dark:border-amber-950/25 pt-3">
              Violations will terminate the interview immediately.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[#635BFF] transition-colors">
            <ShieldCheck size={15} className="shrink-0 stroke-[2px]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure AI Diagnostic Node</span>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── Active call screen ─── */
  return (
    <div className="fixed inset-0 bg-[#0B0D13] z-[100] flex flex-col items-center overflow-hidden font-sans select-none">
      {/* Background Blurs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-900/[0.03] blur-[120px] rounded-full pointer-events-none" />

      {/* ─── Cheat Warning Overlay ─── */}
      <AnimatePresence>
        {cheatWarning && (() => {
          const rule = CHEAT_DETECTION_RULES[cheatWarning.ruleKey];
          const colors = SEVERITY_COLORS[cheatWarning.severity];
          const pct = (cheatWarningSeconds / cheatWarning.gracePeriod) * 100;
          const remaining = cheatWarning.gracePeriod - cheatWarningSeconds;
          return (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`absolute top-0 left-0 right-0 z-[200] ${colors.bg} backdrop-blur-lg border-b ${colors.border} shadow-xl`}
            >
              <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${colors.border} bg-white/5`}>
                  {cheatWarning.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${colors.text}`}>
                      {cheatWarning.severity === 'critical' ? '🚨 CRITICAL' : cheatWarning.severity === 'high' ? '⚠ HIGH ALERT' : '⚡ WARNING'} — {cheatWarning.label} Detected
                    </span>
                  </div>
                  <p className="text-white/80 text-xs font-semibold truncate">{cheatWarning.message}</p>
                  {/* Grace period bar */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        style={{ width: `${pct}%` }}
                        className={`h-full ${colors.bar} transition-all duration-1000`}
                      />
                    </div>
                    <span className={`text-[10px] font-black ${colors.text} shrink-0`}>
                      Terminating in {remaining}s
                    </span>
                  </div>
                </div>
                <AlertTriangle className={`w-5 h-5 ${colors.text} shrink-0 animate-pulse`} />
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

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
            {/* Integrity Monitor badge */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border transition-all duration-500 ${integrityStatus === 'violated'
              ? 'bg-red-900/40 border-red-500/40'
              : integrityStatus === 'warning'
                ? 'bg-orange-900/40 border-orange-500/40'
                : 'bg-emerald-900/30 border-emerald-500/30'
              }`}>
              <Shield size={10} className={integrityStatus === 'clean' ? 'text-emerald-400' : integrityStatus === 'warning' ? 'text-orange-400 animate-pulse' : 'text-red-400'} />
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${integrityStatus === 'clean' ? 'text-emerald-400' : integrityStatus === 'warning' ? 'text-orange-400' : 'text-red-400'
                }`}>
                {integrityStatus === 'clean' ? 'Integrity OK' : integrityStatus === 'warning' ? 'Warning' : 'Violated'}
              </span>
              {integrityViolations > 0 && (
                <span className="text-[8px] font-black text-red-400">×{integrityViolations}</span>
              )}
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
              <>
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale-[10%]" />

                {/* Model Loading Status overlay */}
                {isModelLoading && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-40">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-3">
                      <Loader2 className="animate-spin text-emerald-400" size={20} />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Loading Integrity Monitor</p>
                    <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Initializing AI object detection • COCO-SSD</p>
                    <div className="mt-3 flex gap-2 text-[8px] text-slate-600 font-black uppercase tracking-wider">
                      <span>📱 Phone</span>
                      <span>📚 Books</span>
                      <span>👥 Multi-person</span>
                    </div>
                  </div>
                )}

                {/* Person Detection Warning Overlay */}
                <AnimatePresence>
                  {personWarning && !cheatWarning && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-50"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="w-14 h-14 bg-red-500/15 border border-red-500/40 rounded-2xl flex items-center justify-center text-red-400 mb-5"
                      >
                        <AlertCircle size={28} />
                      </motion.div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight mb-2">Multiple People Detected</h3>
                      <p className="text-[11px] text-red-300 font-semibold max-w-xs mx-auto leading-relaxed mb-6">
                        {personWarning}
                      </p>
                      <div className="w-52 space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black text-red-400 uppercase tracking-widest">
                          <span>Terminating in</span>
                          <span className="text-lg font-black">{10 - warningTimeout}s</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            style={{ width: `${(warningTimeout / 10) * 100}%` }}
                            className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-all duration-1000"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
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
