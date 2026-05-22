'use client';
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { CareerCoachChat } from '@/components/CareerCoachChat';
import { motion } from 'framer-motion';
import { Zap, Target, Lightbulb } from 'lucide-react';

export default function CareerCoachPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f8f8f8] from-slate-50 via-blue-50 to-purple-50">
      <Header
        title="Career Coach"
        subtitle="AI-Powered Interview & Career Guidance // Master Your Skills"
      />

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-8 pb-20 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Chat Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <CareerCoachChat />
          </motion.div>

          {/* Sidebar with Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Quick Tips */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Quick Tips
              </h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-700 mb-1">STAR Method</p>
                  <p className="text-xs">Structure answers with Situation, Task, Action, Result</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Be Specific</p>
                  <p className="text-xs">Use concrete examples from your experience</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Practice Pacing</p>
                  <p className="text-xs">Speak clearly and avoid filler words</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Ask Questions</p>
                  <p className="text-xs">Show genuine interest in the role and company</p>
                </div>
              </div>
            </div>

            {/* Topics to Explore
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Topics to Explore
              </h3>
              <div className="space-y-2">
                {[
                  'Behavioral Questions',
                  'Technical Interview Tips',
                  'Resume Optimization',
                  'Salary Negotiation',
                  'Body Language',
                  'Networking Strategies',
                  'Career Transition',
                  'Remote Interview Tips',
                ].map((topic, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 cursor-pointer transition-colors"
                  >
                    {topic}
                  </div>
                ))}
              </div>
            </div> */}

            {/* Features */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                Features
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>24/7 AI Career Coach</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Personalized Guidance</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Practice Interview Tips</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Career Development</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Communication Skills</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Download Chat History</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
