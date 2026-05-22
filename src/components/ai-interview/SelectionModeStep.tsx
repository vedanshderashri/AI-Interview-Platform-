'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, LayoutList, Settings } from 'lucide-react';

interface SelectionModeStepProps {
  onSelect: (mode: 'resume' | 'domains') => void;
}

export function SelectionModeStep({ onSelect }: SelectionModeStepProps) {
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
          <Settings className="w-6 h-6 text-[#0891B2]" />
          <span className="text-sm font-semibold text-[#0891B2] uppercase tracking-wider">Choose Path</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#0F172A] text-center">
          How would you like to prepare?
        </h1>
        <p className="text-[#64748B] text-lg text-center max-w-xl">
          Select the interview type that best suits your preparation goals.
        </p>
      </div>

      {/* Mode Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Resume Option */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('resume')}
          className="card p-10 flex flex-col items-center justify-center gap-6 hover:shadow-lg text-center cursor-pointer group border-2 border-transparent hover:border-[#0891B2] transition-all"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-[#0891B2] to-[#06B6D4] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg rounded-xl">
            <FileText className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-bold text-[#0F172A]">
            Resume-Based
          </h3>
          <p className="text-[#64748B] text-sm leading-relaxed">
            Upload your resume and get customized questions based on your background and experience.
          </p>
        </motion.div>

        {/* Domains Option */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('domains')}
          className="card p-10 flex flex-col items-center justify-center gap-6 hover:shadow-lg text-center cursor-pointer group border-2 border-transparent hover:border-[#0891B2] transition-all"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-[#06B6D4] to-[#0E7490] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg rounded-xl">
            <LayoutList className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-bold text-[#0F172A]">
            Topic Selection
          </h3>
          <p className="text-[#64748B] text-sm leading-relaxed">
            Choose specific topics you want to practice. Perfect for targeted skill improvement.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
