import { create } from 'zustand';

export interface TelemetryPoint {
  time: string; // e.g., '1m', '2m'
  confidence: number;
  eyeContact: number;
}

interface InterviewState {
  // Config
  sessionTitle: string;
  selectedTopics: string[];
  resumeText: string | null;
  videoRecordingUrl: string | null;
  startDate: Date | null;
  experienceLevel: string;
  interviewDuration: number; // in minutes
  candidateName: string;
  
  // Active Telemetry (Real-time tracking)
  timelineData: TelemetryPoint[];
  currentEyeContact: number;
  currentConfidence: number;
  currentQuestionCount: number;
  
  // Derived Analytics Data
  technicalScore: number;
  communicationScore: number;
  nervousnessScore: number;
  overallScore: number;
  structureScore: number;
  depthScore: number;
  thinkingSpeed: number;
  decisionConfidence: number;
  strengthsFeedback: string;
  improvementsFeedback: string;

  // History
  conversationHistory: { role: 'user' | 'model'; content: string }[];

  // Actions
  initializeSession: (title: string, topics: string[], candidateName: string, resumeText?: string, experienceLevel?: string, duration?: number) => void;
  setVideoRecordingUrl: (url: string) => void;
  addTelemetry: (point: TelemetryPoint) => void;
  updateCurrentMetrics: (eye: number, conf: number) => void;
  addHistoryMessage: (role: 'user' | 'model', content: string) => void;
  incrementQuestionCount: () => void;
  finalizeInterview: (data: { technicalScore: number; communicationScore: number; nervousnessScore: number; overallScore: number; structureScore: number; depthScore: number; thinkingSpeed: number; decisionConfidence: number; strengthsFeedback: string; improvementsFeedback: string }) => void;
  clearSession: () => void;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  sessionTitle: 'General Interview',
  selectedTopics: [],
  resumeText: null,
  videoRecordingUrl: null,
  startDate: null,
  experienceLevel: 'Mid-Level',
  interviewDuration: 10,
  candidateName: 'Candidate',
  
  timelineData: [],
  currentEyeContact: 100,
  currentConfidence: 100,
  currentQuestionCount: 0,
  
  technicalScore: 0,
  communicationScore: 0,
  nervousnessScore: 0,
  overallScore: 0,
  structureScore: 0,
  depthScore: 0,
  thinkingSpeed: 0,
  decisionConfidence: 0,
  strengthsFeedback: '',
  improvementsFeedback: '',
  conversationHistory: [],

  initializeSession: (title, topics, candidateName, resumeText, experienceLevel = 'Mid-Level', duration = 10) => set({
    sessionTitle: title,
    selectedTopics: topics,
    candidateName: candidateName,
    resumeText: resumeText,
    experienceLevel: experienceLevel,
    interviewDuration: duration,
    startDate: new Date(),
    timelineData: [],
    currentEyeContact: 100,
    currentConfidence: 100,
    currentQuestionCount: 0,
    strengthsFeedback: '',
    improvementsFeedback: '',
    conversationHistory: [],
    videoRecordingUrl: null
  }),

  setVideoRecordingUrl: (url) => set({ videoRecordingUrl: url }),

  addTelemetry: (point) => set((state) => ({
    timelineData: [...state.timelineData, point]
  })),

  updateCurrentMetrics: (eye, conf) => set({
    currentEyeContact: eye,
    currentConfidence: conf
  }),

  addHistoryMessage: (role, content) => set((state) => ({
    conversationHistory: [...state.conversationHistory, { role, content }]
  })),
  
  incrementQuestionCount: () => set((state) => ({
    currentQuestionCount: state.currentQuestionCount + 1
  })),

  finalizeInterview: (data) => set({
    technicalScore: data.technicalScore,
    communicationScore: data.communicationScore,
    nervousnessScore: data.nervousnessScore,
    overallScore: data.overallScore,
    structureScore: data.structureScore,
    depthScore: data.depthScore,
    thinkingSpeed: data.thinkingSpeed,
    decisionConfidence: data.decisionConfidence,
    strengthsFeedback: data.strengthsFeedback,
    improvementsFeedback: data.improvementsFeedback
  }),

  clearSession: () => set({
    sessionTitle: 'General Interview',
    selectedTopics: [],
    resumeText: null,
    startDate: null,
    timelineData: [],
    currentQuestionCount: 0,
    technicalScore: 0,
    communicationScore: 0,
    nervousnessScore: 0,
    overallScore: 0,
    structureScore: 0,
    depthScore: 0,
    thinkingSpeed: 0,
    decisionConfidence: 0,
    strengthsFeedback: '',
    improvementsFeedback: '',
    conversationHistory: [],
    videoRecordingUrl: null,
    candidateName: 'Candidate'
  })
}));
