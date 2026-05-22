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
  ArrowRight,
  Clock,
  Mic,
  Award,
  ChevronRight,
  CheckCircle2,
  RefreshCcw,
} from 'lucide-react';
import { InterviewMetrics } from '@/lib/interviewAnalytics';

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

  const getStatusColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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
      className="w-full min-h-screen bg-[#F8FAFC] p-4 md:p-8"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 -z-10" />
          
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
              <Clock className="w-4 h-4" />
              {interviewDate.toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Interview <span className="text-[#0891B2]">Results</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#0891B2]/10 rounded-xl border border-[#0891B2]/20">
                <div className="w-2 h-2 rounded-full bg-[#0891B2] animate-pulse" />
                <span className="text-[#0891B2] font-bold">{candidateName}</span>
              </div>
              <div className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 font-medium">
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
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-100"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={364.4}
                  initial={{ strokeDashoffset: 364.4 }}
                  animate={{ strokeDashoffset: 364.4 - (364.4 * finalIndex) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="text-[#0891B2]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900">{finalIndex}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Index</span>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Neural Proficiency</p>
          </div>
        </div>

        {/* Tab Navigation - Modern Pill Style */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm gap-1">
            {['overview', 'linguistic', 'cognitive'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`relative px-6 py-2.5 rounded-xl font-bold text-sm transition-all z-10 ${
                  activeTab === tab
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[#0891B2] rounded-xl -z-10 shadow-md shadow-[#0891B2]/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
              <div className="lg:col-span-3 bg-gradient-to-r from-[#F0F9FA] to-[#CFFAFE] rounded-3xl p-8 border-2 border-[#A5F3FC] shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-[#0891B2] rounded-2xl">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">AI-Powered Insights</h2>
                    <p className="text-slate-600 text-sm font-medium">Analysis based on your actual responses</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Strengths */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-bold text-slate-900">Strengths</h3>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-sm bg-white p-4 rounded-xl border border-emerald-200">
                      {finalScores.strengthsFeedback}
                    </p>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      <h3 className="font-bold text-slate-900">Growth Areas</h3>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-sm bg-white p-4 rounded-xl border border-amber-200">
                      {finalScores.improvementsFeedback}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Qualities Detected - Larger focus */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-[#F0F9FA] rounded-2xl">
                    <Brain className="w-6 h-6 text-[#0891B2]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Performance Scores</h2>
                    <p className="text-slate-500 text-sm font-medium">{aiAnalysis ? 'AI-analyzed' : 'Behavioral'} assessment results</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Technical Score', value: finalScores.technicalScore, icon: '🎯', color: 'bg-[#0891B2]' },
                    { label: 'Communication', value: finalScores.communicationScore, icon: '💬', color: 'bg-emerald-500' },
                    { label: 'Response Depth', value: finalScores.depthScore, icon: '📊', color: 'bg-indigo-500' },
                    { label: 'Confidence', value: finalScores.decisionConfidence, icon: '🛡️', color: 'bg-amber-500' },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                          <span className="text-slate-700 font-bold">{item.label}</span>
                        </div>
                        <span className={`text-xl font-black ${item.value >= 75 ? 'text-emerald-600' : item.value >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>
                          {item.value}%
                        </span>
                      </div>
                      <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                          className={`absolute inset-0 ${item.color}`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats Sidebar */}
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Mic className="w-24 h-24" />
                </div>
                
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#0891B2]" />
                  Session Vitals
                </h3>

                <div className="space-y-4">
                  {[
                    { label: 'Words Spoken', value: metrics.wordCount, suffix: '' },
                    { label: 'Speaking Pace', value: metrics.speakingPace.toFixed(0), suffix: ' wpm' },
                    { label: 'Filler Words', value: metrics.fillerWordPercentage.toFixed(1), suffix: '%' },
                    { label: 'Completeness', value: metrics.answerCompleteness, suffix: '%' },
                  ].map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-slate-400 text-sm font-medium">{stat.label}</span>
                      <span className="text-xl font-bold">{stat.value}{stat.suffix}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievement Card */}
              <div className="bg-gradient-to-br from-[#0891B2] to-[#0E7490] rounded-3xl p-6 text-white shadow-lg shadow-[#0891B2]/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg">Top Quality</h4>
                    <p className="opacity-80 text-sm font-medium">
                      {metrics.confidenceIndex > metrics.communicationQuality ? 'Peak Confidence' : 'Superior Clarity'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'linguistic' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <MessageSquare className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Linguistic Analysis</h2>
                <p className="text-slate-500 text-sm font-medium">Deep dive into verbal communication patterns</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {[
                {
                  label: 'Vocabulary Diversity',
                  value: Math.round((metrics.uniqueWords / (metrics.wordCount * 0.5)) * 100),
                  description: 'Richness and variety of word choice',
                  tags: ['Variety', 'Academic']
                },
                {
                  label: 'Sentence Structure',
                  value: Math.round((metrics.averageWordsPerSentence / 20) * 100),
                  description: `Average of ${metrics.averageWordsPerSentence.toFixed(1)} words per sentence`,
                  tags: ['Complexity', 'Flow']
                },
                {
                  label: 'Verbal Fluency',
                  value: Math.max(0, 100 - metrics.fillerWordPercentage * 5),
                  description: `${metrics.filler_words} filler words detected throughout session`,
                  tags: ['Cleanliness', 'Refinement']
                },
                {
                  label: 'Expression Strength',
                  value: Math.min(100, Math.round((metrics.uniqueWords / 100) * 100)),
                  description: 'Impact and weight of language used',
                  tags: ['Impact', 'Vocabulary']
                },
              ].map((metric, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#1F1F1F] font-black text-lg">{metric.label}</span>
                        <div className="flex gap-1">
                          {metric.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-bold uppercase tracking-tighter">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm font-medium pr-8">{metric.description}</p>
                    </div>
                    <span className="text-3xl font-black text-emerald-600">
                      {Math.min(100, Math.max(0, metric.value))}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, metric.value))}%` }}
                      transition={{ duration: 1.2, delay: idx * 0.1 }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'cognitive' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-96 h-96 bg-purple-50 rounded-full -mr-48 -mt-48 -z-10 opacity-50" />
               
               <div className="flex items-center gap-3 mb-10 relative z-10">
                <div className="p-3 bg-purple-50 rounded-2xl">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Cognitive Dynamic</h2>
                  <p className="text-slate-500 text-sm font-medium">Mental processing and delivery efficiency</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {[
                  { label: 'Agility', value: Math.round((metrics.speakingPace / 150) * 100), icon: '⚡' },
                  { label: 'Conviction', value: metrics.confidenceIndex, icon: '🛡️' },
                  { label: 'Logic', value: Math.round(((100 - metrics.fillerWordPercentage) / 100) * 100), icon: '🧩' },
                  { label: 'Density', value: Math.round(((metrics.uniqueWords / (metrics.wordCount * 0.5)) / 100) * 100), icon: '💎' },
                ].map((metric, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white p-6 rounded-2xl border-2 border-slate-100 flex flex-col items-center text-center shadow-sm"
                  >
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:rotate-6 transition-transform">
                      {metric.icon}
                    </div>
                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-1">{metric.label}</span>
                    <span className="text-3xl font-black text-slate-900 mb-4">{Math.min(100, Math.max(0, metric.value))}%</span>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, metric.value))}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className="h-full bg-purple-500"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Refinement Path - Enhanced Actionable Design */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-1/3">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-50 rounded-2xl">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Growth Path</h3>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed">
                Strategic focus areas based on your Performance Metrics
                from this {domains.join(' & ')} session.
              </p>
              
              <div className="mt-8 flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-600">
                  {candidateName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Profile Analysis</p>
                  <p className="text-slate-700 font-bold">Strategic Candidate</p>
                </div>
              </div>
            </div>

            <div className="md:w-2/3 grid grid-cols-1 gap-4">
              {[
                {
                  title: 'Fluency Refinement',
                  desc: `Your filler words are at ${metrics.fillerWordPercentage.toFixed(1)}%. Aim for < 2% to project expert-level authority.`,
                  icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                },
                {
                  title: 'Depth of Response',
                  desc: `Completeness index is ${metrics.answerCompleteness}%. Use the STAR method to structure and extend your technical narratives.`,
                  icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />
                },
                {
                  title: 'Rhythmic Pacing',
                  desc: `You average ${metrics.speakingPace.toFixed(0)} WPM. For critical insights, slow down to ~110 WPM for maximum impact.`,
                  icon: <CheckCircle2 className="w-5 h-5 text-purple-500" />
                }
              ].map((item, i) => (
                <div key={i} className="group flex items-start gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="mt-1">{item.icon}</div>
                  <div>
                    <h4 className="font-black text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">{item.desc}</p>
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
            className="group flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            Export Data
          </button>
          
          <button
            onClick={shareReport}
            className="group flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Share2 className="w-5 h-5" />
            Share Profile
          </button>

          {recordingUrl && (
            <a
              href={recordingUrl}
              download
              className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all"
            >
              <Mic className="w-5 h-5 text-red-500" />
              Recording
            </a>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="group flex items-center gap-2 px-8 py-4 bg-[#4CAF50] text-white rounded-2xl font-bold shadow-lg shadow-[#4CAF50]/20 hover:scale-105 active:scale-95 transition-all"
            >
              <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              Start New Session
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
