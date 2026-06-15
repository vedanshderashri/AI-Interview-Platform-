import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
}

export function GlassCard({ children, className, variant = 'default', ...props }: GlassCardProps) {
  const variants = {
    default: 'bg-[#0F111A]/70 backdrop-blur-xl border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:border-[#0A1628]/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.06)]',
    elevated: 'bg-[#121522]/80 backdrop-blur-xl border border-white/[0.1] shadow-[0_12px_40px_rgba(0,0,0,0.5)] hover:border-[#00021C]/30 hover:shadow-[0_0_40px_rgba(6,182,212,0.1)]'
  };

  return (
    <div
      className={cn(
        'p-6 md:p-8 relative overflow-hidden group transition-all duration-300 rounded-2xl',
        variants[variant],
        className
      )}
      {...props}
    >
      {/* Subtle interior glow effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] to-transparent pointer-events-none rounded-2xl" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
