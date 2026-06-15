'use client';
import React, { useEffect, useState } from 'react';
import { Bell, ChevronLeft, User, LogOut, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useJobsStore } from '@/store/useJobsStore';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export function Header({ title, subtitle, showBack = false }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchAlerts, markAsRead } = useJobsStore();
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    const isLightMode = document.documentElement.classList.contains('light');
    setIsLight(isLightMode);
  }, []);

  const toggleTheme = () => {
    if (isLight) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setIsLight(false);
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      setIsLight(true);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="w-full h-16 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-45 transition-colors duration-300">
      <div className="flex items-center gap-6">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[var(--sidebar-profile-bg)] rounded-xl transition-all duration-200 text-[var(--text-slate-or-dark)] hover:text-[var(--text-white-or-dark)] cursor-pointer active:scale-95 border border-transparent hover:border-[var(--border)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-black text-[var(--text-white-or-dark)] uppercase tracking-wider font-display transition-colors">
            {title}
          </h2>
          {subtitle && (
            <span className="text-[9px] font-black text-[var(--text-slate-or-dark)] uppercase tracking-widest transition-colors">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 bg-white dark:bg-[#1E1E24] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-slate-or-dark)] hover:text-[var(--primary)] rounded-xl transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center shadow-sm"
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {isLight ? (
            <Moon className="w-4 h-4 text-[#635BFF]" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
          )}
        </button>

        {/* Notifications Icon */}
        <Link
          href="/jobs"
          onClick={markAsRead}
          className="relative p-2 bg-white dark:bg-[#1E1E24] border border-[var(--border)] hover:border-[var(--primary)] rounded-xl transition-all duration-200 text-[var(--text-slate-or-dark)] hover:text-[var(--primary)] flex items-center justify-center shadow-sm"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#635BFF] text-white text-[8px] font-black flex items-center justify-center rounded-full shadow-md animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Controls */}
        <div className="flex items-center gap-4 pl-4 border-l border-[var(--border)]">
          <div className="flex flex-col items-end">
            <span className="text-xs font-black text-[var(--text-white-or-dark)] tracking-wide font-display transition-colors">
              {user?.name?.split(' ')[0] || 'Vedansh'}
            </span>
            <span className="text-[9px] font-black text-[#635BFF] uppercase tracking-widest">
              Professional
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl bg-white dark:bg-[#1E1E24] border border-[var(--border)] hover:border-[#EF4444]/40 hover:bg-[#EF4444]/5 flex items-center justify-center text-[var(--text-slate-or-dark)] hover:text-[#EF4444] transition-all duration-200 group cursor-pointer active:scale-95 shadow-sm"
            title="Log Out"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#635BFF] to-[#7C74FF] flex items-center justify-center text-white cursor-pointer border border-white/10 shadow-sm hover:shadow-[0_0_15px_rgba(99,91,255,0.3)] transition-all duration-300">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
