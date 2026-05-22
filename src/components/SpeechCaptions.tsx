'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Mic } from 'lucide-react';

interface SpeechCaptionsProps {
  userTranscript: string;
  aiText: string;
  isAiSpeaking: boolean;
  isMicEnabled: boolean;
}

export function SpeechCaptions({
  userTranscript,
  aiText,
  isAiSpeaking,
  isMicEnabled
}: SpeechCaptionsProps) {
  const [displayedCaption, setDisplayedCaption] = useState('');
  const [captionSource, setCaptionSource] = useState<'user' | 'ai'>('user');

  useEffect(() => {
    if (isAiSpeaking && aiText) {
      setDisplayedCaption(aiText);
      setCaptionSource('ai');
    } else if (userTranscript && isMicEnabled) {
      setDisplayedCaption(userTranscript);
      setCaptionSource('user');
    } else {
      setDisplayedCaption('');
    }
  }, [userTranscript, aiText, isAiSpeaking, isMicEnabled]);

  if (!displayedCaption) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 pointer-events-none"
      >
        <div className="flex items-end justify-center pb-6 px-4">
          <div
            className={`max-w-2xl backdrop-blur-xl border rounded-lg px-6 py-4 shadow-2xl flex items-start gap-4 ${
              captionSource === 'ai'
                ? 'bg-[#4CAF50]/20 border-[#4CAF50]/60'
                : 'bg-[#F5F5F5]/95 border-[#E0E0E0]/80'
            }`}
          >
            {/* Source Icon */}
            <div
              className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center ${
                captionSource === 'ai'
                  ? 'bg-[#4CAF50]/40 text-[#4CAF50]'
                  : 'bg-[#E0E0E0] text-[#1F1F1F]'
              }`}
            >
              {captionSource === 'ai' ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </div>

            {/* Caption Content */}
            <div className="flex-1 min-w-0">
              <div
                className={`text-sm font-bold uppercase tracking-wider mb-1 ${
                  captionSource === 'ai'
                    ? 'text-[#4CAF50]'
                    : 'text-[#1F1F1F]/70'
                }`}
              >
                {captionSource === 'ai' ? 'AI_INTERVIEWER' : 'CANDIDATE'}
              </div>
              <div
                className={`text-sm font-medium leading-relaxed break-words ${
                  captionSource === 'ai'
                    ? 'text-[#4CAF50]'
                    : 'text-[#1F1F1F]'
                }`}
              >
                {displayedCaption}
              </div>
            </div>

            {/* Live Indicator */}
            {(captionSource === 'ai' ? isAiSpeaking : userTranscript) && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className={`flex-shrink-0 w-2 h-2 rounded-full ${
                  captionSource === 'ai' ? 'bg-[#4CAF50]' : 'bg-[#1F1F1F]'
                }`}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
