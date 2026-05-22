'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  MessageCircle,
  Loader,
  AlertCircle,
  RefreshCw,
  Download,
  Copy,
  Check,
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
        content: `Hello! I’m your AI Career Coach.\n\nI can help you with:\n\nInterview Preparation - Practice interview questions, improve your answers, learn structured response techniques like STAR, and prepare for behavioral, technical, and HR interviews.\n\nCareer Guidance - Plan your career path, identify growth opportunities, improve your professional profile, and build in-demand skills.\n\nCommunication Skills - Enhance clarity, confidence, professional speaking, and storytelling for interviews, presentations, and workplace conversations.\n\nProfessional Support - Get guidance on job applications, resume improvement, networking, productivity, and overall career development.\n\nWhat would you like to focus on today?`,
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
      // Prepare messages for API (without timestamps and IDs)
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
          content: `Hello! I’m your AI Career Coach.\n\nI can help you with:\n\nInterview Preparation - Practice interview questions, improve your answers, learn structured response techniques like STAR, and prepare for behavioral, technical, and HR interviews.\n\nCareer Guidance - Plan your career path, identify growth opportunities, improve your professional profile, and build in-demand skills.\n\nCommunication Skills - Enhance clarity, confidence, professional speaking, and storytelling for interviews, presentations, and workplace conversations.\n\nProfessional Support - Get guidance on job applications, resume improvement, networking, productivity, and overall career development.\n\nWhat would you like to focus on today?`,
          timestamp: new Date(),
        },
      ]);
      setError(null);
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full flex flex-col h-200 bg-white rounded-2xl overflow-hidden ">
      {/* Header */}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth bg-[#F8FAFC]">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-2xl group ${message.role === 'user'
                  ? 'bg-[#0891B2] text-white rounded-br-none'
                  : 'bg-white text-[#0F172A] border border-[#E2E8F0] rounded-bl-none shadow-sm'
                  }`}
              >
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {message.content}
                </div>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => handleCopyMessage(message.id, message.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#F1F5F9] rounded"
                      title="Copy message"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-4 h-4 text-[#10B981]" />
                      ) : (
                        <Copy className="w-4 h-4 text-[#94A3B8]" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white text-[#0F172A] px-4 py-3 rounded-2xl rounded-bl-none border border-[#E2E8F0] flex gap-2 items-center">
              <Loader className="w-4 h-4 animate-spin text-[#0891B2]" />
              <span className="text-sm">Coach is thinking...</span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="bg-[#FEE2E2] text-[#DC2626] px-4 py-3 rounded-lg border border-[#FECACA] flex gap-2 items-start max-w-md">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[#E2E8F0] bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
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
            placeholder="Ask your career coach anything... (Shift+Enter for new line)"
            className="flex-1 resize-none rounded-lg border border-[#CBD5E1] focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/20 px-4 py-3 text-sm focus:outline-none transition-all max-h-30 text-[#0F172A]"
            disabled={isLoading}
            rows={1}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-12 h-12 bg-[#0891B2] hover:bg-[#0E7490] disabled:bg-[#CBD5E1] text-white rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed"
            title="Send message"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-[#64748B] mt-2">
          💡 Tip: Ask about interview questions, career tips, communication skills, and more!
        </p>
      </div>
    </div>
  );
}
