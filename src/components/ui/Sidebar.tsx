'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Brain,
  Sparkles,
  Users,
  LogOut,
  ChevronDown,
  Activity,
  Paperclip
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

const menuItems = [
  {
    group: 'Main Menu',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
      { name: 'Real-time Interview', icon: Activity, href: '/real-time-interview' },
      { name: 'Career Coach', icon: Sparkles, href: '/career-coach' },
      { name: 'Resume Builder', icon: Paperclip, href: '/resume-builder' },
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
    <aside className="w-64 h-screen bg-[#18181B] border-r border-[#27272A] flex flex-col z-50 sticky top-0 transition-colors duration-300">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-tr from-[#635BFF] to-[#7C74FF] flex items-center justify-center rounded-xl shadow-[0_0_15px_rgba(99,91,255,0.3)]">
          <Brain className="text-white w-5 h-5 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-white uppercase tracking-wider font-display">MockMate</span>
          <span className="text-[9px] text-[#635BFF] font-bold uppercase tracking-[0.12em]">AI Core Platform</span>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-6 pb-4">
        <div className="p-3.5 bg-[#27272A]/40 rounded-xl border border-[#27272A] flex items-center justify-between hover:bg-[#27272A]/60 transition-all duration-300 group cursor-pointer">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#635BFF] to-[#7C74FF] flex items-center justify-center text-white font-black text-xs border border-white/10 shadow-inner">
              {user?.name?.[0] || 'V'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate leading-none mb-1">{user?.name || 'Vedansh'}</span>
              <span className="text-[9px] font-black text-[#635BFF] uppercase tracking-wider leading-none">Professional</span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#71717A] group-hover:text-white transition-colors duration-200" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto scrollbar-none">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-4">
            <h3 className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#71717A]">
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
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                      isActive
                        ? "bg-gradient-to-r from-[#635BFF]/12 to-[#635BFF]/2 text-white border-l-2 border-[#635BFF] font-bold shadow-[0_0_15px_rgba(99,91,255,0.05)]"
                        : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/30"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 transition-colors flex-shrink-0",
                      isActive ? "text-[#635BFF]" : "text-[#71717A] group-hover:text-white"
                    )} />
                    <span className="text-xs font-bold tracking-wider uppercase">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="px-4 pb-6 pt-3 border-t border-[#27272A]">
        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3.5 w-full text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/40 rounded-xl transition-all group cursor-pointer"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform flex-shrink-0 text-[#71717A] group-hover:text-white" />
          <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
