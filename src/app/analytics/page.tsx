'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';
import { 
  CheckCircle2, 
  AlertTriangle, 
  PlayCircle, 
  Home, 
  BrainCircuit, 
  Activity,
  BarChart3,
  RefreshCw,
  Cloud,
  Database,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { useInterviewStore } from '@/store/interviewStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/ui/Header';
import {
  saveAnalyticsSession,
  saveActiveSessionSnapshot,
  calculateAggregateMetrics,
  getAllAnalyticsSessions,
  syncAnalyticsFromServer,
  getSyncStatus,
  AnalyticsSession,
  getActiveSessionSnapshot,
  clearActiveSession,
} from '@/lib/analyticsSync';

export default function AnalyticsPage() {
  const router = useRouter();
  const store = useInterviewStore();

  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [aggregateMetrics, setAggregateMetrics] = useState<any>(null);
  const [pastSessions, setPastSessions] = useState<AnalyticsSession[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);

  // Get data from store or localStorage
  const getData = () => {
    // First check if store has recent data
    if (store.overallScore > 0 && store.sessionTitle && store.sessionTitle !== 'General Interview') {
      return {
        technicalScore: store.technicalScore,
        communicationScore: store.communicationScore,
        nervousnessScore: store.nervousnessScore,
        overallScore: store.overallScore,
        structureScore: store.structureScore,
        depthScore: store.depthScore,
        thinkingSpeed: store.thinkingSpeed,
        decisionConfidence: store.decisionConfidence,
        strengthsFeedback: store.strengthsFeedback,
        improvementsFeedback: store.improvementsFeedback,
        sessionTitle: store.sessionTitle,
        startDate: store.startDate,
        candidateName: store.candidateName,
        videoRecordingUrl: store.videoRecordingUrl,
        timelineData: store.timelineData,
        selectedTopics: store.selectedTopics,
      };
    }

    // Otherwise load from localStorage
    const saved = getActiveSessionSnapshot();
    if (saved && (saved as any).overallScore > 0) {
      return {
        technicalScore: (saved as any).technicalScore || 0,
        communicationScore: (saved as any).communicationScore || 0,
        nervousnessScore: (saved as any).nervousnessScore || 0,
        overallScore: (saved as any).overallScore || 0,
        structureScore: (saved as any).structureScore || 0,
        depthScore: (saved as any).depthScore || 0,
        thinkingSpeed: (saved as any).thinkingSpeed || 0,
        decisionConfidence: (saved as any).decisionConfidence || 0,
        strengthsFeedback: (saved as any).strengthsFeedback || '',
        improvementsFeedback: (saved as any).improvementsFeedback || '',
        sessionTitle: (saved as any).sessionTitle || 'Interview Session',
        startDate: (saved as any).date || new Date(),
        candidateName: (saved as any).candidateName || 'Candidate',
        videoRecordingUrl: (saved as any).videoRecordingUrl || null,
        timelineData: (saved as any).timelineData || [],
        selectedTopics: (saved as any).topics || [],
      };
    }

    return null;
  };

  // Initial mount and sync setup
  useEffect(() => {
    setMounted(true);

    // Load all sessions from localStorage
    const allSessions = getAllAnalyticsSessions();
    setPastSessions(allSessions);

    // Calculate aggregates
    if (allSessions.length > 0) {
      const metrics = calculateAggregateMetrics(allSessions);
      setAggregateMetrics(metrics);
    }

    // Get sync status
    setSyncStatus(getSyncStatus());

    // Get current session data
    const data = getData();
    if (data) {
      setCurrentSession(data);

      // If we have valid data and no session is saved yet, save it
      if (allSessions.length === 0 || !allSessions.some(s => s.sessionTitle === data.sessionTitle && new Date(s.date).toDateString() === new Date(data.startDate).toDateString())) {
        const sessionId = `session_${new Date().getTime()}`;
        const newSession: AnalyticsSession = {
          id: sessionId,
          sessionTitle: data.sessionTitle,
          candidateName: data.candidateName,
          date: data.startDate || new Date(),
          duration: (data.timelineData?.length || 0) * 3,
          technicalScore: data.technicalScore,
          communicationScore: data.communicationScore,
          nervousnessScore: data.nervousnessScore,
          overallScore: data.overallScore,
          structureScore: data.structureScore,
          depthScore: data.depthScore,
          thinkingSpeed: data.thinkingSpeed,
          decisionConfidence: data.decisionConfidence,
          strengthsFeedback: data.strengthsFeedback,
          improvementsFeedback: data.improvementsFeedback,
          topics: data.selectedTopics || [],
          videoRecordingUrl: data.videoRecordingUrl || undefined,
          timelineData: data.timelineData || [],
        };

        saveAnalyticsSession(newSession);
        saveActiveSessionSnapshot(newSession);

        // Reload sessions
        const updated = getAllAnalyticsSessions();
        setPastSessions(updated);
        const updatedMetrics = calculateAggregateMetrics(updated);
        setAggregateMetrics(updatedMetrics);
      }
    }
  }, [mounted]);

  // Real-time sync effect
  useEffect(() => {
    if (!mounted) return;

    const syncInterval = setInterval(async () => {
      try {
        setSyncing(true);
        const result = await syncAnalyticsFromServer('/api/analytics/sync');
        if (result.success) {
          const allSessions = getAllAnalyticsSessions();
          setPastSessions(allSessions);
          const metrics = calculateAggregateMetrics(allSessions);
          setAggregateMetrics(metrics);
          setSyncStatus(getSyncStatus());
        }
      } catch (error) {
        console.error('Sync failed:', error);
      } finally {
        setSyncing(false);
      }
    }, 60000); // Sync every minute

    return () => clearInterval(syncInterval);
  }, [mounted]);

  // Trigger manual sync
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await syncAnalyticsFromServer('/api/analytics/sync');
      if (result.success) {
        const allSessions = getAllAnalyticsSessions();
        setPastSessions(allSessions);
        const metrics = calculateAggregateMetrics(allSessions);
        setAggregateMetrics(metrics);
        setSyncStatus(getSyncStatus());
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (!mounted || !currentSession) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-[#4CAF50]/30 border-t-[#4CAF50] rounded-full animate-spin" />
          <p className="text-[#1F1F1F]/60 font-light">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  const {
    technicalScore,
    communicationScore,
    nervousnessScore,
    overallScore,
    structureScore,
    depthScore,
    thinkingSpeed,
    decisionConfidence,
    strengthsFeedback,
    improvementsFeedback,
    sessionTitle,
    startDate,
    candidateName,
    videoRecordingUrl,
  } = currentSession;

  const radarData = [
    { subject: 'Technical Depth', A: technicalScore, fullMark: 100 },
    { subject: 'Communication', A: communicationScore, fullMark: 100 },
    { subject: 'Structure', A: structureScore, fullMark: 100 },
    { subject: 'Depth', A: depthScore, fullMark: 100 },
    { subject: 'Thinking Speed', A: thinkingSpeed, fullMark: 100 },
    { subject: 'Confidence', A: decisionConfidence, fullMark: 100 },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#F5F5F5] font-inter pb-20">
      <Header 
        title="Session Outcome" 
        subtitle={`Subject: ${candidateName} // ID: ${new Date().getTime().toString().slice(-6)}`} 
      />

      <div className="w-full max-w-7xl mx-auto px-10 pt-16 flex flex-col gap-12">
        
        {/* Outcome Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-[#E0E0E0] pb-12"
        >
          <div className="flex flex-col gap-4">
            <div className="px-3 py-1 bg-[#4CAF50] text-white text-[11px] font-black uppercase tracking-widest w-fit shadow-[0_0_15px_rgba(76,175,80,0.3)]">
              Neural_Archive_Validated
            </div>
            <h1 className="text-4xl md:text-6xl font-outfit font-black tracking-tighter text-[#1F1F1F] uppercase">
              Neural <span className="opacity-30">Report</span>
            </h1>
            <p className="text-[#1F1F1F]/60 font-light text-lg">
              {sessionTitle} <span className="mx-4 opacity-10">/</span> {startDate ? new Date(startDate).toLocaleDateString() : 'Protocol_Archive'}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Sync Status Indicator */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#F5F5F5] rounded-lg border border-[#E0E0E0]">
              <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-blue-500 animate-pulse' : 'bg-[#4CAF50]'}`} />
              <span className="text-[10px] font-bold text-[#1F1F1F]/70 uppercase tracking-widest">
                {syncing ? 'Syncing...' : 'Synced'}
              </span>
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="ml-2 p-1 hover:bg-white rounded transition-all disabled:opacity-50"
                title="Sync analytics data"
              >
                <RefreshCw className={`w-4 h-4 text-[#4CAF50] ${syncing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Session Stats */}
            {aggregateMetrics && (
              <div className="flex items-center gap-6 text-[11px] font-bold text-[#1F1F1F]/60 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  {aggregateMetrics.totalSessions} Sessions
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Avg: {aggregateMetrics.avgOverallScore}%
                </div>
              </div>
            )}

            <Link href="/" onClick={() => {
              store.clearSession();
              clearActiveSession();
            }}>
              <button className="px-10 py-5 bg-[#4CAF50] text-white font-black uppercase tracking-[0.3em] text-sm hover:bg-[#45a049] transition-all shadow-[0_0_40px_rgba(76,175,80,0.2)] flex items-center gap-4 group">
                <Home className="w-4 h-4" /> Finalize Session
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Main Grid */}
        <main className="w-full grid grid-cols-1 lg:grid-cols-12 gap-[1px] bg-white border border-[#E0E0E0] shadow-2xl relative z-10 rounded-xl overflow-hidden">
          
          {/* Left Neural Profile */}
          <aside className="lg:col-span-4 bg-white flex flex-col gap-[1px]">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="p-12 bg-white flex flex-col items-center justify-center gap-6 border-b border-[#E0E0E0]"
            >
              <div className="text-8xl font-black text-[#4CAF50] font-outfit tracking-tighter drop-shadow-[0_0_20px_rgba(76,175,80,0.2)]">{overallScore}</div>
              <div className="uppercase tracking-[0.5em] text-[12px] text-[#4CAF50]/70 font-bold">Neural Efficiency Index</div>
            </motion.div>

            <div className="p-12 bg-white flex flex-col gap-12">
              <div className="flex flex-col gap-4">
                 <h4 className="text-[12px] font-bold uppercase tracking-[0.4em] text-[#1F1F1F]/60">Linguistic Archive</h4>
                 <div className="h-[2px] w-12 bg-[#E0E0E0]" />
              </div>

              <div className="flex flex-col gap-8">
                <div className="p-8 border border-[#4CAF50]/10 bg-[#4CAF50]/5 flex flex-col gap-4 group hover:border-[#4CAF50]/30 transition-all">
                  <h5 className="text-[#1F1F1F] font-outfit font-black text-sm uppercase tracking-widest flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4" /> Qualities Detected
                  </h5>
                  <p className="text-sm text-[#1F1F1F]/70 leading-relaxed font-light">
                    {strengthsFeedback || "Archive data incomplete."}
                  </p>
                </div>

                <div className="p-8 border border-[#E0E0E0] bg-[#F5F5F5] flex flex-col gap-4 group hover:border-[#4CAF50]/50 transition-all">
                  <h5 className="text-[#1F1F1F]/60 font-outfit font-black text-sm uppercase tracking-widest flex items-center gap-3 group-hover:text-[#4CAF50] transition-colors">
                    <AlertTriangle className="w-4 h-4" /> Refinement Path
                  </h5>
                  <p className="text-sm text-[#1F1F1F]/50 leading-relaxed font-light group-hover:text-[#4CAF50]/70 transition-colors">
                    {improvementsFeedback || "Optimization parameters met."}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-12 bg-white flex flex-col gap-6 mt-auto border-t border-[#E0E0E0]">
              <h4 className="text-[12px] font-bold uppercase tracking-[0.4em] text-[#1F1F1F]/60">Cognitive Profile</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Agility", val: thinkingSpeed },
                  { label: "Conviction", val: decisionConfidence },
                  { label: "Syntax", val: structureScore },
                  { label: "Archive", val: depthScore }
                ].map(m => (
                  <div key={m.label} className="bg-[#4CAF50]/5 p-4 border border-[#4CAF50]/10">
                    <div className="text-[10px] text-[#1F1F1F]/60 font-black uppercase tracking-widest mb-1">{m.label}</div>
                    <div className="text-xl font-outfit font-black text-[#4CAF50]">{m.val}%</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Telemetry Analytics */}
          <section className="lg:col-span-8 bg-white flex flex-col gap-[1px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white border-b border-[#E0E0E0]">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white p-12 flex flex-col gap-10"
              >
                <h3 className="text-[12px] font-bold uppercase tracking-[0.4em] text-[#1F1F1F]/60 flex items-center gap-3">
                  <BrainCircuit className="w-4 h-4" /> Competency Vector
                </h3>
                <div className="w-full aspect-square max-h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#4CAF50" strokeOpacity={0.15} />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#1F1F1F', fontSize: 10, fontWeight: 700 }} />
                      <Radar
                        name="Performance"
                        dataKey="A"
                        stroke="#4CAF50"
                        fill="#4CAF50"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white p-12 flex flex-col gap-12"
              >
                <h3 className="text-[12px] font-bold uppercase tracking-[0.4em] text-[#1F1F1F]/60 flex items-center gap-3">
                  <BarChart3 className="w-4 h-4" /> Vector Analysis
                </h3>
                <div className="flex flex-col gap-8 flex-1 justify-center">
                  {[
                    { label: "Stability", value: 100 - nervousnessScore },
                    { label: "Precision", value: technicalScore },
                    { label: "Flow", value: communicationScore },
                    { label: "Protocol Index", value: overallScore }
                  ].map((stat, i) => (
                    <div key={i} className="flex flex-col gap-3">
                      <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest text-[#1F1F1F]/50">
                         <span>{stat.label}</span>
                         <span className="text-[#4CAF50]">{stat.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-[#E0E0E0] relative overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.value}%` }}
                          transition={{ duration: 1, delay: 0.8 + (i * 0.1) }}
                          className="absolute inset-y-0 left-0 bg-[#4CAF50]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="p-12 bg-white flex flex-col gap-12 flex-1">
                <h3 className="text-[12px] font-bold uppercase tracking-[0.4em] text-[#1F1F1F]/60 flex items-center gap-3">
                  <PlayCircle className="w-4 h-4" /> Neural Archive Metadata
                </h3>
                <div className="w-full aspect-video border border-[#E0E0E0] bg-white relative overflow-hidden group shadow-2xl rounded-xl">
                   {videoRecordingUrl ? (
                      <video src={videoRecordingUrl} controls className="w-full h-full object-cover transition-all duration-700" />
                   ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                        <div className="w-20 h-20 border border-[#E0E0E0] flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-[#4CAF50]/5 animate-pulse" />
                          <Activity className="w-8 h-8 text-[#4CAF50]/40" />
                        </div>
                        <div className="text-[12px] font-black uppercase tracking-[0.5em] text-[#1F1F1F]/30">Archive Offline</div>
                      </div>
                   )}
                </div>
            </div>
          </section>
        </main>

        {/* Historical Data & Trends */}
        {pastSessions.length > 1 && aggregateMetrics && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-xl border border-[#E0E0E0] shadow-sm"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#4CAF50]" />
                <h4 className="text-[12px] font-bold uppercase tracking-[0.4em] text-[#1F1F1F]/60">Performance Trend</h4>
              </div>
              <div className="flex items-end gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="text-sm font-black text-[#1F1F1F]">Technical</div>
                  <div className={`text-2xl font-black ${aggregateMetrics.trends.technicalTrend >= 0 ? 'text-[#4CAF50]' : 'text-red-500'}`}>
                    {aggregateMetrics.trends.technicalTrend > 0 ? '+' : ''}{aggregateMetrics.trends.technicalTrend}%
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="text-sm font-black text-[#1F1F1F]">Communication</div>
                  <div className={`text-2xl font-black ${aggregateMetrics.trends.communicationTrend >= 0 ? 'text-[#4CAF50]' : 'text-red-500'}`}>
                    {aggregateMetrics.trends.communicationTrend > 0 ? '+' : ''}{aggregateMetrics.trends.communicationTrend}%
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                <h4 className="text-[12px] font-bold uppercase tracking-[0.4em] text-[#1F1F1F]/60">Session Range</h4>
              </div>
              <div className="flex items-end gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="text-[10px] font-bold text-[#1F1F1F]/60 uppercase">Best</div>
                  <div className="text-2xl font-black text-[#4CAF50]">{aggregateMetrics.bestScore}%</div>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="text-[10px] font-bold text-[#1F1F1F]/60 uppercase">Worst</div>
                  <div className="text-2xl font-black text-[#1F1F1F]/50">{aggregateMetrics.worstScore}%</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-purple-500" />
                <h4 className="text-[12px] font-bold uppercase tracking-[0.4em] text-[#1F1F1F]/60">Sync Info</h4>
              </div>
              {syncStatus && (
                <div className="space-y-2 text-[11px]">
                  <div className="text-[#1F1F1F]/70">
                    <span className="font-bold">Local:</span> {syncStatus.localSessionCount} sessions
                  </div>
                  {syncStatus.lastSync && (
                    <div className="text-[#1F1F1F]/60">
                      <span className="font-bold">Last sync:</span> {new Date(syncStatus.lastSync).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Recent Sessions Timeline */}
        {pastSessions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="w-full bg-white p-8 rounded-xl border border-[#E0E0E0] shadow-sm"
          >
            <h4 className="text-[12px] font-bold uppercase tracking-[0.4em] text-[#1F1F1F]/60 mb-6">Recent Sessions Archive</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pastSessions.slice(-10).reverse().map((session, idx) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-[#F5F5F5] rounded-lg border border-[#E0E0E0] hover:border-[#4CAF50]/30 transition-all group">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#4CAF50]/10 flex items-center justify-center text-[10px] font-black text-[#4CAF50] flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-[#1F1F1F] truncate">{session.candidateName}</div>
                      <div className="text-[9px] text-[#1F1F1F]/60">{new Date(session.date).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-[#1F1F1F]">{session.overallScore}%</div>
                      <div className="text-[9px] text-[#1F1F1F]/60">{session.duration}s</div>
                    </div>
                    <div className="text-[#4CAF50]">→</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <footer className="w-full py-10 flex border-t border-[#E0E0E0] justify-between items-center opacity-60">
          <div className="text-[9px] font-black uppercase tracking-[0.5em] text-[#1F1F1F]">
            Neural_Archive_System_Link_v7.4
          </div>
          <div className="text-[9px] font-black uppercase tracking-[0.5em] text-[#1F1F1F]">
            Kriyeta_Corp // Intelligence_Division
          </div>
        </footer>
      </div>
    </div>
  );
}
