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
    <div className="min-h-screen bg-white font-inter flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-100 z-50">
        <motion.div 
          className="h-full bg-[#4CAF50]"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
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
                <h1 className="text-4xl font-black text-slate-900">Welcome, {user?.name?.split(' ')[0]}!</h1>
                <p className="text-slate-500 text-lg">What's your current professional level?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setExperience(level.id)}
                    className={`p-6 rounded-3xl border-2 transition-all text-left space-y-4 group ${
                      experience === level.id 
                      ? 'border-[#4CAF50] bg-[#4CAF50]/5' 
                      : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      experience === level.id ? 'bg-[#4CAF50] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}>
                      <level.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{level.label}</h3>
                      <p className="text-sm text-slate-500">{level.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-8">
                <button
                  disabled={!experience}
                  onClick={() => setStep(2)}
                  className="bg-[#1F1F1F] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 disabled:opacity-30 transition-all hover:bg-[#4CAF50]"
                >
                  Next Step <ChevronRight className="w-5 h-5" />
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
                <h1 className="text-4xl font-black text-slate-900">Target Domains</h1>
                <p className="text-slate-500 text-lg">Select the areas you want to master</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DOMAINS.map((domain) => (
                  <button
                    key={domain.id}
                    onClick={() => toggleDomain(domain.id)}
                    className={`p-6 rounded-3xl border-2 transition-all text-center space-y-3 ${
                      selectedDomains.includes(domain.id)
                      ? 'border-[#4CAF50] bg-[#4CAF50]/5 shadow-lg shadow-[#4CAF50]/10' 
                      : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white ${
                      selectedDomains.includes(domain.id) ? 'bg-[#4CAF50]' : domain.color
                    }`}>
                      <domain.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900">{domain.name}</h3>
                    {selectedDomains.includes(domain.id) && (
                      <div className="flex justify-center">
                        <CheckCircle2 className="w-5 h-5 text-[#4CAF50]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-4 rounded-2xl font-bold text-slate-500 flex items-center gap-3 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button
                  disabled={selectedDomains.length === 0}
                  onClick={() => setStep(3)}
                  className="bg-[#1F1F1F] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 disabled:opacity-30 transition-all hover:bg-[#4CAF50]"
                >
                  Next Step <ChevronRight className="w-5 h-5" />
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
                <h1 className="text-4xl font-black text-slate-900">Career Goals</h1>
                <p className="text-slate-500 text-lg">What are you looking to achieve with Mockmate?</p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g., I want to land a Senior Frontend role at a top-tier tech company and improve my system design skills..."
                  className="w-full h-48 p-6 bg-slate-50 border border-slate-100 rounded-[32px] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:bg-white transition-all text-lg font-medium text-slate-900 resize-none"
                />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center">
                  Our AI will use this to personalize your interview questions
                </p>
              </div>

              <div className="flex justify-between pt-8">
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-4 rounded-2xl font-bold text-slate-500 flex items-center gap-3 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button
                  disabled={!goals.trim()}
                  onClick={handleComplete}
                  className="bg-[#4CAF50] text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-[#4CAF50]/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Complete Setup <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-8 text-center">
        <p className="text-slate-300 text-xs font-bold uppercase tracking-[0.2em]">Mockmate Personalization Engine v2.0</p>
      </div>
    </div>
  );
}
