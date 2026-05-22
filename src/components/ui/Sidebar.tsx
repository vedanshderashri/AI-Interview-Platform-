'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Video,
  BarChart3,
  Users,
  HelpCircle,
  Settings,
  LogOut,
  Brain,
  Share2,
  Sparkles,
  Mic,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

const menuItems = [
  {
    group: 'Main Menu', items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
      { name: 'Practice Interview', icon: Brain, href: '/ai-interview-advanced' },
      { name: 'Real-Time-Interview', icon: Mic, href: '/real-time-interview' },
      { name: 'Career Coach', icon: Sparkles, href: '/career-coach' },
      { name: 'Resume Checker', icon: Users, href: '/resume-ats-checker' }
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();

  // Hide sidebar on auth pages
  const isAuthPage = ['/login', '/signup', '/onboarding'].includes(pathname ?? '');
  if (isAuthPage || !isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-100 flex flex-col z-50 sticky top-0">
      {/* Logo */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-900 flex items-center justify-center rounded-lg shadow-sm">
          <Brain className="text-white w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-900 uppercase tracking-tight">MockMate</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em]">Assessment Platform</span>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-6 pb-6">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-900 truncate">{user?.name}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Premium Account</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-8 overflow-y-auto scrollbar-none">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-4">
            <h3 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 transition-colors flex-shrink-0",
                      isActive ? "text-white" : "text-slate-300 group-hover:text-slate-900"
                    )} />
                    <span className="text-sm font-semibold">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
