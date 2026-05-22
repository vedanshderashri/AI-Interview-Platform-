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
    primary: 'bg-slate-900 hover:bg-[#0f172b]-800 text-white border-slate-900',
    secondary: 'bg-white hover:bg-[#0f172b]-50 text-slate-900 border-slate-200',
    danger: 'bg-slate-900 hover:bg-[#0f172b]-800 text-white border-slate-900'
  };

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200',
        'rounded-lg border',
        'active:scale-[0.98] group disabled:opacity-50 disabled:cursor-not-allowed',
        'shadow-sm hover:shadow-md',
        variants[variant],
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {showArrow && (
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
      )}
    </button>
  );
}
