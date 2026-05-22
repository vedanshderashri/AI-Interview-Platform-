import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
}

export function GlassCard({ children, className, variant = 'default', ...props }: GlassCardProps) {
  const variants = {
    default: 'bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md',
    elevated: 'bg-white border border-[#E2E8F0] shadow-md hover:shadow-lg'
  };

  return (
    <div
      className={cn(
        'card-hover p-6 md:p-8 relative overflow-hidden group transition-all duration-300 rounded-2xl',
        variants[variant],
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
