'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Upload, CheckCircle, AlertCircle, FileText, Sparkles, TrendingUp, Search, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResumeATSChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

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
    <div className="min-h-screen w-full flex flex-col relative bg-[#ffffff] text-black font-inter selection:bg-black/20">
      <Header
        title="Resume ATS Checker"
        subtitle="Optimize your career potential with advanced AI analysis"
      />

      <main className="flex-1 w-full px-4 md:px-8 py-12">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Hero / Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-black">
                Analyze. Optimize. Succeed.
              </h1>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Our AI-powered analyzer scans your resume against industry standards to give you a competitive edge.
              </p>
            </div>

            <GlassCard className="border-black-800 bg-white-900/50 backdrop-blur-xl">
              <div className="p-10">
                {!analysis && !loading ? (
                  <div className="space-y-8">
                    <label className="flex flex-col items-center justify-center w-full aspect-[21/9] border-2 border-dashed border-zinc-700 rounded-2xl cursor-pointer hover:border-[#4CAF50]/50 hover:bg-zinc-800/30 transition-all group">
                      <div className="flex flex-col items-center justify-center text-center p-6">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8 text-zinc-400 group-hover:text-[#ffffff]" />
                        </div>
                        <p className="text-xl font-medium text-white mb-2">
                          {file ? file.name : 'Upload your Resume'}
                        </p>
                        <p className="text-zinc-500">Drag and drop or click to browse (PDF only)</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400"
                      >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                      </motion.div>
                    )}

                    <GradientButton
                      onClick={handleAnalyze}
                      disabled={!file || loading}
                      className="bg-[#0f172b] w-full h-14 text-lg font-semibold tracking-wide"
                    >
                      {loading ? 'Analyzing Profile...' : 'Analyze...'}
                    </GradientButton>
                  </div>
                ) : loading ? (
                  <div className="py-12 space-y-8 flex flex-col items-center">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle className="text-zinc-800" strokeWidth="4" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                        <motion.circle
                          className="text-[#4CAF50]"
                          strokeWidth="4"
                          strokeDasharray={283}
                          strokeDashoffset={283 - (283 * progress) / 100}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="45"
                          cx="50"
                          cy="50"
                          initial={{ strokeDashoffset: 283 }}
                          animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-white">{Math.round(progress)}%</span>
                        <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Analyzing</span>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-medium text-white">Evaluating Resume Context</h3>
                      <p className="text-zinc-400 max-w-xs">Scanning for keywords, structure, and professional impact...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-[#4CAF50]">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{file?.name}</h3>
                        <p className="text-xs text-zinc-500">Analysis completed successfully</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setAnalysis(null); setFile(null); }}
                      className="text-sm text-zinc-500 hover:text-white transition-colors"
                    >
                      Upload New
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Score Summary */}
                <div className="lg:col-span-3">
                  <GlassCard className="border-zinc-800 bg-zinc-900/40">
                    <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
                      <div className="relative w-40 h-40 flex-shrink-0">
                        <div className="absolute inset-0 bg-[#4CAF50]/20 blur-3xl rounded-full" />
                        <div className="relative w-full h-full rounded-full border-4 border-zinc-800 flex flex-col items-center justify-center bg-zinc-950">
                          <span className="text-6xl font-bold text-white leading-none">{analysis.final_score}</span>
                          <span className="text-xs text-zinc-500 uppercase tracking-tighter mt-1">ATS Score</span>
                        </div>
                      </div>
                      <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="inline-flex px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                          Overall Rating: <span className="ml-1 text-[#4CAF50]">{analysis.rating}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white">Executive Summary</h2>
                        <p className="text-zinc-400 text-lg leading-relaxed">{analysis.overall_feedback}</p>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* Section Breakdown */}
                <div className="lg:col-span-2 space-y-8">
                  <GlassCard className="border-zinc-800 bg-zinc-900/30">
                    <div className="p-8">
                      <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#4CAF50]" />
                        Section Breakdown
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {analysis.scores && Object.entries(analysis.scores).map(([key, value]: [string, any]) => (
                          <div key={key} className="space-y-3">
                            <div className="flex justify-between items-end text-sm">
                              <span className="text-zinc-400 capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="font-bold text-white">{value}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>

                  {/* Recommendations */}
                  <GlassCard className="border-zinc-800 bg-zinc-900/30">
                    <div className="p-8">
                      <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#4CAF50]" />
                        Priority Recommendations
                      </h3>
                      <div className="space-y-4">
                        {analysis.suggestions && analysis.suggestions.map((suggestion: string, idx: number) => (
                          <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="flex items-start gap-4 p-4 bg-zinc-800/40 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                            <div className="mt-1 w-5 h-5 rounded-full bg-[#4CAF50]/10 border border-[#4CAF50]/30 flex items-center justify-center flex-shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]" />
                            </div>
                            <span className="text-zinc-300">{suggestion}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* Sidebar Details */}
                <div className="space-y-8">
                  <GlassCard className="border-zinc-800 bg-zinc-900/30">
                    <div className="p-8">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Search className="w-5 h-5 text-[#4CAF50]" />
                        Keywords
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Matched</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.matched_keywords?.map((k: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-white text-black text-xs font-bold rounded-md">{k}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Missing</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.missing_keywords?.map((k: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs rounded-md">{k}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Insights */}
                  <GlassCard className="border-zinc-800 bg-zinc-900/30">
                    <div className="p-8">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#4CAF50]" />
                        Key Insights
                      </h3>
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Strengths</p>
                          {analysis.strengths?.map((s: string, i: number) => (
                            <div key={i} className="flex gap-2 text-sm text-zinc-300">
                              <CheckCircle className="w-4 h-4 text-[#4CAF50] flex-shrink-0" />
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Improvements</p>
                          {analysis.weaknesses?.map((w: string, i: number) => (
                            <div key={i} className="flex gap-2 text-sm text-zinc-400">
                              <AlertCircle className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
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
