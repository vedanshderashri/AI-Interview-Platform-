"use client";

import React from "react";
import RealTimeInterview from "@/components/RealTimeInterview";
import { Header } from "@/components/ui/Header";

export default function RealTimeInterviewPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header 
        title="Real-Time Interview" 
        subtitle="Neural Core // Professional Assessment Simulation" 
      />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <RealTimeInterview />
      </main>
    </div>
  );
}
