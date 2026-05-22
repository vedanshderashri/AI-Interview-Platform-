'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GradientButton } from '@/components/ui/GradientButton';
import { User } from 'lucide-react';

interface CandidateNameStepProps {
  onSubmit: (name: string) => void;
}

export function CandidateNameStep({ onSubmit }: CandidateNameStepProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    onSubmit(name.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="w-full flex flex-col items-center gap-8"
    >
      {/* Title */}
      <div className="flex flex-col items-center gap-4 mb-12">
        <div className="flex items-center gap-2 justify-center mb-2">
          <User className="w-6 h-6 text-[#0891B2]" />
          <span className="text-sm font-semibold text-[#0891B2] uppercase tracking-wider">Step 1</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-[#0F172A] text-center">
          Welcome
        </h1>
        <p className="text-[#64748B] text-lg text-center max-w-xl">
          Let's start by getting your name to personalize your interview experience.
        </p>
      </div>

      {/* Name Input */}
      <div className="w-full max-w-2xl">
        <div className="relative group">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            onKeyPress={handleKeyPress}
            placeholder="Your full name..."
            className="w-full bg-white border-b-2 border-[#E2E8F0] px-8 py-6 text-3xl md:text-4xl text-center text-[#0F172A] outline-none focus:border-[#0891B2] transition-all placeholder:text-[#94A3B8] font-semibold shadow-[0_20px_40px_-20px_rgba(8,145,178,0.1)] focus:shadow-[0_20px_40px_-20px_rgba(8,145,178,0.3)]"
          />
          {error && (
            <p className="text-[#EF4444] text-sm mt-3 text-center font-medium">{error}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-16">
        <GradientButton 
          onClick={handleSubmit} 
          variant="primary"
          className="px-16 py-4 text-lg"
        >
          Get Started
        </GradientButton>
      </div>
    </motion.div>
  );
}
