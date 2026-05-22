'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Circle, Timer } from 'lucide-react';

interface TimeSelectionStepProps {
  onSubmit: (duration: number, questionCount: number) => void;
}

const TIME_OPTIONS = [
  { duration: 5, questions: 3, label: '5 Minutes' },
  { duration: 10, questions: 10, label: '10 Minutes' },
  { duration: 15, questions: 15, label: '15 Minutes' },
  { duration: 20, questions: 20, label: '20 Minutes' },
  { duration: 30, questions: 30, label: '30 Minutes' },
  { duration: 45, questions: 45, label: '45 Minutes' },
];

export function TimeSelectionStep({ onSubmit }: TimeSelectionStepProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleSelect = (duration: number, questions: number) => {
    setSelectedOption(duration);
    onSubmit(duration, questions);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="w-full flex flex-col items-center gap-8"
    >
      {/* Title */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <div className="flex items-center gap-2 justify-center mb-2">
          <Timer className="w-6 h-6 text-[#0891B2]" />
          <span className="text-sm font-semibold text-[#0891B2] uppercase tracking-wider">Final Step</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#0F172A] text-center">
          How much time have?
        </h1>
        <p className="text-[#64748B] text-lg text-center max-w-xl">
          Select the duration that works best for you. This determines the number of questions.
        </p>
      </div>

      {/* Time Options Grid */}
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TIME_OPTIONS.map((option) => (
            <motion.button
              key={option.duration}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(option.duration, option.questions)}
              className={`flex flex-col items-center gap-4 px-6 py-8 rounded-xl border-2 transition-all font-medium ${
                selectedOption === option.duration
                  ? 'border-[#0891B2] bg-[#0891B2]/10 text-[#0891B2]'
                  : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#0891B2] hover:bg-[#F0F9FA]'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                {selectedOption === option.duration ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Circle className="w-6 h-6 opacity-30" />
                )}
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5" />
                  <h3 className="text-xl font-bold">
                    {option.label}
                  </h3>
                </div>
                <p className="text-sm opacity-75">
                  {option.questions} questions
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-12 max-w-2xl text-center"
      >
        <p className="text-[#64748B] text-sm leading-relaxed">
          Your interview will include technical questions, behavioral scenarios, and problem-solving challenges tailored to the time you select.
        </p>
      </motion.div>
    </motion.div>
  );
}
