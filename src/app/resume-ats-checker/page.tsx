'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Upload, CheckCircle, AlertCircle, FileText, Sparkles, TrendingUp, Search, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResumeATSChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      if (uploadedFile.type === 'application/pdf' || uploadedFile.name.endsWith('.pdf')) {
        setFile(uploadedFile);
        setError('');
        setAnalysis(null);
        setProgress(0);
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
        setError('');
        setAnalysis(null);
        setProgress(0);
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  // Simulate progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) return prev;
          const increment = Math.random() * 10;
          return Math.min(prev + increment, 98);
        });
      }, 500);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (jobDescription.trim()) {
        formData.append('jobDescription', jobDescription);
      }

      const response = await fetch('/api/ats-check', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data);
      } else {
        setError(data.error || 'Failed to analyze resume');
      }
    } catch (err) {
      setError('Error analyzing resume. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative text-[var(--foreground)] transition-colors duration-300 font-inter">
      <Header
        title="Resume ATS Checker"
        subtitle="Optimize your career potential with advanced AI analysis // Matrix Engine"
      />

      <main className="flex-1 w-full px-6 md:px-8 py-12">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Hero / Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-4 text-[var(--text-white-or-dark)] leading-tight font-display">
                Analyze. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] to-[#1a3a6b] text-glow-violet">Optimize.</span> Succeed.
              </h1>
              <p className="text-[var(--text-slate-or-dark)] text-sm md:text-base max-w-xl mx-auto leading-relaxed font-bold">
                Scan your profile against industry algorithmic standards instantly. Acquire high-fidelity semantic keywords and diagnostic optimization steps.
              </p>
            </div>

            <GlassCard variant="elevated" className="border-[var(--sidebar-border)] bg-[var(--card-bg)] overflow-hidden shadow-2xl relative">
              {/* Scanline Animation Effect */}
              {loading && (
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#00021C] to-transparent shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-bounce" />
              )}
              
              <div className="p-4 md:p-8">
                {!analysis && !loading ? (
                   <div className="space-y-6">
                    <label 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex flex-col items-center justify-center w-full aspect-[21/8] border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group ${
                        isDragging 
                          ? "border-[#00021C] bg-[#0A1628]/5 shadow-[0_0_20px_rgba(6,182,212,0.15)] scale-[1.01]" 
                          : "border-[var(--sidebar-border)] hover:border-[#0A1628]/30 hover:bg-white/[0.01]"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 pointer-events-none">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-2 transition-all duration-300 ${
                          isDragging
                            ? "bg-[#0A1628]/10 border-[#00021C] text-[#3b82f6] shadow-[0_0_15px_rgba(6,182,212,0.25)] scale-110"
                            : "bg-[var(--sidebar-profile-bg)] border-[var(--sidebar-border)] text-[#2563eb] group-hover:scale-105 group-hover:border-[#0A1628]/20 group-hover:shadow-[0_0_15px_rgba(59,0,32,0.45)] group-hover:text-[#3b82f6]"
                        }`}>
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className={`text-lg font-bold transition-colors ${isDragging ? "text-[#3b82f6]" : "text-[var(--text-white-or-dark)]"}`}>
                          {isDragging ? "Drop Resume Here" : (file ? file.name : 'Upload Resume Document')}
                        </p>
                        <p className={`text-xs font-black uppercase tracking-wider ${isDragging ? "text-[#60a5fa]" : "text-[var(--text-slate-or-dark)]"}`}>
                          {isDragging ? "Release to Scan Profile" : "Drag & drop or browse local storage (PDF only)"}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="space-y-2 text-left">
                      <label className="text-[9px] font-black text-[var(--text-slate-or-dark)] uppercase tracking-[0.2em] block">
                        Target Job Description (Optional)
                      </label>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the target job description here to perform a highly tailored gap analysis..."
                        className="w-full h-32 px-4 py-3 bg-[var(--sidebar-profile-bg)] border border-[var(--sidebar-border)] focus:border-[#0A1628] focus:ring-2 focus:ring-[#0A1628]/20 rounded-xl text-xs font-bold text-[var(--text-white-or-dark)] focus:outline-none transition-all placeholder:text-[var(--text-slate-or-dark)] resize-none"
                      />
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"
                      >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider">{error}</span>
                      </motion.div>
                    )}

                    <GradientButton
                      onClick={handleAnalyze}
                      disabled={!file || loading}
                      className="w-full h-14 text-sm font-black tracking-widest uppercase shadow-lg shadow-[#00021C]/20"
                    >
                      {loading ? 'Processing Document Context...' : 'Initialize Diagnosis'}
                    </GradientButton>
                  </div>
                ) : loading ? (
                  <div className="py-12 space-y-8 flex flex-col items-center">
                    <div className="relative w-44 h-44">
                      {/* Diagnostic circular ring */}
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-white/5" strokeWidth="4" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
                        <motion.circle
                          className="text-[#3b82f6]"
                          strokeWidth="4"
                          strokeDasharray={263.8}
                          strokeDashoffset={263.8 - (263.8 * progress) / 100}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="42"
                          cx="50"
                          cy="50"
                          initial={{ strokeDashoffset: 263.8 }}
                          animate={{ strokeDashoffset: 263.8 - (263.8 * progress) / 100 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-[var(--text-white-or-dark)] leading-none font-display">{Math.round(progress)}%</span>
                        <span className="text-[8px] text-[#3b82f6] font-bold uppercase tracking-widest mt-1 text-glow-cyan">Analyzing</span>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-bold text-[var(--text-white-or-dark)] font-display">Evaluating Resume Semantics</h3>
                      <p className="text-[var(--text-slate-or-dark)] text-xs font-bold max-w-xs mx-auto leading-relaxed">Scanning neural nodes for keywords, format syntax, and overall career impact indexing...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-2">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[var(--sidebar-profile-bg)] border border-[var(--sidebar-border)] rounded-xl flex items-center justify-center text-[#3b82f6] shadow-[0_0_15px_rgba(59,0,32,0.3)]">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[var(--text-white-or-dark)] text-base font-display">{file?.name}</h3>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                          <CheckCircle className="w-3.5 h-3.5" /> Diagnostic report successfully generated
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setAnalysis(null); setFile(null); setJobDescription(''); }}
                      className="text-xs font-black uppercase tracking-wider text-[var(--text-slate-or-dark)] hover:text-[var(--text-white-or-dark)] border-b border-transparent hover:border-white transition-all cursor-pointer"
                    >
                      Scan Another
                    </button>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Analysis Results */}
          <AnimatePresence>
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="space-y-8 animate-fade-in"
              >
                {/* Score Summary */}
                <GlassCard variant="default" className="border-[var(--sidebar-border)] bg-[var(--card-bg)] relative overflow-hidden">
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
                  
                  <div className="p-4 md:p-8 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative w-36 h-36 flex-shrink-0">
                      <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full animate-pulse" />
                      <div className="relative w-full h-full rounded-full border border-[var(--sidebar-border)] flex flex-col items-center justify-center bg-[var(--sidebar-bg)] shadow-inner">
                        <span className="text-5xl font-black text-[var(--text-white-or-dark)] leading-none font-display text-glow-cyan">{analysis.final_score}</span>
                        <span className="text-[8px] text-[#3b82f6] font-black uppercase tracking-widest mt-1">ATS INDEX</span>
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-4">
                      <div className="inline-flex px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                        RATING: <span className="ml-1 font-extrabold">{analysis.rating}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-[var(--text-white-or-dark)] font-display">Executive Diagnostics Summary</h2>
                      <p className="text-[var(--text-slate-or-dark)] text-sm font-semibold leading-relaxed">{analysis.overall_feedback}</p>
                    </div>
                  </div>
                </GlassCard>

                {/* Section Breakdown and Semantic Keywords Side-by-Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Category Analytics */}
                  <GlassCard variant="default" className="border-[var(--sidebar-border)] bg-[var(--card-bg)]">
                    <div className="p-6 md:p-8">
                      <h3 className="text-lg font-bold text-[var(--text-white-or-dark)] mb-6 flex items-center gap-2 font-display">
                        <TrendingUp className="w-5 h-5 text-[#3b82f6]" />
                        Domain Category Analytics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {analysis.scores && Object.entries(analysis.scores).map(([key, value]: [string, any]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between items-end text-xs">
                              <span className="text-[var(--text-slate-or-dark)] font-bold uppercase tracking-wider capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="font-black text-[var(--text-white-or-dark)]">{value}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--sidebar-profile-bg)] rounded-full overflow-hidden border border-[var(--sidebar-border)]">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${value}%` }}
                                transition={{ duration: 1, delay: 0.4 }}
                                className="h-full bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] rounded-full shadow-[0_0_8px_rgba(59,0,32,0.5)]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>

                  {/* Semantic Keywords (Matched Matrix Only) */}
                  <GlassCard variant="default" className="border-[var(--sidebar-border)] bg-[var(--card-bg)]">
                    <div className="p-6 md:p-8">
                      <h3 className="text-lg font-bold text-[var(--text-white-or-dark)] mb-6 flex items-center gap-2 font-display">
                        <Search className="w-5 h-5 text-[#3b82f6] animate-pulse" />
                        Semantic Keywords
                      </h3>
                      <div className="space-y-5">
                        <div className="space-y-2.5">
                          <p className="text-[9px] font-black text-[var(--text-slate-or-dark)] uppercase tracking-widest">Matched Matrix</p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.matched_keywords?.map((k: string, i: number) => (
                              <span key={i} className="px-2.5 py-1 bg-[#00021C]/10 border border-[#00021C]/20 text-[#2563eb] text-[10px] font-bold rounded-lg shadow-sm">{k}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* Core Strengths/Gaps and Resume Improvement side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Strengths & Gaps */}
                  <GlassCard variant="default" className="border-[var(--sidebar-border)] bg-[var(--card-bg)]">
                    <div className="p-6 md:p-8">
                      <h3 className="text-lg font-bold text-[var(--text-white-or-dark)] mb-6 flex items-center gap-2 font-display">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        Core Diagnostic Analysis
                      </h3>
                      <div className="space-y-6">
                        <div className="space-y-2.5">
                          <p className="text-[9px] font-black text-[var(--text-slate-or-dark)] uppercase tracking-widest">Strengths</p>
                          {analysis.strengths?.map((s: string, i: number) => (
                            <div key={i} className="flex gap-2 text-xs text-[var(--text-slate-or-dark)] leading-relaxed items-start font-bold">
                              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2.5 pt-4 border-t border-[var(--sidebar-border)]">
                          <p className="text-[9px] font-black text-[var(--text-slate-or-dark)] uppercase tracking-widest">Gaps Detected</p>
                          {analysis.weaknesses?.map((w: string, i: number) => (
                            <div key={i} className="flex gap-2 text-xs text-[var(--text-slate-or-dark)] leading-relaxed items-start font-bold">
                              <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  {/* How can candidate improve resume card */}
                  <GlassCard variant="default" className="border-[var(--sidebar-border)] bg-[var(--card-bg)]">
                    <div className="p-6 md:p-8">
                      <h3 className="text-lg font-bold text-[var(--text-white-or-dark)] mb-6 flex items-center gap-2 font-display">
                        <Sparkles className="w-5 h-5 text-[#3b82f6]" />
                        How to Improve Your Resume
                      </h3>
                      <div className="space-y-4">
                        {analysis.suggestions?.map((suggestion: string, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className="flex items-start gap-4 p-4 bg-[var(--sidebar-profile-bg)] rounded-xl border border-[var(--sidebar-border)] hover:border-[#0A1628]/10 hover:bg-[var(--card-bg-hover)] transition-all duration-300"
                          >
                            <div className="mt-1 w-4 h-4 rounded-full bg-[#0A1628]/20 border border-[#0A1628]/20 flex items-center justify-center flex-shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#00021C]" />
                            </div>
                            <span className="text-[var(--text-slate-or-dark)] text-xs leading-relaxed font-bold">{suggestion}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
