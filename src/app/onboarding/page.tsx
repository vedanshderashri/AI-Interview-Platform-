'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  Briefcase, 
  Target, 
  Rocket, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Code2,
  Cpu,
  Globe,
  Layout,
  Database,
  Cloud
} from 'lucide-react';

const DOMAINS = [
  { id: 'frontend', name: 'Frontend', icon: Layout, color: 'bg-blue-500' },
  { id: 'backend', name: 'Backend', icon: Database, color: 'bg-purple-500' },
  { id: 'fullstack', name: 'Full Stack', icon: Code2, color: 'bg-green-500' },
  { id: 'devops', name: 'DevOps', icon: Cloud, color: 'bg-orange-500' },
  { id: 'datascience', name: 'Data Science', icon: Cpu, color: 'bg-red-500' },
  { id: 'mobile', name: 'Mobile', icon: Globe, color: 'bg-pink-500' },
];

const EXPERIENCE_LEVELS = [
  { id: 'entry', label: 'Entry Level', desc: 'Starting my career', icon: Rocket },
  { id: 'mid', label: 'Mid Level', desc: '2-5 years experience', icon: Briefcase },
  { id: 'senior', label: 'Senior+', desc: '5+ years experience', icon: Target },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [experience, setExperience] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [goals, setGoals] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const { completeOnboarding, isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleComplete = async () => {
    try {
      await completeOnboarding({
        experienceLevel: experience,
        targetDomains: selectedDomains,
        careerGoals: goals,
      });
      router.push('/');
    } catch (err) {
      // Error is handled in the store
    }
  };

  if (!mounted) return null;

  const toggleDomain = (id: string) => {
    setSelectedDomains(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#090B11] text-slate-100 font-sans flex flex-col relative overflow-hidden">
      {/* Background Decor Nebula */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[300px] h-[300px] rounded-full bg-[#0A1628]/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] rounded-full bg-[#0A1628]/5 blur-[120px]" />
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-white/5 z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] shadow-[0_0_8px_rgba(59,0,32,0.6)]"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8"
            >
              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-black text-white font-display uppercase tracking-wide">Welcome, {user?.name?.split(' ')[0]}!</h1>
                <p className="text-slate-400 text-sm md:text-base font-medium">Identify your current experience level</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setExperience(level.id)}
                    className={`p-6 rounded-3xl border text-left space-y-4 group transition-all duration-300 cursor-pointer ${
                      experience === level.id 
                      ? 'border-[#0A1628] bg-gradient-to-tr from-[#0A1628]/20 to-[#1a3a6b]/10 shadow-[0_0_20px_rgba(59,0,32,0.2)]' 
                      : 'border-white/[0.06] bg-[#0F111A]/50 hover:border-white/[0.12] hover:bg-[#0F111A]/80'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      experience === level.id 
                      ? 'bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] text-white shadow-[0_0_10px_rgba(59,0,32,0.5)]' 
                      : 'bg-white/5 text-slate-400 group-hover:text-slate-200'
                    }`}>
                      <level.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white font-display text-base">{level.label}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium mt-1">{level.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-8">
                <button
                  disabled={!experience}
                  onClick={() => setStep(2)}
                  className="bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] hover:from-[#00021C] hover:to-[#00021C] disabled:opacity-20 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,0,32,0.45)] active:scale-[0.98] disabled:cursor-not-allowed cursor-pointer"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8"
            >
              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-black text-white font-display uppercase tracking-wide">Target Domains</h1>
                <p className="text-slate-400 text-sm md:text-base font-medium">Select the disciplines you want to master</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DOMAINS.map((domain) => (
                  <button
                    key={domain.id}
                    onClick={() => toggleDomain(domain.id)}
                    className={`p-6 rounded-3xl border text-center space-y-4 transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                      selectedDomains.includes(domain.id)
                      ? 'border-[#0A1628] bg-gradient-to-tr from-[#0A1628]/20 to-[#1a3a6b]/10 shadow-[0_0_20px_rgba(59,0,32,0.2)]' 
                      : 'border-white/[0.06] bg-[#0F111A]/50 hover:border-white/[0.12] hover:bg-[#0F111A]/80'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white transition-all duration-300 ${
                      selectedDomains.includes(domain.id) 
                      ? 'bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] shadow-[0_0_10px_rgba(59,0,32,0.5)]' 
                      : 'bg-white/5 group-hover:bg-white/10'
                    }`}>
                      <domain.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-white font-display text-sm">{domain.name}</h3>
                    {selectedDomains.includes(domain.id) && (
                      <div className="flex justify-center mt-1">
                        <CheckCircle2 className="w-4 h-4 text-[#3b82f6] text-glow-cyan" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-2xl font-black text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  disabled={selectedDomains.length === 0}
                  onClick={() => setStep(3)}
                  className="bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] hover:from-[#00021C] hover:to-[#00021C] disabled:opacity-20 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,0,32,0.45)] active:scale-[0.98] disabled:cursor-not-allowed cursor-pointer"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8"
            >
              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-black text-white font-display uppercase tracking-wide">Career Ambitions</h1>
                <p className="text-slate-400 text-sm md:text-base font-medium">What targets are you looking to unlock with Mockmate?</p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g., I want to secure a senior backend engineering role at a tier-1 company and level up my systemic thinking under stress..."
                  className="w-full h-44 p-6 bg-white/5 border border-white/[0.08] focus:border-[#0A1628] focus:ring-2 focus:ring-[#00021C]/20 rounded-3xl focus:outline-none transition-all duration-300 text-sm font-semibold text-white resize-none placeholder:text-slate-600 leading-relaxed"
                />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">
                  sarah ai core will parse this to dynamically customize interview paths
                </p>
              </div>

              <div className="flex justify-between pt-8">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-4 rounded-2xl font-black text-xs text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  disabled={!goals.trim()}
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] hover:from-[#00021C] hover:to-[#00021C] disabled:opacity-20 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,0,32,0.5)] active:scale-[0.98] disabled:cursor-not-allowed cursor-pointer"
                >
                  Complete Setup <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-8 text-center mt-auto">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.25em]">Mockmate Personalization Engine v2.0</p>
      </div>
    </div>
  );
}
