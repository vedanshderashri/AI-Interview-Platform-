'use client';
import React, { useEffect, useState } from 'react';
import { Brain, Award, Clock, TrendingUp, ChevronRight, Video, Mic, Calendar, Flame, CheckCircle2, Shield, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/ui/Header';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

const daysOfWeek = [
  { label: 'M' },
  { label: 'T' },
  { label: 'W' },
  { label: 'T' },
  { label: 'F' },
  { label: 'S' },
  { label: 'S' }
];

export default function Home() {
  const { isAuthenticated, isOnboarded, user } = useAuthStore();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isOnboarded) {
      router.push('/onboarding');
      return;
    }

    const fetchSessions = async () => {
      try {
        const response = await fetch(`/api/analytics/sync?userId=${user?.id}`);
        const data = await response.json();
        if (data.success) {
          setSessions(data.sessions);
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      }
    };

    if (user?.id) {
      fetchSessions();
    }
  }, [isAuthenticated, isOnboarded, router, user?.id]);

  if (!mounted || !isAuthenticated || !isOnboarded) return null;

  const totalInterviews = sessions.length;
  const avgScore = totalInterviews > 0
    ? Math.round(sessions.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / totalInterviews)
    : 0;

  const avgConf = totalInterviews > 0
    ? Math.round(sessions.reduce((acc, curr) => acc + (curr.technicalScore || 85), 0) / totalInterviews)
    : 0;

  const totalDurationSecs = sessions.reduce((acc, curr) => acc + (curr.durationSecs || 0), 0);
  const practiceHours = Math.floor(totalDurationSecs / 3600);
  const practiceMins = Math.floor((totalDurationSecs % 3600) / 60);

  const getGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score === 0) return '-';
    return 'D';
  };

  const statCards = [
    { label: 'Technical Score', value: avgConf, suffix: '%', icon: Brain },
    { label: 'Sessions Completed', value: totalInterviews, suffix: '', icon: Award },
    { label: 'Practice Time', value: `${practiceHours}h ${practiceMins}m`, suffix: '', icon: Clock },
    { label: 'Current Grade', value: getGrade(avgScore), suffix: '', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col text-[var(--foreground)] transition-colors duration-300 bg-[#F5F5F4]">
      <Header title="Candidate Dashboard" subtitle="Performance Overview // Live Diagnostics" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-8 py-10 flex flex-col gap-8">

        {/* Welcome Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-white border border-[#E7E5E4] rounded-3xl p-8 md:p-10 shadow-sm relative overflow-hidden group transition-all duration-300"
        >
          {/* Subtle Radial Gradient background behind illustration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-[#635BFF]/3 blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.015] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Left Text Block */}
          <div className="relative z-10 flex-1 flex flex-col justify-between self-stretch space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-[#111827] leading-[1.1] font-display">
                Welcome back,<br />
                <span className="text-[#635BFF]">{user?.name?.split(' ')[0]}</span>
              </h1>
              <p className="text-[#6B7280] text-xs md:text-sm font-semibold max-w-sm leading-relaxed">
                Your custom professional interview core metrics and diagnostics are successfully synced and ready.
              </p>
            </div>
            
            {/* Sync operational status badges */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-[#6B7280]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] fill-[#10B981]/10" /> System synced
              </div>
              <span className="text-[#E7E5E4] px-1 font-bold">•</span>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#6B7280]" /> All systems operational
              </div>
            </div>
          </div>
          
          {/* Middle Meter Illustration */}
          <div className="relative z-10 flex items-center justify-center shrink-0 w-full lg:w-auto py-2 lg:py-0">
            <img 
              src="/meter.png" 
              alt="Meter Illustration" 
              className="w-56 h-auto md:w-[280px] lg:w-[320px] select-none object-contain" 
            />
          </div>
          
          {/* Right CTA Buttons */}
          <div className="relative z-10 flex flex-col gap-3 justify-center shrink-0 w-full sm:w-auto sm:min-w-[200px]">
            <Link href="/ai-interview-advanced" className="w-full">
              <button className="w-full px-6 py-3 bg-[#18181B] hover:bg-[#27272A] text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer shadow-sm hover:shadow-[#635BFF]/5 border border-transparent">
                <Video className="w-4 h-4 text-white fill-current" /> Video Interview
              </button>
            </Link>
            <Link href="/real-time-interview" className="w-full">
              <button className="w-full px-6 py-3 bg-white border border-[#E7E5E4] hover:bg-[#F5F5F4] text-[#111827] font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer shadow-sm">
                <Mic className="w-4 h-4 text-[#6B7280]" /> Voice Interview
              </button>
            </Link>
          </div>
        </motion.section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            // Match custom accent background colors for icon containers from the screenshot
            const colors = [
              { bg: 'bg-[#635BFF]/8 border-[#635BFF]/15', text: 'text-[#635BFF]' },
              { bg: 'bg-[#F59E0B]/8 border-[#F59E0B]/15', text: 'text-[#F59E0B]' },
              { bg: 'bg-[#10B981]/8 border-[#10B981]/15', text: 'text-[#10B981]' },
              { bg: 'bg-[#EF4444]/8 border-[#EF4444]/15', text: 'text-[#EF4444]' }
            ][idx];

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white border border-[#E7E5E4] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl border ${colors.bg} group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                </div>
                <p className="text-[#6B7280] text-[10px] font-bold uppercase tracking-wider mb-1.5">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-[#111827] tracking-tight font-sans">{stat.value}</span>
                  {stat.suffix && <span className="text-[#6B7280] text-xs font-bold">{stat.suffix}</span>}
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* Recent Sessions & Analytics Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Recent Sessions Card (takes 2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-4">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-sm font-black text-[#111827] uppercase tracking-wider font-display">Recent Sessions</h2>
                  <p className="text-[#6B7280] text-[9px] font-bold uppercase tracking-widest">Historical Simulation Log</p>
                </div>
                {sessions.length > 0 && (
                  <Link href="/analytics">
                    <button className="text-[#635BFF] hover:text-[#7C74FF] font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer">
                      View All Sessions <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                )}
              </div>

              {sessions.length === 0 ? (
                <div className="w-full py-16 px-6 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-[#6B7280]/5 border border-[#E7E5E4] flex items-center justify-center text-[#6B7280] mb-4">
                    <FolderOpen className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <p className="text-[#111827] font-bold uppercase tracking-wider text-xs mb-1">No Record Found</p>
                  <p className="text-[#6B7280] text-xs mb-6 max-w-xs font-medium">Complete an AI interview session to generate your diagnostics reports and metrics.</p>
                  <Link href="/ai-interview-advanced">
                    <button className="px-5 py-2.5 bg-[#635BFF] hover:bg-[#7C74FF] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-[#635BFF]/10 active:scale-95 cursor-pointer">
                      Begin First Session
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.slice(-6).reverse().map((interview, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border border-[#E7E5E4] p-4 rounded-xl flex items-center gap-4 group hover:border-[#635BFF] hover:shadow-sm transition-all duration-300 cursor-pointer"
                    >
                      <div className="shrink-0 w-12 h-12 bg-gradient-to-tr from-[#635BFF] to-[#7C74FF] rounded-lg flex flex-col items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-300">
                        <span className="text-base font-black leading-none font-sans">{interview.overallScore}</span>
                        <span className="text-[7px] font-black uppercase tracking-tighter opacity-80 mt-0.5">SCORE</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-[#111827] text-xs truncate group-hover:text-[#635BFF] transition-colors duration-200">
                            {interview.sessionTitle}
                          </h3>
                          <span className="text-[8px] font-bold text-[#6B7280] uppercase tracking-wider shrink-0">
                            {new Date(interview.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                          <div className="flex items-center gap-0.5">
                            <span className="text-[8px] font-bold text-[#6B7280] uppercase tracking-wider">Tech:</span>
                            <span className="font-bold text-[#111827]">{interview.technicalScore || 75}%</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <span className="text-[8px] font-bold text-[#6B7280] uppercase tracking-wider">Comm:</span>
                            <span className="font-bold text-[#111827]">{interview.communicationScore || 75}%</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <span className="text-[8px] font-bold text-[#6B7280] uppercase tracking-wider">Time:</span>
                            <span className="font-bold text-[#111827]">{Math.round((interview.durationSecs || 0) / 60)}m</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                        <ChevronRight size={14} className="text-[#635BFF]" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side Cards (Weekly Progress + Interview Streak, takes 1/3 width) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Weekly Progress Card */}
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#635BFF]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">Weekly Progress</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F5F4] rounded-lg border border-[#E7E5E4] cursor-pointer hover:bg-[#E7E5E4]/50 transition-all text-[9px] font-bold text-[#6B7280]">
                  This Week <ChevronRight className="w-3 h-3 rotate-90" />
                </div>
              </div>
              
              <div className="flex justify-between items-center px-1">
                {daysOfWeek.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <span className="text-[9px] font-bold text-[#6B7280]">{day.label}</span>
                    <div className="w-6.5 h-6.5 rounded-full border-2 border-[#E7E5E4] flex items-center justify-center transition-all bg-[#F5F5F4]/30" />
                  </div>
                ))}
              </div>
              
              <p className="text-center text-[10px] font-bold text-[#6B7280] bg-[#F5F5F4]/50 py-3 rounded-xl border border-dashed border-[#E7E5E4]">
                No activity yet. Start your first session!
              </p>
            </div>

            {/* Interview Streak Card */}
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#F59E0B] fill-current" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827]">Interview Streak</h3>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-[#111827] tracking-tight leading-none">0 Days</span>
                  <span className="text-[9px] font-bold text-[#6B7280] mt-2.5 uppercase tracking-wider">Keep it going!</span>
                </div>
                
                {/* Circular streak wheel */}
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E7E5E4" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="0 100" strokeDashoffset="0" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-[#F59E0B]/30 fill-current" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}
