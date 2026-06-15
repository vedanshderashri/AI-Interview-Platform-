import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  showArrow?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function GradientButton({
  children,
  className,
  showArrow = false,
  variant = 'primary',
  ...props
}: GradientButtonProps) {
  const variants = {
    primary: cn(
      'bg-gradient-to-r from-[#0A1628] to-[#1a3a6b] hover:from-[#00021C] hover:to-[#00021C] text-white border-transparent',
      'shadow-none hover:shadow-none'
    ),
    secondary: 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/[0.08] hover:border-white/20',
    danger: 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white border-transparent shadow-[0_0_15px_rgba(239,68,68,0.2)]'
  };

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-[0.15em] transition-all duration-300',
        'rounded-xl border cursor-pointer',
        'active:scale-[0.96] group disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      {...props}
    >
      {/* Glow highlight layer */}
      <span className="absolute inset-0 w-full h-full rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {showArrow && (
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform relative z-10 text-current" />
      )}
    </button>
  );
}
