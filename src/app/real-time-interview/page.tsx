"use client";

import React from "react";
import RealTimeInterview from "@/components/RealTimeInterview";
import { Header } from "@/components/ui/Header";

export default function RealTimeInterviewPage() {
  return (
    <div className="min-h-screen text-[var(--foreground)] flex flex-col transition-colors duration-300">
      <Header 
        title="Real-Time Voice Interview" 
        subtitle="Neural core // Simulation line active" 
      />
      
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 flex flex-col justify-center">
        <RealTimeInterview />
      </main>
    </div>
  );
}
