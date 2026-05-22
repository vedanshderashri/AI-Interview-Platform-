'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Github } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mounted, setMounted] = useState(false);
  const { login, isAuthenticated, loading, error, clearError } = useAuthStore();
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
      await login(email, password);
      router.push('/');
    } catch (err) {
      // Error is handled in the store
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F5F5] font-inter p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-[#4CAF50]/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[450px] bg-white rounded-[32px] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-16 h-16 bg-[#1F1F1F] rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl"
          >
            <div className="w-8 h-8 border-4 border-white rounded-full border-t-transparent animate-spin-slow" />
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Continue your interview preparation</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#4CAF50] transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:bg-white transition-all font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
              <button type="button" className="text-xs font-bold text-[#4CAF50] hover:underline">Forgot?</button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#4CAF50] transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:bg-white transition-all font-medium text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4CAF50] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#439c47] transition-all shadow-xl shadow-[#4CAF50]/20 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Sign In <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        {/* <div className="mt-8 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-slate-100" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Or login with</span>
          <div className="h-[1px] flex-1 bg-slate-100" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <button className="flex items-center justify-center gap-2 py-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-slate-700">
            <Github className="w-5 h-5" /> GitHub
          </button>
          <button className="flex items-center justify-center gap-2 py-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-slate-700">
            <div className="w-5 h-5 bg-red-500 rounded-sm" /> Google
          </button>
        </div> */}

        <p className="mt-10 text-center text-slate-500 font-medium">
          New to Mockmate?{' '}
          <Link href="/signup" className="text-[#4CAF50] font-bold hover:underline">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
