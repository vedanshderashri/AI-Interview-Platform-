"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/ui/Header";
import { AiCharacter } from "@/components/AiCharacter";
import {
  Brain, Mic, Loader2, PhoneOff, AlertCircle, Sparkles, Clock, Phone, ArrowRight, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DOMAINS = ["Frontend", "Backend", "Full Stack", "Data Science", "Mobile", "DevOps"];

export default function TavusInterviewPage() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [customDomainValue, setCustomDomainValue] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Timer States
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer Tick Hook
  useEffect(() => {
    if (isInterviewActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsInterviewActive(false);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isInterviewActive, timeLeft]);

  const startTavusInterview = async () => {
    if (!selectedDomain) return;
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch("/api/tavus/start-conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedTopics: [selectedDomain],
          experienceLevel: "Senior",
          duration: 5, // 5-minute session prompt allocation
          candidateName: "Candidate",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to start Tavus interview: ${errText}`);
      }

      const data = await response.json();
      if (data.conversationUrl) {
        setConversationUrl(data.conversationUrl);
        setConversationId(data.conversationId);
        setIsInterviewActive(true);
        setTimeLeft(300); // Reset to 5 minutes
      } else {
        throw new Error("No conversation URL returned from Tavus.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to initialize interactive video node.");
    } finally {
      setIsConnecting(false);
    }
  };

  const endSession = () => {
    setIsInterviewActive(false);
    setConversationUrl(null);
    setConversationId(null);
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetInterview = () => {
    setSelectedDomain(null);
    setIsCustomDomain(false);
    setCustomDomainValue("");
    setConversationUrl(null);
    setConversationId(null);
    setIsFinished(false);
    setTimeLeft(300);
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen text-[var(--foreground)] flex flex-col transition-colors duration-300">
      <Header
        title="Live Avatar Interview"
        subtitle="Interactive Video Screenings // Powered by Tavus AI Replica Engine"
      />

      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">

          {/* Welcome Setup View */}
          {!conversationUrl && !isFinished && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md w-full mx-auto bg-[var(--card-bg)] border border-[var(--sidebar-border)] rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#0A1628]/10 blur-[80px] pointer-events-none rounded-full" />

              <div className="w-16 h-16 bg-gradient-to-tr from-[#0A1628] to-[#1a3a6b] rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-[0_0_20px_rgba(59,0,32,0.5)]">
                <Brain size={28} />
              </div>
              <h1 className="text-2xl font-black text-[var(--text-white-or-dark)] text-center uppercase tracking-tight mb-1.5 font-display">Interview</h1>
              <p className="text-[#2563eb] text-center font-black uppercase tracking-[0.2em] text-[9px] mb-8 text-glow-cyan">
                5 Minute Round
              </p>

              <div className="space-y-5 text-left mb-8">
                <label className="text-[9px] font-black text-[var(--text-slate-or-dark)] uppercase tracking-[0.2em] mb-2 block">
                  Select Technical Domain
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DOMAINS.map((d) => (
                    <button
                      key={d}
                      onClick={() => { setSelectedDomain(d); setIsCustomDomain(false); }}
                      className={`py-3 rounded-xl border transition-all duration-300 font-bold text-xs uppercase tracking-wider cursor-pointer ${selectedDomain === d && !isCustomDomain
                        ? "border-[#0A1628] bg-gradient-to-r from-[#0A1628] to-[#0F2547] text-white shadow-[0_0_12px_rgba(59,0,32,0.4)]"
                        : "border-[var(--sidebar-border)] bg-[var(--sidebar-profile-bg)] hover:border-[#0A1628]/20 text-[var(--text-slate-or-dark)] hover:text-[var(--text-white-or-dark)]"
                        }`}
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    onClick={() => { setIsCustomDomain(true); setSelectedDomain(null); }}
                    className={`py-3 rounded-xl border transition-all duration-300 font-bold text-xs uppercase tracking-wider cursor-pointer ${isCustomDomain
                      ? "border-[#0A1628] bg-gradient-to-r from-[#0A1628] to-[#0F2547] text-white shadow-[0_0_12px_rgba(59,0,32,0.4)]"
                      : "border-[var(--sidebar-border)] bg-[var(--sidebar-profile-bg)] hover:border-[#0A1628]/20 text-[var(--text-slate-or-dark)] hover:text-[var(--text-white-or-dark)]"
                      }`}
                  >
                    Custom Domain
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
                      <label className="text-[9px] font-black text-[var(--text-slate-or-dark)] uppercase tracking-[0.2em] mb-2 block">
                        Enter Domain Name
                      </label>
                      <input
                        type="text"
                        value={customDomainValue}
                        onChange={(e) => {
                          setCustomDomainValue(e.target.value);
                          setSelectedDomain(e.target.value);
                        }}
                        placeholder="e.g. Mobile Developer"
                        className="w-full px-4 py-3 bg-[var(--sidebar-profile-bg)] border border-[var(--sidebar-border)] focus:border-[#0A1628] focus:ring-2 focus:ring-[#0A1628]/20 rounded-xl text-sm font-bold text-[var(--text-white-or-dark)] focus:outline-none transition-all placeholder:text-[var(--text-slate-or-dark)]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 mb-6">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="text-xs font-bold leading-relaxed">{error}</span>
                </div>
              )}

              <button
                disabled={!selectedDomain || isConnecting || (isCustomDomain && !customDomainValue.trim())}
                onClick={startTavusInterview}
                className="w-full py-4 bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] hover:from-[#00021C] hover:to-[#00021C] disabled:opacity-20 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_20px_rgba(59,0,32,0.5)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Connecting to Avatar Replica...
                  </>
                ) : (
                  <>
                    <Phone size={16} /> Establish Video Link
                  </>
                )}
              </button>

              <div className="mt-8 flex items-center justify-center gap-2 text-[var(--text-slate-or-dark)]">
                <ShieldCheck size={14} className="text-[#2563eb]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-glow-cyan text-[#2563eb]">Secure Tavus WebRTC Node</span>
              </div>
            </motion.div>
          )}

          {/* Active CVI Call View */}
          {conversationUrl && !isFinished && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-4xl mx-auto flex flex-col gap-6"
            >
              {/* Call Control Strip */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-[var(--card-bg)] border border-[var(--sidebar-border)] rounded-2xl shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0A1628]/20 border border-[#0A1628]/20 flex items-center justify-center text-[#3b82f6]">
                    <Mic className="animate-pulse" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-white-or-dark)] uppercase text-sm font-display tracking-wide">{selectedDomain} Assessment</h3>
                    <p className="text-[9px] font-black text-[var(--text-slate-or-dark)] uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Conversational Video Channel
                    </p>
                  </div>
                </div>

                {/* Cyber-Glass Timer Countdown */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-[var(--sidebar-profile-bg)] border border-[var(--sidebar-border)] rounded-xl">
                    <Clock size={14} className={timeLeft < 60 ? "text-red-400 animate-pulse" : "text-[#3b82f6] animate-spin [animation-duration:8s]"} />
                    <span className={`text-sm font-black font-mono tracking-wider ${timeLeft < 60 ? "text-red-400 text-glow-red" : "text-[var(--text-white-or-dark)]"}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>

                  <button
                    onClick={endSession}
                    className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] active:scale-95 flex items-center gap-2"
                  >
                    <PhoneOff size={14} /> End Call
                  </button>
                </div>
              </div>

              {/* Tavus CVI Frame Iframe Box */}
              <div className="aspect-video w-full rounded-3xl overflow-hidden border border-[var(--sidebar-border)] bg-[#050508] shadow-2xl relative">
                <AiCharacter
                  isSpeaking={false}
                  isThinking={false}
                  name="Mockmate"
                  conversationUrl={conversationUrl}
                />
              </div>

              {/* Security Warning Notice */}
              <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
                <p className="text-[10px] font-bold leading-normal uppercase tracking-wider">
                  Caution: Keep your camera and mic enabled throughout. The session will automatically close once the 5-minute round limit expires.
                </p>
              </div>
            </motion.div>
          )}

          {/* Assessment Completed View */}
          {isFinished && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md w-full mx-auto bg-[var(--card-bg)] border border-[var(--sidebar-border)] rounded-3xl p-8 md:p-10 shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 blur-[80px] pointer-events-none rounded-full" />

              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Sparkles size={28} />
              </div>
              <h1 className="text-2xl font-black text-[var(--text-white-or-dark)] uppercase tracking-tight mb-2.5 font-display">Interview Completed</h1>
              <p className="text-[var(--text-slate-or-dark)] text-xs font-bold leading-relaxed max-w-xs mx-auto mb-8">
                Your 5-minute session.              </p>

              <button
                onClick={resetInterview}
                className="w-full py-4 bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] hover:from-[#00021C] hover:to-[#00021C] text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_20px_rgba(59,0,32,0.5)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                Establish New Session <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
