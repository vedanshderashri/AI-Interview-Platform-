'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GradientButton } from '@/components/ui/GradientButton';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';

interface DomainSelectionStepProps {
  onSubmit: (domains: string[]) => void;
}

const DOMAIN_CATEGORIES = {
  'Core Tech': ['React', 'Next.js', 'TypeScript', 'JavaScript', 'CSS/Tailwind'],
  'Infrastructure': ['Node.js', 'System Design', 'Databases', 'APIs', 'DevOps'],
  'Soft Skills': [
    'Communication',
    'Leadership',
    'Conflict Resolution',
    'Teamwork',
    'Problem Solving',
  ],
  'Advanced': ['Machine Learning', 'Cloud Architecture', 'Security', 'Performance'],
};

export function DomainSelectionStep({ onSubmit }: DomainSelectionStepProps) {
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [customDomain, setCustomDomain] = useState('');
  const [error, setError] = useState('');

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
    setError('');
  };

  const addCustomDomain = () => {
    if (!customDomain.trim()) return;

    if (selectedDomains.includes(customDomain.trim())) {
      setError('This domain is already selected');
      return;
    }

    setSelectedDomains((prev) => [...prev, customDomain.trim()]);
    setCustomDomain('');
    setError('');
  };

  const handleSubmit = () => {
    if (selectedDomains.length === 0) {
      setError('Please select at least one domain');
      return;
    }
    onSubmit(selectedDomains);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addCustomDomain();
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
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="flex items-center gap-2 justify-center mb-2">
          <Sparkles className="w-6 h-6 text-[#0891B2]" />
          <span className="text-sm font-semibold text-[#0891B2] uppercase tracking-wider">Step 3</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#0F172A] text-center">
          Select Your Domains
        </h1>
        <p className="text-[#64748B] text-lg text-center max-w-xl">
          Choose the topics you'd like to be interviewed on today.
        </p>
      </div>

      {/* Domain Selection */}
      <div className="w-full max-w-4xl">
        {Object.entries(DOMAIN_CATEGORIES).map((category, categoryIndex) => (
          <motion.div
            key={category[0]}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="mb-10"
          >
            <h3 className="text-[#0F172A] font-bold text-sm mb-4 uppercase tracking-wider">
              {category[0]}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {category[1].map((domain) => (
                <motion.button
                  key={domain}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleDomain(domain)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all font-medium ${
                    selectedDomains.includes(domain)
                      ? 'border-[#0891B2] bg-[#0891B2]/10 text-[#0891B2]'
                      : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#0891B2] hover:bg-[#F0F9FA]'
                  }`}
                >
                  {selectedDomains.includes(domain) ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 opacity-30 flex-shrink-0" />
                  )}
                  <span className="text-sm">{domain}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Custom Domain Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-[#E2E8F0]"
        >
          <h3 className="text-[#0F172A] font-bold text-sm mb-4 uppercase tracking-wider">
            Add Custom Domain
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a topic (e.g., Go, Rust, AWS)..."
              className="flex-1 px-6 py-3 rounded-xl border-2 border-[#E2E8F0] outline-none focus:border-[#0891B2] focus:bg-[#F0F9FA] transition-all text-[#0F172A] placeholder:text-[#94A3B8]"
            />
            <button
              onClick={addCustomDomain}
              className="px-8 py-3 bg-[#0891B2] text-white font-semibold rounded-xl hover:bg-[#0E7490] transition-all shadow-sm hover:shadow-md"
            >
              Add
            </button>
          </div>
          {error && <p className="text-[#EF4444] text-sm mt-2">{error}</p>}
        </motion.div>

        {/* Selected Domains Display */}
        {selectedDomains.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 p-6 bg-[#0891B2]/10 rounded-xl border border-[#0891B2]/20"
          >
            <p className="text-[#0F172A] font-semibold text-sm mb-4">
              Selected: {selectedDomains.length} domain{selectedDomains.length !== 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedDomains.map((domain) => (
                <motion.div
                  key={domain}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-4 py-2 bg-[#0891B2] text-white rounded-full text-xs font-semibold flex items-center gap-2 hover:shadow-md transition-shadow"
                >
                  {domain}
                  <button
                    onClick={() => toggleDomain(domain)}
                    className="ml-1 hover:opacity-70 transition-opacity"
                  >
                    ✕
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Submit Button */}
      <div className="mt-12">
        <GradientButton
          onClick={handleSubmit}
          variant="primary"
          className="px-16 py-4 text-lg"
        >
          Continue to Interview
        </GradientButton>
      </div>
    </motion.div>
  );
}
