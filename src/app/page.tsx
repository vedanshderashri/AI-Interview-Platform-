'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { Brain, Zap, Clock, Award, TrendingUp, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/ui/Header';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isAuthenticated, isOnboarded, user, logout } = useAuthStore();
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
    <div className="min-h-screen w-full flex flex-col bg-white">
      <Header title="Cadidate Dashboard" subtitle="Performance Overview" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-12 flex flex-col gap-12">

        {/* Welcome Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-slate-900 rounded-lg p-10 md:p-14 text-white shadow-sm relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="absolute rounded-full border border-white/20"
                style={{ width: `${(i + 1) * 200}px`, height: `${(i + 1) * 200}px`, top: '-50%', left: '-10%' }} />
            ))}
          </div>
          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-slate-300 text-lg max-w-md font-medium">Your professional assessment data and interview metrics.</p>
          </div>
          <div className="relative z-10 flex gap-3 w-full md:w-auto flex-col md:flex-row">
            <Link href="/ai-interview-advanced" className="w-full md:w-auto">
              <GradientButton className="w-full md:w-auto" variant="primary">
                Video Interview
              </GradientButton>
            </Link>
            <Link href="/real-time-interview" className="w-full md:w-auto">
              <button className="w-full md:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-widest rounded-lg border border-white/20 transition-all flex items-center justify-center gap-2">
                Voice Interview
              </button>
            </Link>
          </div>
        </motion.section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white border border-slate-100 rounded-lg p-8 hover:border-slate-200 transition-all duration-300 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-900 border border-slate-100">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</span>
                  {stat.suffix && <span className="text-slate-400 text-sm font-bold">{stat.suffix}</span>}
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* Recent Sessions */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Recent Sessions</h2>
              <p className="text-slate-400 text-xs font-medium mt-1 uppercase tracking-wider">Historical Assessment Data</p>
            </div>
            {sessions.length > 0 && (
              <Link href="/analytics">
                <button className="text-slate-900 hover:underline font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all">
                  Full Analytics <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="w-full p-20 text-center border border-slate-100 bg-slate-50 rounded-lg">
              <Brain className="w-10 h-10 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-900 font-bold uppercase tracking-widest text-xs mb-2">No Record Found</p>
              <p className="text-slate-400 text-xs mb-8">Complete a session to generate performance analytics.</p>
              <Link href="/ai-interview-advanced">
                <GradientButton variant="primary">Begin First Session</GradientButton>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {sessions.slice(-6).reverse().map((interview, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white border-b border-slate-100 p-6 flex items-center gap-8 hover:bg-slate-50 transition-all group cursor-pointer"
                >
                  <div className="shrink-0 w-16 h-16 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white">
                    <span className="text-2xl font-black leading-none">{interview.overallScore}</span>
                    <span className="text-[8px] font-bold uppercase tracking-tighter opacity-60">SCORE</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-slate-900 text-base truncate">
                        {interview.sessionTitle}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest shrink-0">
                        {new Date(interview.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Tech:</span>
                        <span className="text-xs font-black text-slate-700">{interview.technicalScore || 75}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Comm:</span>
                        <span className="text-xs font-black text-slate-700">{interview.communicationScore || 75}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Time:</span>
                        <span className="text-xs font-black text-slate-700">{Math.round((interview.durationSecs || 0) / 60)}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={20} className="text-slate-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
