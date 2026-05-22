'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Send,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Download,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useInterviewStore } from '@/store/interviewStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { InterviewReport } from '@/components/InterviewReport';
import { InterviewAnalytics, InterviewMetrics } from '@/lib/interviewAnalytics';
import { useAuthStore } from '@/store/useAuthStore';

interface InterviewMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function AIInterviewSession() {
  // Video References
  const interviewerVideoRef = useRef<HTMLVideoElement>(null);
  const candidateVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyticsRef = useRef<InterviewAnalytics | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const isRecognitionStartingRef = useRef<boolean>(false);
  const videoInitializedRef = useRef<boolean>(false); // Track if video has been initialized
  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track speech recognition timeout
  const recognitionRetryCountRef = useRef<number>(0); // Track retry attempts
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track silence for auto-submit

  const store = useInterviewStore();
  const { user } = useAuthStore();
  const {
    candidateName,
    selectedTopics,
    resumeText,
    interviewDuration,
    addHistoryMessage,
  } = store;

  // State Management
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoState, setVideoState] = useState<'playing' | 'paused' | 'loading'>('loading');
  const [currentVideoSrc, setCurrentVideoSrc] = useState('/boy-interview.mp4');
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interviewMetrics, setInterviewMetrics] = useState<InterviewMetrics | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [endingProgress, setEndingProgress] = useState(0);

  // Initialize video and audio
  useEffect(() => {
    // Only initialize once
    if (videoInitializedRef.current) return;
    videoInitializedRef.current = true;

    const initializeInterview = async () => {
      // Initialize analytics
      analyticsRef.current = new InterviewAnalytics();

      // Load interviewer video with error handling
      if (interviewerVideoRef.current && !interviewerVideoRef.current.src) {
        const video = interviewerVideoRef.current;
        
        // Set up video state listeners
        const handlePlayState = () => setVideoState('playing');
        const handlePauseState = () => setVideoState('paused');
        
        video.addEventListener('play', handlePlayState);
        video.addEventListener('pause', handlePauseState);
        video.addEventListener('error', (e) => {
          console.error('Video error:', e);
        });
        
        // Set preload to auto and load the video
        video.preload = 'auto';
        setVideoState('paused');
      }

      // Get candidate camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        mediaStreamRef.current = stream;

        if (candidateVideoRef.current) {
          candidateVideoRef.current.srcObject = stream;
          candidateVideoRef.current.play().catch(err => console.error('Error playing candidate video:', err));
        }

        // Initialize audio analytics
        if (analyticsRef.current) {
          await analyticsRef.current.initializeAudioAnalysis(stream);
        }

        // Setup media recorder for the combined interview
        setupMediaRecorder(stream);

        // Initialize speech recognition
        initializeSpeechRecognition();

        // Get initial question on mount
        getNextQuestion();
      } catch (error) {
        console.error('Error accessing camera/microphone:', error);
        alert(
          'Please grant camera and microphone permissions to continue with the interview.'
        );
      }
    };

    initializeInterview();

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error('Error aborting recognition:', e);
        }
      }
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (analyticsRef.current) {
        analyticsRef.current.cleanup();
      }
      if (mediaRecorderRef.current && isRecording) {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.error('Error stopping media recorder:', e);
        }
      }
    };
  }, []);

  // Setup media recorder
  const setupMediaRecorder = (stream: MediaStream) => {
    try {
      let options: any = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = '';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        recordedChunksRef.current = [];
      };

      mediaRecorder.onerror = (error: any) => {
        console.error('Media Recorder error:', error);
      };

      mediaRecorderRef.current = mediaRecorder;
      startRecording();
    } catch (error) {
      console.error('Error setting up media recorder:', error);
    }
  };

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        isRecognitionStartingRef.current = false;
        recognitionRetryCountRef.current = 0;
        
        // Initial timeout - if no speech at all
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
        }
        recognitionTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isRecognitionActiveRef.current && !currentTranscript) {
            console.warn('Speech recognition timeout - no speech detected after 30 seconds');
            recognitionRef.current.abort();
          }
        }, 30000);
      };

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentTranscript(transcript);
        
        // Switch to head nodding video immediately when user speaks
        if (transcript.trim().length > 0 && currentVideoSrc !== '/head_nodding.mp4') {
          setCurrentVideoSrc('/head_nodding.mp4');
          setVideoState('playing');
          // Play head nodding video
          if (interviewerVideoRef.current) {
            interviewerVideoRef.current.play().catch(err => {
              console.warn('Head nodding video play error:', err);
            });
          }
        }

        // Reset silence timer on every result
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // Only start silence timer if we have some content
        if (transcript.trim().length > 0) {
          silenceTimeoutRef.current = setTimeout(() => {
            console.log('Silence detected, submitting answer...');
            submitAnswer(transcript); // Pass transcript directly to avoid stale state issues
          }, 5000); // 5 seconds of silence to trigger submission
        }
        
        // Clear timeout when speech is detected
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        isRecognitionActiveRef.current = false;
        isRecognitionStartingRef.current = false;
        
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        // Only log errors that aren't "aborted" or "no-speech" (which are normal/expected)
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error);
        }
        
        // Handle different error types
        if (event.error === 'no-speech') {
          console.warn('No speech detected. Retrying...');
          // Retry up to 2 times on "no-speech" error
          if (recognitionRetryCountRef.current < 2) {
            recognitionRetryCountRef.current++;
            setIsListening(false);
            isRecognitionActiveRef.current = false;
            isRecognitionStartingRef.current = false;
            
            // Wait a moment before retrying
            setTimeout(() => {
              if (!isRecognitionActiveRef.current) {
                console.log(`Retrying speech recognition (attempt ${recognitionRetryCountRef.current})`);
                startListening();
              }
            }, 500);
            return;
          }
        } else if (event.error === 'network' || event.error === 'service-not-available') {
          console.error('Speech recognition service error:', event.error);
        }
        
        setIsListening(false);
        isRecognitionActiveRef.current = false;
        isRecognitionStartingRef.current = false;
        recognitionRetryCountRef.current = 0;
        
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
        }
      };
    }
  };

  // Start recording
  const startRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      try {
        recordedChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  const getNextQuestion = async () => {
    const MAX_QUESTIONS = 10;
    if (questionCount >= MAX_QUESTIONS) {
      endInterview();
      return;
    }

    setIsLoading(true);
    setCurrentTranscript('');

    try {
      const response = await fetch('/api/ai-interview-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domains: selectedTopics,
          resumeText: resumeText,
          conversationHistory: messages,
          questionNumber: questionCount + 1,
          candidateName,
        }),
      });

      const data = await response.json();
      const question = data.question;

      // Add AI message
      const aiMessage: InterviewMessage = {
        id: generateUniqueId(),
        role: 'ai',
        content: question,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      addHistoryMessage('model', question);
      setQuestionCount((prev) => prev + 1);

      // Play video and speak
      playVideoAndSpeak(question);
    } catch (error) {
      console.error('Error getting question:', error);
      setIsLoading(false);
    }
  };

  const playVideoAndSpeak = async (text: string) => {
    // Set video source directly without loading state
    setCurrentVideoSrc('/boy-interview.mp4');
    
    // Play interviewer video immediately
    if (interviewerVideoRef.current) {
      try {
        const video = interviewerVideoRef.current;
        // Set state to playing immediately
        setVideoState('playing');
        
        // Then start playing
        video.play().catch(err => {
          console.warn('Video play error:', err);
          setVideoState('paused');
        });
      } catch (error) {
        console.error('Error in playVideoAndSpeak:', error);
        setVideoState('paused');
      }
    }

    // Use Web Speech API to speak
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (interviewerVideoRef.current) {
        try {
          interviewerVideoRef.current.pause();
          setVideoState('paused');
        } catch (e) {
          console.error('Error pausing video:', e);
        }
      }
      // Ready to listen - after speaker is done
      // Use longer delay and check state before starting
      setTimeout(() => {
        if (!isRecognitionActiveRef.current && recognitionRef.current) {
          try {
            startListening();
          } catch (error) {
            console.error('Error in auto-startListening:', error);
          }
        }
      }, 1200);
    };

    try {
      speechSynthesis.cancel(); // Cancel any ongoing speech
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error with speech synthesis:', error);
    }

    setIsLoading(false);
  };

  const startListening = () => {
    // Check if already active or currently starting
    if (isRecognitionActiveRef.current || isRecognitionStartingRef.current) {
      console.warn('Speech recognition already active or starting');
      return;
    }
    
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      return;
    }
    
    // Verify we have an active microphone track before starting
    const hasMic = !!(
      mediaStreamRef.current &&
      mediaStreamRef.current.getAudioTracks &&
      mediaStreamRef.current.getAudioTracks().length > 0 &&
      mediaStreamRef.current.getAudioTracks().some((t) => t.enabled)
    );

    if (!hasMic) {
      console.warn('Microphone not available or disabled. Attempting to request microphone.');
      // Try to request microphone permissions again
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;
          if (candidateVideoRef.current) {
            candidateVideoRef.current.srcObject = stream;
            candidateVideoRef.current.play().catch(() => {});
          }
          // small delay then attempt to start recognition again
          setTimeout(() => startListening(), 250);
        })
        .catch((err) => {
          console.error('Microphone access denied when retrying for speech recognition:', err);
          alert('Microphone access is required to record your answers. Please enable microphone and try again.');
        });
      return;
    }

    try {
      // Set flags IMMEDIATELY to prevent duplicate calls
      isRecognitionStartingRef.current = true;
      isRecognitionActiveRef.current = true;
      setCurrentTranscript('');

      // Make sure recognition is not in an error state
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore abort errors
      }

      // Small delay to ensure microphone is ready and recognition is reset
      setTimeout(() => {
        if (!recognitionRef.current) return;
        try {
          recognitionRef.current.start();
          console.log('Speech recognition started');
        } catch (error: any) {
          // Handle InvalidStateError gracefully
          if (error.name === 'InvalidStateError') {
            console.warn('InvalidStateError - recognition already running, aborting and retrying');
            try {
              recognitionRef.current?.abort();
            } catch (e) {}
            // Reset flags and try again after a brief delay
            setTimeout(() => {
              isRecognitionActiveRef.current = false;
              isRecognitionStartingRef.current = false;
              if (isRecognitionActiveRef.current === false) {
                startListening();
              }
            }, 500);
          } else {
            console.error('Error starting recognition:', error);
            isRecognitionActiveRef.current = false;
            isRecognitionStartingRef.current = false;
          }
        }
      }, 120);
    } catch (error) {
      console.error('Error in startListening:', error);
      isRecognitionActiveRef.current = false;
      isRecognitionStartingRef.current = false;
    }
  };

  const stopListening = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (recognitionRef.current && isRecognitionActiveRef.current) {
      try {
        recognitionRef.current.stop();
        isRecognitionActiveRef.current = false;
        isRecognitionStartingRef.current = false;
        recognitionRetryCountRef.current = 0;
        
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
        }
      } catch (error) {
        console.error('Error stopping recognition:', error);
        isRecognitionActiveRef.current = false;
        isRecognitionStartingRef.current = false;
      }
    }
  };

  const submitAnswer = async (transcriptOverride?: any) => {
    // If transcriptOverride is a React synthetic event (from onClick), ignore it
    const manualTranscript = typeof transcriptOverride === 'string' ? transcriptOverride : undefined;
    const textToSubmit = manualTranscript || currentTranscript || '';
    
    if (!textToSubmit || typeof textToSubmit !== 'string' || !textToSubmit.trim()) return;

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    stopListening();
    setUserAnswer(textToSubmit);

    // Analyze the response for metrics
    if (analyticsRef.current) {
      const questionText = messages[messages.length - 1]?.content || '';
      const responseMetrics = analyticsRef.current.analyzeResponse(
        textToSubmit,
        questionText,
        questionCount
      );
      console.log('Response Metrics:', responseMetrics);
    }

    // Add user message
    const userMessage: InterviewMessage = {
      id: generateUniqueId(),
      role: 'user',
      content: textToSubmit,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    addHistoryMessage('user', textToSubmit);
    setCurrentTranscript('');

    // Switch back to interviewer video if we were nodding
    setCurrentVideoSrc('/boy-interview.mp4');
    setVideoState('loading'); // Set to loading while source changes

    // Wait before getting next question
    await new Promise((resolve) => setTimeout(resolve, 2000));

    getNextQuestion();
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const endInterview = async () => {
    // Prevent multiple calls
    if (isEnding) return;
    
    setIsEnding(true);
    setEndingProgress(0);
    
    // Stop all ongoing speech and listening
    try {
      speechSynthesis.cancel();
    } catch (e) {
      console.error('Error canceling speech:', e);
    }
    
    stopListening();
    stopRecording();

    // Start progress animation
    const progressInterval = setInterval(() => {
      setEndingProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 5;
      });
    }, 200);

    try {
      // Step 1: Generate aggregate metrics from local analytics
      if (analyticsRef.current) {
        const localMetrics = analyticsRef.current.generateAggregateMetrics();
        setInterviewMetrics(localMetrics);
      }
      setEndingProgress(30);

      // Step 2: Call the analyze API for AI feedback
      console.log('[Interview] Calling analyze endpoint...');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: messages,
          topics: selectedTopics,
          timelineData: [], 
        }),
      });

      setEndingProgress(70);

      if (response.ok) {
        const aiAnalysis = await response.json();
        console.log('[Interview] AI Analysis received:', aiAnalysis);
        
        // Store the AI analysis data in the Zustand store
        const finalizedData = {
          technicalScore: aiAnalysis.technicalScore ?? 75,
          communicationScore: aiAnalysis.communicationScore ?? 75,
          nervousnessScore: aiAnalysis.nervousnessScore ?? 25,
          overallScore: aiAnalysis.overallScore ?? 75,
          structureScore: aiAnalysis.structureScore ?? 70,
          depthScore: aiAnalysis.depthScore ?? 70,
          thinkingSpeed: aiAnalysis.thinkingSpeed ?? 75,
          decisionConfidence: aiAnalysis.decisionConfidence ?? 75,
          strengthsFeedback: aiAnalysis.strengthsFeedback ?? 'Strong performance',
          improvementsFeedback: aiAnalysis.improvementsFeedback ?? 'Consider expanding on examples'
        };

        store.finalizeInterview(finalizedData);
        
        // --- SAVE TO MONGODB ---
        if (user?.id) {
          try {
            await fetch('/api/analytics/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                sessionTitle: store.sessionTitle,
                candidateName: store.candidateName,
                durationSecs: Math.round((Date.now() - (store.startDate?.getTime() || Date.now())) / 1000),
                technicalScore: finalizedData.technicalScore,
                communicationScore: finalizedData.communicationScore,
                overallScore: finalizedData.overallScore,
                feedback: {
                  strengths: finalizedData.strengthsFeedback.split('\n').filter(s => s.trim()),
                  improvements: finalizedData.improvementsFeedback.split('\n').filter(s => s.trim()),
                },
                transcript: messages.map(m => ({
                  role: m.role === 'ai' ? 'assistant' : 'user',
                  content: m.content,
                  timestamp: m.timestamp.getTime()
                }))
              }),
            });
            console.log('[Interview] Session saved to MongoDB');
          } catch (saveError) {
            console.error('[Interview] Failed to save session to MongoDB:', saveError);
          }
        }
        // -----------------------

        // Enhance local metrics with AI scores
        setInterviewMetrics(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            _aiAnalysis: aiAnalysis,
          } as any;
        });
      }
      
      setEndingProgress(100);
      clearInterval(progressInterval);
      
      // Short delay to show 100% completion
      setTimeout(() => {
        setInterviewEnded(true);
        setIsEnding(false);
      }, 1000);

    } catch (error) {
      console.error('[Interview] Error during finalization:', error);
      setEndingProgress(100);
      clearInterval(progressInterval);
      setTimeout(() => {
        setInterviewEnded(true);
        setIsEnding(false);
      }, 500);
    }
  };

  if (interviewEnded && interviewMetrics) {
    return (
      <InterviewReport
        candidateName={candidateName}
        interviewDate={new Date()}
        domains={selectedTopics}
        metrics={interviewMetrics}
        recordingUrl={recordingUrl || undefined}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const getEndingStatusText = () => {
    if (endingProgress < 30) return "Gathering session data...";
    if (endingProgress < 60) return "Analyzing your responses...";
    if (endingProgress < 90) return "Generating AI insights...";
    return "Finalizing your report...";
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F5F5] p-6 relative">
      {/* Ending Animation Overlay */}
      <AnimatePresence>
        {isEnding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-md w-full space-y-8"
            >
              <div className="relative w-24 h-24 mx-auto mb-8">
                {endingProgress < 100 ? (
                  <Loader2 className="w-24 h-24 text-[#4CAF50] animate-spin" />
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-[#4CAF50] rounded-full p-4"
                  >
                    <CheckCircle2 className="w-16 h-16 text-white" />
                  </motion.div>
                )}
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-[#1F1F1F]">
                  {endingProgress < 100 ? "Processing Session" : "Interview Complete!"}
                </h2>
                <p className="text-[#1F1F1F]/60 font-medium">
                  {getEndingStatusText()}
                </p>
              </div>

              <div className="space-y-4">
                <div className="h-3 w-full bg-[#E0E0E0] rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${endingProgress}%` }}
                    className="h-full bg-gradient-to-r from-[#4CAF50] to-[#81C784] shadow-lg"
                  />
                </div>
                <div className="flex justify-between text-sm font-bold text-[#1F1F1F]/40 uppercase tracking-widest">
                  <span>Progress</span>
                  <span>{Math.round(endingProgress)}%</span>
                </div>
              </div>

              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-xs text-[#1F1F1F]/30 uppercase tracking-[0.3em] font-bold"
              >
                Mockmate Neural Core v2.0
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-[#1F1F1F]">AI Interview Session</h1>
          <p className="text-[#1F1F1F]/60">
            Candidate: <span className="font-semibold text-[#4CAF50]">{candidateName}</span> | Question{' '}
            <span className="font-semibold">{questionCount}</span> of 10
          </p>
        </div>

        {/* Main Layout: Video on Left, Questions/Controls on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left: Interviewer Video (Full Height) */}
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video shadow-lg border border-[#E0E0E0]">
              <video
                ref={interviewerVideoRef}
                key={currentVideoSrc}
                src={currentVideoSrc}
                className="w-full h-full object-cover"
                autoPlay={videoState === 'playing'}
                muted
                loop
                playsInline
                onError={(e) => {
                  const videoElement = e.currentTarget;
                  console.error('Video element error:', {
                    src: videoElement.src,
                    error: videoElement.error,
                    readyState: videoElement.readyState
                  });
                }}
              />

              {/* Fallback if video fails to load */}
              {videoState === 'paused' && !interviewerVideoRef.current?.currentTime && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎥</div>
                    <p className="text-gray-300 text-sm">Interview Video</p>
                    <p className="text-gray-500 text-xs mt-2">Connecting...</p>
                  </div>
                </div>
              )}

              {/* Video Status Overlay */}
              <AnimatePresence mode="wait">
                {isSpeaking && (
                  <motion.div
                    key="ai-speaking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-4 right-4 flex items-center gap-2 bg-[#4CAF50] text-white px-4 py-2 rounded-full z-10 shadow-lg"
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={`wave-${i}`}
                          animate={{ height: [4, 12, 4] }}
                          transition={{
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                          className="w-1 bg-white rounded"
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold">AI Speaking</span>
                  </motion.div>
                )}

                {isListening && (
                  <motion.div
                    key="user-listening"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-4 right-4 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full z-10 shadow-lg"
                  >
                    <Mic className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-semibold">You speaking...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Candidate Video Preview in Bottom Right Corner */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video shadow-lg border-2 border-[#E0E0E0]">
                <video
                  ref={candidateVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                  onError={(e) => console.error('Candidate video error:', e)}
                />
                <div className="absolute top-2 left-2 bg-[#4CAF50] text-white px-2 py-1 rounded text-xs font-semibold z-10">
                  Your Camera
                </div>
              </div>

              {/* Current Transcript Display */}
              {currentTranscript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white rounded-lg border border-[#E0E0E0] shadow-sm"
                >
                  <p className="text-[#1F1F1F] text-sm mb-2 font-semibold">Your Answer:</p>
                  <p className="text-[#1F1F1F]/70 text-sm leading-relaxed">
                    {currentTranscript}
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right: Questions Panel and Controls */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 border border-[#E0E0E0] shadow-lg h-full flex flex-col">
              {/* Current Question */}
              <div className="mb-6 flex-1 overflow-y-auto">
                <h3 className="text-[#1F1F1F] font-bold text-lg mb-4">Current Question</h3>
                {messages.length > 0 && messages[messages.length - 1]?.role === 'ai' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#F5F5F5] rounded-lg p-4 border border-[#E0E0E0]"
                  >
                    <p className="text-[#1F1F1F] leading-relaxed">
                      {messages[messages.length - 1].content}
                    </p>
                  </motion.div>
                ) : (
                  <div className="bg-[#F5F5F5] rounded-lg p-4 text-[#1F1F1F]/60 text-center">
                    <div className="w-8 h-8 border-4 border-[#4CAF50]/30 border-t-[#4CAF50] rounded-full animate-spin mx-auto" />
                  </div>
                )}
              </div>

              {/* Chat History */}
              <div className="mb-6 bg-[#F5F5F5] rounded-lg p-4 max-h-48 overflow-y-auto border border-[#E0E0E0]">
                <h3 className="text-[#1F1F1F] font-bold text-sm mb-3">History</h3>
                <div className="space-y-2">
                  {messages
                    .slice(-6)
                    .reverse()
                    .map((msg) => (
                      <div key={msg.id} className="text-xs">
                        <span
                          className={
                            msg.role === 'ai'
                              ? 'text-[#4CAF50] font-semibold'
                              : 'text-[#1F1F1F] font-semibold'
                          }
                        >
                          {msg.role === 'ai' ? 'AI: ' : 'You: '}
                        </span>
                        <span className="text-[#1F1F1F]/60 line-clamp-2">
                          {msg.content.substring(0, 50)}...
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Video Controls */}
              <div className="space-y-3 border-t border-[#E0E0E0] pt-4">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={toggleVideo}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all ${
                      isVideoOn
                        ? 'bg-[#4CAF50] text-white hover:bg-[#45a049]'
                        : 'bg-[#E0E0E0] text-[#1F1F1F] hover:bg-[#D0D0D0]'
                    }`}
                    title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {isVideoOn ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <VideoOff className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={toggleAudio}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all ${
                      !isMuted
                        ? 'bg-[#4CAF50] text-white hover:bg-[#45a049]'
                        : 'bg-[#E0E0E0] text-[#1F1F1F] hover:bg-[#D0D0D0]'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {!isMuted ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={endInterview}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all"
                    title="End interview"
                  >
                    <PhoneOff className="w-4 h-4" />
                  </button>
                </div>

                {/* Recording Indicator */}
                {isRecording && (
                  <motion.div
                    animate={{ opacity: [1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="bg-red-50 border border-red-300 rounded-lg px-3 py-2 text-center"
                  >
                    <p className="text-red-600 text-xs font-semibold flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                      Recording
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 border-t border-[#E0E0E0] pt-4 mt-4">
                {!isListening && !isSpeaking && (
                  <button
                    onClick={startListening}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#4CAF50] text-white rounded-lg font-semibold hover:bg-[#45a049] transition-all disabled:opacity-50"
                  >
                    <Mic className="w-4 h-4" />
                    Start Speaking
                  </button>
                )}

                {isListening && (
                  <>
                    <button
                      onClick={stopListening}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
                    >
                      <MicOff className="w-4 h-4" />
                      Stop
                    </button>
                    <button
                      onClick={submitAnswer}
                      disabled={!currentTranscript.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#4CAF50] text-white rounded-lg font-semibold hover:bg-[#45a049] transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      Submit
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
