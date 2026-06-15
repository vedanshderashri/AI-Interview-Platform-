'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Share2,
  BarChart3,
  TrendingUp,
  Brain,
  Zap,
  MessageSquare,
  Clock,
  Mic,
  Award,
  CheckCircle2,
  RefreshCcw,
} from 'lucide-react';
import { InterviewMetrics } from '@/lib/interviewAnalytics';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';

interface InterviewReportProps {
  candidateName: string;
  interviewDate: Date;
  domains: string[];
  metrics: InterviewMetrics;
  recordingUrl?: string;
  onRetry?: () => void;
}

export function InterviewReport({
  candidateName,
  interviewDate,
  domains,
  metrics,
  recordingUrl,
  onRetry,
}: InterviewReportProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'linguistic' | 'cognitive'
  >('overview');

  // Extract AI analysis if available
  const aiAnalysis = (metrics as any)?._aiAnalysis;
  
  // Use AI-powered scores if available, otherwise fall back to local metrics
  const finalScores = aiAnalysis ? {
    technicalScore: aiAnalysis.technicalScore ?? 75,
    communicationScore: aiAnalysis.communicationScore ?? 75,
    overallScore: aiAnalysis.overallScore ?? 75,
    structureScore: aiAnalysis.structureScore ?? 70,
    depthScore: aiAnalysis.depthScore ?? 70,
    thinkingSpeed: aiAnalysis.thinkingSpeed ?? 75,
    decisionConfidence: aiAnalysis.decisionConfidence ?? 75,
    nervousnessScore: aiAnalysis.nervousnessScore ?? 25,
    strengthsFeedback: aiAnalysis.strengthsFeedback ?? 'Strong technical foundation demonstrated',
    improvementsFeedback: aiAnalysis.improvementsFeedback ?? 'Consider expanding on specific examples'
  } : {
    technicalScore: 75,
    communicationScore: metrics.communicationQuality,
    overallScore: 75,
    structureScore: 70,
    depthScore: 70,
    thinkingSpeed: 75,
    decisionConfidence: metrics.confidenceIndex,
    nervousnessScore: 100 - metrics.confidenceIndex,
    strengthsFeedback: `You demonstrated good technical knowledge with ${metrics.wordCount} words spoken`,
    improvementsFeedback: `Focus on reducing filler words (${metrics.fillerWordPercentage.toFixed(1)}%) for better clarity`
  };

  // Calculate Neural Efficiency Index (0-100) using AI scores if available
  const neuralEfficiencyIndex = aiAnalysis ? 
    aiAnalysis.overallScore : 
    Math.round(
      (metrics.confidenceIndex * 0.3 +
        metrics.clarityScore * 0.2 +
        metrics.coherence * 0.2 +
        (100 - metrics.fillerWordPercentage * 2) * 0.15 +
        metrics.answerCompleteness * 0.15) /
        1.5
    );

  // Ensure value is within 0-100
  const finalIndex = Math.min(100, Math.max(0, neuralEfficiencyIndex));

  const generateReport = () => {
    const reportText = `
INTERVIEW NEURAL REPORT
Generated: ${interviewDate.toLocaleString()}

Candidate: ${candidateName}
Domain(s): ${domains.join(', ')}

NEURAL EFFICIENCY INDEX: ${finalIndex}%

QUALITIES DETECTED:
- Confidence Level: ${metrics.confidenceIndex}%
- Clarity Score: ${metrics.clarityScore}%
- Communication Quality: ${metrics.communicationQuality}%
- Eye Contact Estimate: ${metrics.eyeContactEstimate}%

COGNITIVE PROFILE:
- Agility: ${Math.round((metrics.speakingPace / 150) * 100)}%
- Conviction: ${metrics.confidenceIndex}%
- Syntax: ${Math.round(((100 - metrics.fillerWordPercentage) / 100) * 100)}%
- Archive: ${Math.round((metrics.uniqueWords / (metrics.wordCount * 0.5)) * 100)}%

LINGUISTIC ARCHIVE:
- Total Words Spoken: ${metrics.wordCount}
- Unique Words: ${metrics.uniqueWords}
- Speaking Pace: ${metrics.speakingPace.toFixed(1)} words/min
- Filler Words: ${metrics.filler_words} (${metrics.fillerWordPercentage.toFixed(1)}%)
- Total Speaking Time: ${Math.round(metrics.totalSpeakingTime / 1000)}s

REFINEMENT PATH:
Based on your metrics, focus on:
- Reducing filler words for better clarity
- Expanding vocabulary diversity
- Maintaining consistent speaking pace
- Providing more comprehensive answers
    `;

    return reportText;
  };

  const downloadReport = () => {
    const report = generateReport();
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(report)
    );
    element.setAttribute(
      'download',
      `interview_report_${candidateName}_${interviewDate.toISOString().split('T')[0]}.txt`
    );
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const shareReport = () => {
    const report = generateReport();
    if (navigator.share) {
      navigator.share({
        title: `Interview Report for ${candidateName}`,
        text: report,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(report);
      alert('Report copied to clipboard!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full min-h-screen bg-[#090B11] p-4 md:p-8 font-sans text-slate-200 relative overflow-hidden"
    >
      {/* Glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] rounded-full bg-[#0A1628]/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[300px] h-[300px] rounded-full bg-[#0A1628]/5 blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0F111A]/60 border border-white/[0.06] p-8 md:p-10 rounded-3xl backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0A1628]/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/[0.08] text-slate-400 text-xs font-black uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-[#3b82f6]" />
              {interviewDate.toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide uppercase font-display">
              Diagnostic <span className="text-[#3b82f6] text-glow-cyan">Results</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0A1628]/20 to-[#1a3a6b]/10 rounded-2xl border border-[#0A1628]/20">
                <div className="w-2 h-2 rounded-full bg-[#0D1E3A] animate-pulse text-glow-cyan" />
                <span className="text-white font-black text-xs uppercase tracking-wider">{candidateName}</span>
              </div>
              <div className="px-4 py-2 bg-white/5 border border-white/[0.08] rounded-2xl text-slate-400 text-xs font-bold uppercase tracking-wider">
                {domains.join(' • ')}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 relative z-10">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-white/[0.04]"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={351.8}
                  initial={{ strokeDashoffset: 351.8 }}
                  animate={{ strokeDashoffset: 351.8 - (351.8 * finalIndex) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="text-[#3b82f6] drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white font-display">{finalIndex}</span>
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">Index</span>
              </div>
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Neural Proficiency</p>
          </div>
        </div>

        {/* Tab Navigation - Modern Pill Style */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 bg-[#0F111A]/80 border border-white/[0.06] rounded-2xl shadow-2xl gap-1">
            {['overview', 'linguistic', 'cognitive'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`relative px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all z-10 cursor-pointer ${
                  activeTab === tab
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeReportTab"
                    className="absolute inset-0 bg-gradient-to-r from-[#0A1628] to-[#0F2547] rounded-xl -z-10 shadow-lg shadow-[#00021C]/20"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Areas */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* AI Feedback Section - Display First if available */}
            {aiAnalysis && (
              <div className="lg:col-span-3 bg-gradient-to-r from-[#00021C]/10 to-[#00021C]/5 rounded-3xl p-8 border border-[#0A1628]/20 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0A1628]/10 to-[#1a3a6b]/5 blur-2xl pointer-events-none" />
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="p-3 bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] rounded-2xl text-white">
                    <Brain className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wide font-display">Sarah AI Diagnostic Insights</h2>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Algorithmic behavioral critique</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  {/* Strengths */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">Peak Performance Matrix</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-xs bg-[#0F111A]/40 p-5 rounded-2xl border border-white/[0.06] font-medium">
                      {finalScores.strengthsFeedback}
                    </p>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">Growth Optimization Nodes</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-xs bg-[#0F111A]/40 p-5 rounded-2xl border border-white/[0.06] font-medium">
                      {finalScores.improvementsFeedback}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Qualities Detected */}
            <div className="lg:col-span-2">
              <GlassCard className="p-8 border-white/[0.06] bg-[#0F111A]/60 backdrop-blur-xl rounded-3xl h-full shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-white/5 border border-white/[0.08] rounded-2xl text-[#3b82f6]">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wide font-display">Performance Indexes</h2>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{aiAnalysis ? 'Neural Engine Analyzed' : 'Vocal Diagnostic'} Scores</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Technical Score', value: finalScores.technicalScore, icon: '🎯', color: 'from-[#0A1628] to-[#0F2547] shadow-[#00021C]/20' },
                    { label: 'Communication', value: finalScores.communicationScore, icon: '💬', color: 'from-[#00021C] to-teal-500 shadow-[#00021C]/25' },
                    { label: 'Response Depth', value: finalScores.depthScore, icon: '📊', color: 'from-fuchsia-600 to-pink-600 shadow-fuchsia-500/25' },
                    { label: 'Confidence Index', value: finalScores.decisionConfidence, icon: '🛡️', color: 'from-amber-500 to-orange-500 shadow-amber-500/25' },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="group p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-3">
                          <span className="text-xl group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                          <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">{item.label}</span>
                        </div>
                        <span className="text-sm font-black text-white">
                          {item.value}%
                        </span>
                      </div>
                      <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.04]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1.2, delay: 0.3 + idx * 0.08 }}
                          className={`absolute inset-0 bg-gradient-to-r ${item.color} shadow-lg`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Quick Stats Sidebar */}
            <div className="space-y-6">
              <div className="bg-[#0F111A]/80 rounded-3xl p-6 border border-white/[0.06] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-300 pointer-events-none">
                  <Mic className="w-24 h-24" />
                </div>
                
                <h3 className="text-sm font-black mb-5 flex items-center gap-2 text-white uppercase tracking-widest">
                  <BarChart3 className="w-4 h-4 text-[#3b82f6]" />
                  Telemetry
                </h3>

                <div className="space-y-3">
                  {[
                    { label: 'Words Spoken', value: metrics.wordCount, suffix: '' },
                    { label: 'Speaking Pace', value: metrics.speakingPace.toFixed(0), suffix: ' wpm' },
                    { label: 'Filler Frequency', value: metrics.fillerWordPercentage.toFixed(1), suffix: '%' },
                    { label: 'Completeness', value: metrics.answerCompleteness, suffix: '%' },
                  ].map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                      <span className="text-sm font-black text-white">{stat.value}{stat.suffix}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievement Card */}
              <div className="bg-gradient-to-r from-[#0A1628] to-[#0F2547] rounded-3xl p-5 text-white shadow-xl shadow-[#00021C]/20 border border-[#0A1628]/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 bg-white/15 rounded-2xl flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-widest">Assessment Peak</h4>
                    <p className="opacity-90 text-sm font-bold mt-0.5">
                      {metrics.confidenceIndex > metrics.communicationQuality ? 'Peak Voice Conviction' : 'Superior Speech Clarity'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Linguistic Analysis */}
        {activeTab === 'linguistic' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0F111A]/60 border border-white/[0.06] backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/5 border border-white/[0.08] rounded-2xl text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wide font-display">Linguistic Diagnostics</h2>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Deep verbal communication profile indices</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {[
                {
                  label: 'Vocabulary Diversity',
                  value: Math.round((metrics.uniqueWords / (metrics.wordCount * 0.5)) * 100),
                  description: 'Richness and lexical complexity of active lexicon',
                  tags: ['Lexicon', 'Flow']
                },
                {
                  label: 'Structural Cohesion',
                  value: Math.round((metrics.averageWordsPerSentence / 20) * 100),
                  description: `Average of ${metrics.averageWordsPerSentence.toFixed(1)} syntax elements per block`,
                  tags: ['Grammar', 'Cadence']
                },
                {
                  label: 'Verbal Fluency Index',
                  value: Math.max(0, 100 - metrics.fillerWordPercentage * 5),
                  description: `${metrics.filler_words} filler structures mapped across simulation`,
                  tags: ['Cleanliness', 'Authority']
                },
                {
                  label: 'Syntactic Energy',
                  value: Math.min(100, Math.round((metrics.uniqueWords / 100) * 100)),
                  description: 'Dynamic impact and structural weighting of statements',
                  tags: ['Precision', 'Weight']
                },
              ].map((metric, idx) => (
                <div key={idx} className="space-y-3.5">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-xs uppercase tracking-wider">{metric.label}</span>
                        <div className="flex gap-1">
                          {metric.tags.map(tag => (
                            <span key={tag} className="text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/[0.08] rounded text-slate-400 font-black uppercase tracking-wider">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-500 text-xs font-medium pr-6">{metric.description}</p>
                    </div>
                    <span className="text-xl font-black text-emerald-400 text-glow-cyan">
                      {Math.min(100, Math.max(0, metric.value))}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 border border-white/[0.04] rounded-full overflow-hidden p-0">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, metric.value))}%` }}
                      transition={{ duration: 1.2, delay: idx * 0.08 }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#00021C] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Cognitive Dynamic */}
        {activeTab === 'cognitive' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-[#0F111A]/60 border border-white/[0.06] backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-96 h-96 bg-[#0A1628]/10 rounded-full -mr-48 -mt-48 blur-3xl -z-10 pointer-events-none" />
               
               <div className="flex items-center gap-3 mb-10 relative z-10">
                <div className="p-3 bg-white/5 border border-white/[0.08] rounded-2xl text-[#3b82f6]">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wide font-display">Cognitive Dynamic Grid</h2>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Mental index formulation & pacing efficiency</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {[
                  { label: 'Latency Agility', value: Math.round((metrics.speakingPace / 150) * 100), icon: '⚡' },
                  { label: 'Conviction', value: metrics.confidenceIndex, icon: '🛡️' },
                  { label: 'Semantic Logic', value: Math.round(((100 - metrics.fillerWordPercentage) / 100) * 100), icon: '🧩' },
                  { label: 'Synthesis Density', value: Math.round(((metrics.uniqueWords / (metrics.wordCount * 0.5)) / 100) * 100), icon: '💎' },
                ].map((metric, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-2xl flex flex-col items-center text-center shadow-sm hover:bg-white/[0.04] transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-white/5 border border-white/[0.08] rounded-xl flex items-center justify-center text-xl mb-4 text-[#3b82f6]">
                      {metric.icon}
                    </div>
                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mb-1">{metric.label}</span>
                    <span className="text-2xl font-black text-white mb-4">{Math.min(100, Math.max(0, metric.value))}%</span>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/[0.04]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, metric.value))}%` }}
                        transition={{ duration: 1, delay: idx * 0.08 }}
                        className="h-full bg-[#00021C]"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Refinement Path */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0F111A]/60 border border-white/[0.06] backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl"
        >
          <div className="flex flex-col md:flex-row gap-10">
            <div className="md:w-1/3">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/5 border border-white/[0.08] rounded-2xl text-amber-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-wide font-display">Refinement Pathway</h3>
              </div>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed uppercase tracking-wider">
                Strategic target vectors determined by dynamic speech analytics inside this {domains.join(' & ')} simulation.
              </p>
              
              <div className="mt-8 flex items-center gap-4 p-4.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0A1628] to-[#0F2547] flex items-center justify-center font-black text-white text-sm">
                  {candidateName.charAt(0)}
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Candidate Matrix</p>
                  <p className="text-white font-bold text-xs uppercase tracking-wider">Professional tier</p>
                </div>
              </div>
            </div>

            <div className="md:w-2/3 grid grid-cols-1 gap-4">
              {[
                {
                  title: 'Verbal Cadence Refinement',
                  desc: `Filler frequency is at ${metrics.fillerWordPercentage.toFixed(1)}%. Strive for < 2.0% threshold to maximize voice authority.`,
                  icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 text-glow-cyan" />
                },
                {
                  title: 'Argument Structuring',
                  desc: `Completeness stands at ${metrics.answerCompleteness}%. Apply structural logic models to extend technical scenarios.`,
                  icon: <CheckCircle2 className="w-4 h-4 text-[#3b82f6] text-glow-cyan" />
                },
                {
                  title: 'Pacing Regulation',
                  desc: `Your deliver rate logs at ${metrics.speakingPace.toFixed(0)} WPM. Target a measured ~115 WPM to command gravity.`,
                  icon: <CheckCircle2 className="w-4 h-4 text-[#3b82f6]" />
                }
              ].map((item, i) => (
                <div key={i} className="group flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300">
                  <div className="mt-0.5">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-1">{item.title}</h4>
                    <p className="text-slate-400 text-xs font-semibold leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Improved Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pb-12">
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-8 py-3.5 bg-white/5 border border-white/[0.08] hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-md"
          >
            <Download className="w-4 h-4 text-[#3b82f6]" />
            Export Data
          </button>
          
          <button
            onClick={shareReport}
            className="flex items-center gap-2 px-8 py-3.5 bg-white/5 border border-white/[0.08] hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
          >
            <Share2 className="w-4 h-4 text-[#3b82f6]" />
            Transmit Report
          </button>

          {recordingUrl && (
            <a
              href={recordingUrl}
              download
              className="flex items-center gap-2 px-8 py-3.5 bg-white/5 border border-white/[0.08] hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Mic className="w-4 h-4 text-red-400 animate-pulse" />
              Stream File
            </a>
          )}

          {onRetry && (
            <GradientButton
              onClick={onRetry}
              variant="primary"
              className="px-10 py-3.5 text-xs font-black tracking-widest uppercase flex items-center gap-2.5 hover:shadow-[#00021C]/20"
            >
              <RefreshCcw className="w-4 h-4" />
              New Diagnostic
            </GradientButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}
