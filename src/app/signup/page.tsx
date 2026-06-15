'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mounted, setMounted] = useState(false);
  const { signup, isAuthenticated, loading, error, clearError } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      router.push('/');
    }
    return () => clearError();
  }, [isAuthenticated, router, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(email, name, password);
      router.push('/onboarding');
    } catch (err) {
      // Error is handled in the store
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090B11] font-sans p-4 relative overflow-hidden">
      {/* Background Decor Nebula */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] rounded-full bg-[#0A1628]/5 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] rounded-full bg-[#0A1628]/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[440px] bg-[#0F111A]/60 backdrop-blur-xl border border-white/[0.06] rounded-[32px] p-10 shadow-2xl relative z-10"
      >
        <div className="w-full flex flex-col items-center justify-center mb-10 text-center">
          <img src="/logo.png" className="w-16 h-16 mx-auto mb-4 hover:scale-105 transition-transform duration-300" alt="MockMate Logo" />
          <h1 className="text-2xl font-black text-white tracking-tight mb-1 uppercase font-display">Mockmate</h1>
          <p className="text-[10px] text-[#3b82f6] font-bold uppercase tracking-[0.25em] text-glow-cyan">AI Simulation Platform</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#3b82f6] transition-colors" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/[0.08] focus:border-[#0A1628] focus:ring-2 focus:ring-[#0A1628]/20 rounded-2xl focus:outline-none transition-all duration-300 font-semibold text-white placeholder:text-slate-600 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#3b82f6] transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/[0.08] focus:border-[#0A1628] focus:ring-2 focus:ring-[#0A1628]/20 rounded-2xl focus:outline-none transition-all duration-300 font-semibold text-white placeholder:text-slate-600 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#3b82f6] transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/[0.08] focus:border-[#0A1628] focus:ring-2 focus:ring-[#0A1628]/20 rounded-2xl focus:outline-none transition-all duration-300 font-semibold text-white placeholder:text-slate-600 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] hover:from-[#00021C] hover:to-[#00021C] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,0,32,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Create Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500 font-semibold">
          Already have an account?{' '}
          <Link href="/login" className="text-[#3b82f6] hover:text-[#60a5fa] font-black tracking-wide uppercase transition-colors ml-1">
            Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
