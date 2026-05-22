'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/ui/Header';
import { CandidateNameStep } from '@/components/ai-interview/CandidateNameStep';
import { SelectionModeStep } from '@/components/ai-interview/SelectionModeStep';
import { ResumUploadStep } from '@/components/ai-interview/ResumeUploadStep';
import { DomainSelectionStep } from '@/components/ai-interview/DomainSelectionStep';
import { TimeSelectionStep } from '@/components/ai-interview/TimeSelectionStep';
import { AIInterviewSession } from '@/components/ai-interview/AIInterviewSession';
import { useInterviewStore } from '@/store/interviewStore';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Step = 'name' | 'mode' | 'resume' | 'domains' | 'time' | 'interview';

const steps: { id: Step; label: string }[] = [
  { id: 'name', label: 'Enter Name' },
  { id: 'mode', label: 'Select Mode' },
  { id: 'resume', label: 'Upload Resume' },
  { id: 'domains', label: 'Select Domains' },
  { id: 'time', label: 'Select Time' },
  { id: 'interview', label: 'Interview' },
];

export default function AIInterviewAdvancedPage() {
  const [mounted, setMounted] = useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [candidateName, setCandidateName] = useState('');
  const [mode, setMode] = useState<'resume' | 'domains' | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(15);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(15);

  const initializeSession = useInterviewStore(state => state.initializeSession);

  const handleNameSubmit = (name: string) => {
    setCandidateName(name);
    setCurrentStep('mode');
  };

  const handleModeSelect = (selectedMode: 'resume' | 'domains') => {
    setMode(selectedMode);
    setCurrentStep(selectedMode === 'resume' ? 'resume' : 'domains');
  };

  const handleResumeUpload = async (file: File) => {
    setIsProcessing(true);
    setResumeFile(file);

    // Parse resume
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/parse-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: base64String,
            mimeType: file.type || 'application/pdf',
          }),
        });
        const data = await res.json();
        setResumeText(data.text || '');
        setCurrentStep('time');
      } catch (error) {
        console.error('Error parsing resume:', error);
        setResumeText('');
        setCurrentStep('time');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDomainsSubmit = (domains: string[]) => {
    setSelectedDomains(domains);
    setCurrentStep('time');
  };

  const handleTimeSelection = (duration: number, questionCount: number) => {
    setSelectedDuration(duration);
    setSelectedQuestionCount(questionCount);
    
    let topics = selectedDomains.length > 0 ? selectedDomains : ['Resume Analysis'];
    let title = mode === 'resume' 
      ? `${candidateName} - Resume Interview`
      : `${candidateName} - ${topics.join(', ')} Interview`;
    
    initializeSession(
      title,
      topics,
      candidateName,
      mode === 'resume' ? resumeText || '' : '',
      'Mid-Level',
      duration
    );
    setCurrentStep('interview');
  };

  const goBack = () => {
    if (currentStep === 'interview') {
      setCurrentStep('time');
    } else if (currentStep === 'time') {
      setCurrentStep(mode === 'resume' ? 'resume' : 'domains');
    } else if (currentStep === 'resume' || currentStep === 'domains') {
      setCurrentStep('mode');
    } else if (currentStep === 'mode') {
      setCurrentStep('name');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'name':
        return <CandidateNameStep onSubmit={handleNameSubmit} />;
      case 'mode':
        return <SelectionModeStep onSelect={handleModeSelect} />;
      case 'resume':
        return (
          <ResumUploadStep
            onUpload={handleResumeUpload}
            isProcessing={isProcessing}
          />
        );
      case 'domains':
        return <DomainSelectionStep onSubmit={handleDomainsSubmit} />;
      case 'time':
        return <TimeSelectionStep onSubmit={handleTimeSelection} />;
      case 'interview':
        return <AIInterviewSession />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-[#F5F5F5] font-inter">
      <Header
        title="AI Interview - Advanced Mode"
        subtitle="Neural Simulation Protocol // Candidate Assessment"
        showBack={false}
      />

      {/* Back Button */}
      {currentStep !== 'interview' && (
        <div className="max-w-7xl mx-auto px-10 pt-8">
          <button
            onClick={goBack}
            className="text-[#1F1F1F]/60 hover:text-[#4CAF50] font-bold text-[12px] flex items-center gap-3 uppercase tracking-[0.3em] transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-10 py-12 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
