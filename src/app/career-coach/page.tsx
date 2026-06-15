'use client';
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { CareerCoachChat } from '@/components/CareerCoachChat';
import { motion } from 'framer-motion';
import { Zap, Lightbulb, ChevronRight, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function CareerCoachPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex flex-col text-[var(--foreground)] transition-colors duration-300">
      <Header
        title="AI Career Coach"
        subtitle="AI-Powered Interview & Career Guidance // Adaptive Core"
      />

      <div className="w-full max-w-7xl mx-auto px-6 md:px-8 lg:px-10 pt-8 pb-20 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Chat Area */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 h-full flex flex-col"
          >
            <CareerCoachChat />
          </motion.div>

          {/* Sidebar with Tips */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Quick Tips */}
            <GlassCard variant="default" className="relative group overflow-hidden border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm transition-all duration-300">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#635BFF]/5 blur-xl pointer-events-none group-hover:opacity-100 transition-opacity rounded-full" />
              
              <h3 className="font-bold text-[var(--text-white-or-dark)] mb-5 flex items-center gap-3 font-display text-base transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#635BFF]/10 flex items-center justify-center text-[#635BFF] dark:text-[#7C74FF] shrink-0">
                  <Lightbulb className="w-4 h-4 text-[#635BFF] dark:text-[#7C74FF] stroke-[2px]" />
                </div>
                Quick Tips
              </h3>
              <div className="space-y-1">
                {[
                  { title: "STAR Method", desc: "Structure answers with Situation, Task, Action, and Result." },
                  { title: "Be Specific", desc: "Use concrete quantitative metrics from your previous work." },
                  { title: "Practice Pacing", desc: "Speak clearly and deliberately, avoiding verbal fillers." },
                  { title: "Ask Questions", desc: "Show strong genuine curiosity about high-impact problems." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 border-b border-[var(--border-light)] py-3 last:border-0 last:pb-0 hover:bg-[var(--sidebar-profile-bg)]/40 rounded-xl px-3 -mx-3 transition-all cursor-pointer group">
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-[var(--text-white-or-dark)] text-xs mb-0.5 transition-colors group-hover:text-[#635BFF] dark:group-hover:text-[#7C74FF]">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[var(--text-slate-or-dark)] leading-normal font-semibold">
                        {item.desc}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-slate-or-dark)] group-hover:text-[#635BFF] dark:group-hover:text-[#7C74FF] transition-colors shrink-0 stroke-[2.5px]" />
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Coaching Engine */}
            <GlassCard variant="default" className="relative group overflow-hidden border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm transition-all duration-300">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#635BFF]/5 blur-xl pointer-events-none group-hover:opacity-100 transition-opacity rounded-full" />
              
              <h3 className="font-bold text-[var(--text-white-or-dark)] mb-5 flex items-center gap-3 font-display text-base transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#635BFF]/10 flex items-center justify-center text-[#635BFF] dark:text-[#7C74FF] shrink-0">
                  <Zap className="w-4 h-4 text-[#635BFF] dark:text-[#7C74FF] stroke-[2px]" />
                </div>
                Coaching Engine
              </h3>
              <ul className="space-y-3.5 text-xs text-[var(--text-slate-or-dark)] font-bold">
                {[
                  "24/7 Holographic Advisor",
                  "Context-Aware Dialogue",
                  "STAR Formatting Checks",
                  "Dynamic Feedback Loop",
                  "Resume & Career Alignments",
                  "Export Chat History Logs"
                ].map((feature, idx) => (
                  <li key={idx} className="flex gap-3 items-center hover:translate-x-1 transition-transform duration-200 cursor-default">
                    <CheckCircle2 className="w-4 h-4 text-[#635BFF] dark:text-[#7C74FF] shrink-0 stroke-[2.5px]" />
                    <span className="text-xs text-[var(--text-slate-or-dark)] font-bold">{feature}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
