'use client';
import React, { useEffect, useRef, useState } from 'react';

interface AiCharacterProps {
  isSpeaking: boolean;
  isThinking: boolean;
  name?: string;
  /** Live Tavus CVI conversation_url (Daily.co). When provided, the iframe is shown. */
  conversationUrl?: string | null;
  /** Legacy prop kept for backward compat */
  videoUrl?: string | null;
  /** Legacy prop kept for backward compat */
  useTavusVideo?: boolean;
}

export function AiCharacter({ isSpeaking, isThinking, name = 'Kriyeta', conversationUrl = null }: AiCharacterProps) {
  if (conversationUrl) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full relative">
        {/* Live CVI badge */}
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold tracking-widest uppercase backdrop-blur-md"
          style={{
            background: 'rgba(99,102,241,0.18)',
            borderColor: 'rgba(99,102,241,0.45)',
            color: '#7dd3fc',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#2563eb] animate-pulse"
          />
          {name} — Live AI Interviewer
        </div>

        {/* Tavus CVI Video Container */}
        <div 
          id="tavus-video-container" 
          className="w-full h-full rounded-2xl overflow-hidden bg-[#050508]"
        >
          <iframe
            src={conversationUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full"
            style={{ border: 'none', minHeight: '480px' }}
            title="Tavus AI Interviewer"
          />
        </div>
      </div>
    );
  }

  // Pure loading/standby state - no robot!
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full h-full">
      <div className="relative group">
        {/* Animated pulse rings */}
        <div className="absolute inset-0 rounded-full bg-[#4CAF50]/10 animate-ping [animation-duration:3s]" />
        <div className="absolute inset-0 rounded-full bg-[#4CAF50]/5 animate-pulse [animation-duration:2s]" />
        
        {/* Central Core Icon */}
        <div className="w-24 h-24 rounded-full bg-white border border-[#4CAF50]/20 flex items-center justify-center relative z-10">
          <div className="w-12 h-12 rounded-full border-2 border-[#4CAF50]/30 border-t-[#4CAF50] animate-spin" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <h3 className="text-[#1F1F1F] font-outfit font-black tracking-widest uppercase text-sm">{name} Interview Engine</h3>
        <p className="text-[#1F1F1F]/50 text-sm font-medium uppercase tracking-[0.2em]">Preparing Live Character...</p>
      </div>

      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div 
            key={i} 
            className="w-1 h-3 bg-[#4CAF50]/40 rounded-full animate-bounce" 
            style={{ animationDelay: `${i * 0.15}s` }} 
          />
        ))}
      </div>
    </div>
  );
}
