'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader,
  AlertCircle,
  Download,
  Copy,
  Check,
  Sparkles,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Lock
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function CareerCoachChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Hi Vedansh! I'm here to help you with:\n\n• Interview Preparation - Practice interview questions, improve your answers, learn structured response techniques like STAR, and prepare for behavioral, technical, and HR interviews.\n\n• Career Guidance - Plan your career path, identify growth opportunities, improve your professional profile, and build in-demand skills.\n\n• Communication Skills - Enhance clarity, confidence, professional speaking, and storytelling for interviews, presentations, and workplace conversations.\n\n• Professional Support - Get guidance on job applications, resume improvement, networking, productivity, and overall career development.\n\nWhat would you like to focus on today?`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessage = input.trim();
    setInput('');

    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Prepare messages for API
      const apiMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      apiMessages.push({
        role: 'user',
        content: userMessage,
      });

      const response = await fetch('/api/career-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get response');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to process request');
      }

      // Add assistant message
      const newAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newAssistantMessage]);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadChat = () => {
    const chatContent = messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n---\n\n');

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(chatContent)
    );
    element.setAttribute('download', `career-coach-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all messages? This cannot be undone.')) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hi Vedansh! I'm here to help you with:\n\n• Interview Preparation - Practice interview questions, improve your answers, learn structured response techniques like STAR, and prepare for behavioral, technical, and HR interviews.\n\n• Career Guidance - Plan your career path, identify growth opportunities, improve your professional profile, and build in-demand skills.\n\n• Communication Skills - Enhance clarity, confidence, professional speaking, and storytelling for interviews, presentations, and workplace conversations.\n\n• Professional Support - Get guidance on job applications, resume improvement, networking, productivity, and overall career development.\n\nWhat would you like to focus on today?`,
          timestamp: new Date(),
        },
      ]);
      setError(null);
    }
  };

  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-3.5 text-sm leading-relaxed text-[var(--text-white-or-dark)] transition-colors">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Match starting bullets (e.g. •, , -, *, or raw emojis)
          const bulletMatch = trimmed.match(/^([💡🚀🗣️💼•\-\*\uFFFD]|\uD83D[\uDCA1\uDE80\uDCAC\uDCBC])\s*(.*)$/);
          if (bulletMatch) {
            const rest = bulletMatch[2];
            const parts = rest.split(/\s*[-—]\s*(.*)/);
            const title = parts[0];
            const description = parts[1] || '';
            return (
              <div key={idx} className="flex gap-3.5 items-start pl-1 py-1">
                {/* Styled elegant dot bullet */}
                <div className="w-1.5 h-1.5 rounded-full bg-[#635BFF] dark:bg-[#7C74FF] shrink-0 mt-1.5 transition-colors" />
                <div className="flex flex-col">
                  <span className="font-extrabold text-[var(--text-white-or-dark)] text-xs">{title}</span>
                  <span className="text-[11px] text-[var(--text-slate-or-dark)] mt-0.5 leading-relaxed font-semibold">{description}</span>
                </div>
              </div>
            );
          }

          // Check if it's the prompter question at the end
          if (trimmed.toLowerCase().includes('what would you like to focus on today')) {
            return (
              <div key={idx} className="font-bold text-[var(--text-white-or-dark)] mt-4 pt-1 flex items-center gap-1">
                <span>{trimmed}</span>
              </div>
            );
          }

          // Normal line
          return (
            <p key={idx} className="text-xs font-semibold text-[var(--text-white-or-dark)]">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div className="w-full flex flex-col h-[650px] bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
      {/* Mini Controls Header */}
      <div className="bg-[var(--card-bg)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <Sparkles className="w-5 h-5 text-[#635BFF] dark:text-[#7C74FF] shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase text-[var(--text-white-or-dark)] tracking-wider font-display leading-tight">
              SARAH'S CONSULTATION
            </span>
            <span className="text-[10px] font-bold text-[var(--text-slate-or-dark)]">
              AI Career Coach
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadChat}
            className="p-2 hover:bg-[var(--sidebar-profile-bg)] border border-[var(--border)] rounded-xl text-[var(--text-slate-or-dark)] hover:text-[var(--text-white-or-dark)] transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            title="Download Transcript"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearChat}
            className="p-2 hover:bg-red-500/5 border border-[var(--border)] rounded-xl text-[var(--text-slate-or-dark)] hover:text-red-500 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            title="Clear Chat Log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-none bg-[var(--sidebar-profile-bg)] bg-opacity-10 transition-colors">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3.5 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-9 h-9 rounded-full bg-[#0B0F19] dark:bg-[#1E293B] border border-[var(--border)] flex items-center justify-center text-white shrink-0 shadow-sm transition-colors">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl px-6 py-5 rounded-2xl group relative border transition-all duration-300 ${
                    isUser
                      ? 'bg-[#635BFF] text-white border-transparent shadow-sm rounded-tr-none'
                      : 'bg-[var(--card-bg)] text-[var(--text-white-or-dark)] border-[var(--border)] shadow-sm rounded-tl-none'
                  }`}
                >
                  {/* Bubble Header */}
                  <div className="flex items-center justify-between gap-4 mb-3 border-b border-[var(--border-light)] pb-2 transition-colors">
                    <span className={`text-[11px] font-black uppercase tracking-wider ${isUser ? 'text-white/80' : 'text-[var(--text-slate-or-dark)]'}`}>
                      {isUser ? 'Candidate' : 'Sarah (AI Coach)'}
                    </span>
                    <span className={`text-[9px] font-medium ${isUser ? 'text-white/60' : 'text-[var(--text-slate-or-dark)]'}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className={`whitespace-pre-wrap break-words text-xs leading-relaxed font-bold ${isUser ? 'text-white' : ''}`}>
                    {isUser ? (
                      message.content
                    ) : (
                      renderMessageContent(message.content)
                    )}
                  </div>

                  {/* Assistant Actions Footer inside Bubble */}
                  {!isUser && (
                    <div className="flex items-center gap-3.5 mt-4 pt-3 border-t border-[var(--border-light)] text-[var(--text-slate-or-dark)] transition-colors">
                      <button className="hover:text-[var(--text-white-or-dark)] transition-colors cursor-pointer p-0.5" title="Like response">
                        <ThumbsUp size={13} className="stroke-[2.2px]" />
                      </button>
                      <button className="hover:text-[var(--text-white-or-dark)] transition-colors cursor-pointer p-0.5" title="Dislike response">
                        <ThumbsDown size={13} className="stroke-[2.2px]" />
                      </button>
                      <button
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        className="hover:text-[var(--text-white-or-dark)] transition-colors cursor-pointer p-0.5"
                        title="Copy message"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5px]" />
                        ) : (
                          <Copy size={13} className="stroke-[2.2px]" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3.5 items-start justify-start"
          >
            <div className="w-9 h-9 rounded-full bg-[#0B0F19] dark:bg-[#1E293B] border border-[var(--border)] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-white-or-dark)] px-5 py-4 rounded-2xl rounded-tl-none flex gap-3 items-center shadow-sm">
              <Loader className="w-4 h-4 animate-spin text-[#635BFF] dark:text-[#7C74FF]" />
              <span className="text-xs font-black uppercase tracking-widest text-[#635BFF] dark:text-[#7C74FF] animate-pulse">Sarah is preparing response...</span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="bg-red-500/10 text-red-400 px-5 py-4 rounded-xl border border-red-500/20 flex gap-2.5 items-start max-w-md shadow-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm font-semibold">{error}</div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--border)] bg-[var(--card-bg)] p-5 transition-colors">
        <form onSubmit={handleSendMessage} className="flex gap-4 items-end">
          <div className="relative flex-1 flex items-center bg-[var(--sidebar-profile-bg)] border border-[var(--border)] focus-within:border-[#635BFF] focus-within:ring-2 focus-within:ring-[#635BFF]/15 rounded-xl px-4 py-3.5 transition-all">
            <Sparkles className="w-4 h-4 text-[var(--text-slate-or-dark)] shrink-0 mr-3" />
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e as any);
                }
              }}
              placeholder="Query your career advisor Sarah..."
              className="flex-1 resize-none bg-transparent text-sm focus:outline-none transition-all text-[var(--text-white-or-dark)] font-bold max-h-32 placeholder:text-[var(--text-slate-or-dark)]/50"
              disabled={isLoading}
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-12 h-12 bg-[#635BFF] hover:bg-[#7C74FF] disabled:opacity-20 text-white rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-[#635BFF]/15"
            title="Transmit message"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        
        <p className="text-[10px] text-[var(--text-slate-or-dark)] mt-4 font-black uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 transition-colors">
          <Lock size={12} className="text-[var(--text-slate-or-dark)] stroke-[2.2px]" />
          SARAH AI SYSTEM CORE: OPTIMIZED FOR STAR STRUCTURES, BEHAVIORAL DIAGNOSTICS, AND CAREER STRATEGIES
        </p>
      </div>
    </div>
  );
}
