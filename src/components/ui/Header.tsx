'use client';
import React from 'react';
import { Bell, ChevronLeft, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useJobsStore } from '@/store/useJobsStore';
import Link from 'next/link';
import { useEffect } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export function Header({ title, subtitle, showBack = false }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchAlerts, markAsRead } = useJobsStore();

  useEffect(() => {
    // Initial fetch of alerts
    fetchAlerts();

    // Poll for new jobs every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="w-full h-16 border-b border-slate-100 bg-white flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-900"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Link
          href="/jobs"
          onClick={markAsRead}
          className="relative p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
        >

          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-slate-900 text-white text-[10px] font-black flex items-center justify-center rounded-full border border-white shadow-sm animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
          <div className="flex flex-col items-end">
            <span className="text-xs font-black text-slate-900">{user?.name?.split(' ')[0] || 'Candidate'}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Pro Level</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-lg bg-slate-50 hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white transition-all group"
            title="Log Out"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-semibold cursor-pointer shadow-sm">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
