"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader, Mic, StopCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  score?: number;
  feedback?: string;
}

interface InterviewResponse {
  question: string;
  feedback?: string;
  score?: number;
  followUp?: string;
  nextStep: string;
  assessment?: string;
}

export default function InterviewAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        '{"question": "Tell me about yourself and your background. What are your key skills and experience?", "score": 0, "nextStep": "question"}',
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseResponse = (text: string): InterviewResponse => {
    try {
      return JSON.parse(text);
    } catch {
      return {
        question: text,
        nextStep: "question",
      };
    }
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || input.trim();

    if (!messageContent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/interview-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages,
            { role: "user", content: messageContent },
          ].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          questionCount,
        }),
      });

      const rawText = await response.text();
      let data;

      try {
        data = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Invalid response: ${rawText}`);
      }

      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }

      const parsed = parseResponse(data.response);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: parsed.question || data.response,
        timestamp: new Date(),
        score: parsed.score,
        feedback: parsed.feedback,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setQuestionCount((prev) => prev + 1);
    } catch (error: any) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#F5F5F5] font-inter selection:bg-[#4CAF50]/20">
      {/* Header */}
      <div className="h-20 border-b border-[#E0E0E0] bg-white/80 backdrop-blur-3xl flex items-center px-10 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#4CAF50] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-outfit font-black text-[#1F1F1F] uppercase tracking-tight">
              Interview AI
            </h2>
            <span className="text-[12px] font-bold text-[#999999] uppercase tracking-[0.3em] mt-0.5">
              Practice Questions • Questions: {questionCount}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-2xl rounded-lg px-5 py-4 ${
                    message.role === "user"
                      ? "bg-[#0891B2] text-white rounded-br-none shadow-[0_0_20px_rgba(8,145,178,0.2)]"
                      : "bg-white text-[#0F172A] rounded-bl-none border border-[#E2E8F0] shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                  }`}
                >
                  <p className="leading-relaxed text-sm">{message.content}</p>
                  {message.score !== undefined && message.role === "assistant" && (
                    <div className="mt-2 pt-2 border-t border-[#E2E8F0]">
                      <p className="text-xs font-bold text-[#0891B2]">
                        Score: {message.score}/10
                      </p>
                    </div>
                  )}
                  <p
                    className={`text-xs mt-2 ${
                      message.role === "user"
                        ? "text-[#0891B2]/70"
                        : "text-[#64748B]"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                key="loader"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white text-[#0F172A] rounded-lg rounded-bl-none px-5 py-4 border border-[#E2E8F0] shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin text-[#0891B2]" />
                  <span className="text-sm font-medium">Interviewer thinking...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 border-t border-[#E0E0E0] bg-white">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !loading) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type your answer here..."
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg bg-[#F8FAFC] text-[#0F172A] placeholder-[#94A3B8] border border-[#E2E8F0] focus:border-[#0891B2] focus:outline-none focus:ring-2 focus:ring-[#0891B2]/20 transition disabled:opacity-50"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-[#0891B2] text-white rounded-lg hover:bg-[#0E7490] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 font-bold shadow-[0_0_20px_rgba(8,145,178,0.2)] hover:shadow-[0_0_30px_rgba(8,145,178,0.3)]"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
          <p className="text-xs text-[#64748B] mt-2 text-center font-medium">
            Press Enter to submit • Questions answered: {questionCount}
          </p>
        </div>
      </div>
    </div>
  );
}
