"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Mic, StopCircle, Download, Loader, ChevronRight, Video, VideoOff, MicOff, Volume2, VolumeX, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types & Constants ---
interface InterviewMessage {
  id: string;
  role: "interviewer" | "candidate" | "system";
  content: string;
  timestamp: Date;
}

const DOMAINS = ["Frontend", "Backend", "DevOps", "Data Science", "Mobile", "Full Stack"];

// Hardcoded question bank per domain (30 each as provided)
const QUESTIONS_BY_DOMAIN: Record<string, string[]> = {
  Frontend: [
    "How does the browser render pipeline work from HTML parsing to paint?",
    "What causes layout thrashing and how do you prevent it?",
    "Difference between useEffect and useLayoutEffect in React at execution level?",
    "How would you implement your own virtual DOM?",
    "What happens internally when you call setState?",
    "How does React batching work in concurrent mode?",
    "Explain event delegation and why it's important for performance.",
    "How would you optimize a page with 10,000 DOM nodes?",
    "Difference between debounce vs throttle with real use-case?",
    "How does CSS specificity actually resolve conflicts?",
    "Explain stacking context and z-index bugs.",
    "How would you build an infinite scroll without performance degradation?",
    "What is hydration in SSR frameworks?",
    "Difference between CSR, SSR, SSG — when to use each?",
    "How does Webpack tree-shaking work internally?",
    "What is code splitting and how does it improve performance?",
    "How would you detect memory leaks in frontend apps?",
    "What happens when you type a URL and hit enter?",
    "How does the JS event loop work with microtasks vs macrotasks?",
    "Why is key important in React lists?",
    "How would you design a design system at scale?",
    "What is shadow DOM and when should you use it?",
    "How does CSS Grid differ fundamentally from Flexbox?",
    "What is reflow vs repaint?",
    "How do browsers handle async scripts vs defer?",
    "What is accessibility (a11y) and how do you enforce it programmatically?",
    "How would you build your own state management library?",
    "What is WebAssembly and when is it useful in frontend?",
    "How do you secure frontend apps from XSS attacks?",
    "How would you optimize LCP, FID, CLS in Core Web Vitals?",
  ],
  Backend: [
    "Explain how a request travels from client to server in detail.",
    "What happens inside Node.js when handling concurrent requests?",
    "Difference between threading vs event loop architecture?",
    "How would you design a rate limiter?",
    "What is idempotency in APIs and why is it critical?",
    "How does database indexing work internally?",
    "When should you use NoSQL over SQL?",
    "What is CAP theorem with real-world tradeoffs?",
    "How would you design a URL shortener like Bitly?",
    "What is connection pooling?",
    "How do you prevent race conditions?",
    "Explain ACID properties deeply.",
    "What is eventual consistency?",
    "How would you handle millions of concurrent users?",
    "Difference between REST and GraphQL?",
    "What happens during a database deadlock?",
    "How do you design a scalable authentication system?",
    "What is JWT — and what are its flaws?",
    "How does caching work (Redis, CDN)?",
    "What is horizontal vs vertical scaling?",
    "How would you design a file upload system (like Google Drive)?",
    "What is message queue and when to use it?",
    "Explain Kafka vs RabbitMQ.",
    "What is sharding and partitioning?",
    "How do you handle distributed transactions?",
    "What is API versioning strategy?",
    "How would you secure APIs?",
    "Explain N+1 query problem.",
    "What is load balancing and its algorithms?",
    "How do you debug production issues?",
  ],
  DevOps: [
    "What happens when you run docker run internally?",
    "Difference between container vs VM?",
    "How does Kubernetes scheduling work?",
    "What is a pod in Kubernetes?",
    "How does CI/CD pipeline work end-to-end?",
    "What is blue-green deployment?",
    "Canary deployment vs rolling deployment?",
    "How do you handle zero downtime deployment?",
    "What is infrastructure as code?",
    "Terraform vs Ansible difference?",
    "What is observability vs monitoring?",
    "How would you debug a failing container?",
    "What is autoscaling in Kubernetes?",
    "Explain service mesh (Istio).",
    "What is reverse proxy?",
    "Nginx vs Apache differences?",
    "What is load balancer vs API gateway?",
    "How do you manage secrets securely?",
    "What is distributed tracing?",
    "Explain logging strategies at scale.",
    "What is chaos engineering?",
    "How would you design fault-tolerant system?",
    "What is SRE principle?",
    "What is SLA vs SLO vs SLI?",
    "How does DNS resolution work?",
    "What is CDN and how it works?",
    "How do you secure cloud infrastructure?",
    "What is container orchestration?",
    "How do you handle rollback in deployments?",
    "What is immutable infrastructure?",
  ],
  "Data Science": [
    "Difference between supervised vs unsupervised learning?",
    "What is bias-variance tradeoff?",
    "Explain overfitting vs underfitting.",
    "What is gradient descent and its variants?",
    "How does logistic regression work mathematically?",
    "What is p-value?",
    "What is hypothesis testing?",
    "Explain confusion matrix.",
    "Precision vs Recall vs F1 score?",
    "What is ROC curve?",
    "How does decision tree split data?",
    "What is entropy in ML?",
    "Random forest vs XGBoost?",
    "What is feature engineering?",
    "What is dimensionality reduction?",
    "PCA vs t-SNE?",
    "What is cross-validation?",
    "What is regularization (L1 vs L2)?",
    "What is clustering (K-means)?",
    "What is NLP pipeline?",
    "What is word embedding?",
    "What is neural network?",
    "What is backpropagation?",
    "CNN vs RNN difference?",
    "What is time series forecasting?",
    "How do you handle missing data?",
    "What is data leakage?",
    "What is A/B testing?",
    "How do you deploy ML models?",
    "What is model drift?",
  ],
  Mobile: [
    "Difference between native vs hybrid apps?",
    "How does Android activity lifecycle work?",
    "What is memory leak in mobile apps?",
    "How does RecyclerView optimize performance?",
    "What is Jetpack Compose vs XML UI?",
    "How does iOS view lifecycle work?",
    "What is background processing?",
    "How do you optimize battery usage?",
    "What is app sandboxing?",
    "How do push notifications work?",
    "What is deep linking?",
    "How does offline-first architecture work?",
    "What is state management in mobile apps?",
    "How do you secure mobile apps?",
    "What is APK vs AAB?",
    "What is threading in Android?",
    "What is Core Data in iOS?",
    "How do you handle large images efficiently?",
    "What is dependency injection in mobile?",
    "How do you debug crashes in production?",
    "What is app store optimization?",
    "How does biometric authentication work?",
    "What is cross-platform framework (Flutter, React Native)?",
    "How does navigation work in apps?",
    "What is MVVM architecture?",
    "What is caching in mobile apps?",
    "How do you handle API failures?",
    "What is performance profiling?",
    "How do you reduce app size?",
    "What is OTA update?",
  ],
  "Full Stack": [
    "How would you design a full system from frontend to DB?",
    "How do frontend and backend communicate efficiently?",
    "What is REST contract design?",
    "How do you handle authentication end-to-end?",
    "How do you manage global state across frontend + backend?",
    "What is BFF (Backend for Frontend)?",
    "How would you design scalable SaaS app?",
    "How do you handle file uploads full stack?",
    "How do you ensure data consistency?",
    "What is caching strategy across layers?",
    "How do you debug full-stack performance issues?",
    "How would you design chat application?",
    "How do you handle real-time updates (WebSockets)?",
    "How do you deploy full stack app?",
    "How do you design microservices architecture?",
    "Monolith vs microservices tradeoffs?",
    "How do you version APIs with frontend?",
    "How do you handle SEO in full stack apps?",
    "What is SSR in full stack?",
    "How do you secure full stack apps?",
    "How do you manage environment variables?",
    "What is CI/CD for full stack?",
    "How do you handle scaling bottlenecks?",
    "What is database schema design strategy?",
    "How do you optimize end-to-end latency?",
    "How do you monitor full system health?",
    "What is event-driven architecture?",
    "How do you design multi-tenant system?",
    "How do you ensure high availability?",
    "How would you build your own SaaS product from scratch?",
  ],
};

// --- Helper: Audio Visualizer Component ---
const AudioVisualizer = ({ isActive }: { isActive: boolean }) => (
  <div className="flex items-center gap-1 h-8">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        animate={isActive ? { height: [4, 24, 4] } : { height: 4 }}
        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
        className="w-1 bg-green-500 rounded-full"
      />
    ))}
  </div>
);

export default function AdvancedInterview() {
  // ... (Keep existing basic state)
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [sessionTime, setSessionTime] = useState(0);
  const [answersRecorded, setAnswersRecorded] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Auto-scroll Chat ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcript]);

  // --- Speech Recognition Logic ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: any) => {
        let current = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };
      rec.onerror = (event: any) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.error("Speech recognition error:", event.error);
        }
      };
      recognitionRef.current = rec;
    }
  }, []);

  // Simple TTS helper
  const speakAsync = (text: string) => {
    return new Promise<void>((resolve) => {
      try {
        if (!ttsEnabled || !(window as any).speechSynthesis) return resolve();
        const utter = new SpeechSynthesisUtterance(text);
        const v = (window as any).speechSynthesis.getVoices();
        if (v && v.length) utter.voice = v[0];
        utter.onend = () => resolve();
        utter.onerror = () => resolve();
        (window as any).speechSynthesis.cancel();
        (window as any).speechSynthesis.speak(utter);
      } catch (e) {
        return resolve();
      }
    });
  };

  const shuffleArray = (array: string[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Ask the next hardcoded question for the selected domain
  const askNextHardcodedQuestion = async () => {
    if (!selectedDomain) return;
    const bank = shuffledQuestions.length > 0 ? shuffledQuestions : (QUESTIONS_BY_DOMAIN[selectedDomain] || QUESTIONS_BY_DOMAIN['Frontend']);
    const idx = questionIndex >= 0 ? questionIndex : 0;
    const q = bank[idx] || bank[0];
    setCurrentQuestion(q);
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'interviewer', content: q, timestamp: new Date() }]);
    setIsAsking(true);
    try {
      await speakAsync('Question ' + (idx + 1) + '. ' + q);
    } catch (e) {}
    setIsAsking(false);
    setQuestionIndex((n) => Math.min((n ?? 0) + 1, bank.length - 1));
  };

  // Auto-ask first question when session starts
  useEffect(() => {
    if (sessionStarted && selectedDomain) {
      const bank = QUESTIONS_BY_DOMAIN[selectedDomain] || QUESTIONS_BY_DOMAIN['Frontend'];
      setShuffledQuestions(shuffleArray(bank));
      setQuestionIndex(0);
      setTimeout(() => {
        // We need to use the newly shuffled bank here because state might not have updated yet
        const initialBank = shuffleArray(bank);
        setShuffledQuestions(initialBank);
        const q = initialBank[0];
        setCurrentQuestion(q);
        setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'interviewer', content: q, timestamp: new Date() }]);
        setIsAsking(true);
        speakAsync('Question 1. ' + q).finally(() => setIsAsking(false));
        setQuestionIndex(1);
      }, 300);
    }
  }, [sessionStarted]);

  // When the session starts, request camera/mic and attach to video preview
  useEffect(() => {
    if (!sessionStarted) return;
    let mounted = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true });
        if (!mounted) return;
        mediaStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.error("getUserMedia failed", e);
        try {
          alert('Camera/microphone access required to run interview.');
        } catch (err) {}
      }
    })();
    return () => {
      mounted = false;
      try {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      } catch (e) {}
    };
  }, [sessionStarted]);

  const handleToggleRecording = () => {
    if (!isRecording) {
      setTranscript("");
      setIsRecording(true);
      // start speech recognition
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Rec start error", e);
      }
      // prepare MediaRecorder from the acquired media stream
      try {
        if (mediaStreamRef.current) {
          setRecordedChunks([]);
          const mr = new MediaRecorder(mediaStreamRef.current as MediaStream);
          mediaRecorderRef.current = mr;
          mr.ondataavailable = (ev: any) => {
            try {
              if (ev?.data && ev.data.size > 0) setRecordedChunks((p) => [...p, ev.data]);
            } catch (e) {}
          };
          mr.start();
        }
      } catch (e) {
        console.error('MediaRecorder start failed', e);
      }
    } else {
      setIsRecording(false);
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {}

      if (transcript.trim()) {
        const newMessage: InterviewMessage = {
          id: Date.now().toString(),
          role: "candidate",
          content: transcript,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newMessage]);
        setAnswersRecorded((prev) => prev + 1);
        analyzeLastAnswer([...messages, newMessage]);
      }
    }
  };

  const analyzeLastAnswer = async (updatedMessages: InterviewMessage[]) => {
    setIsThinking(true);
    // Simulate AI processing - In production, this hits your /api/analyze
    setTimeout(() => {
      setIsThinking(false);
      // Logic for next question or follow-up would go here
    }, 2000);
  };

  // Component unmount cleanup: stop recognition, media recorder, and media tracks
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
      } catch (e) {}
      try {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      } catch (e) {}
    };
  }, []);

  // --- Render Helpers ---
  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-[#efefef] text-white flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-400">
              AI Interview Pro
            </h1>
            <p className="mt-4 text-gray-600 text-lg">Select your path to begin the simulation.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {DOMAINS.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`p-4 rounded-xl border-2 transition-all font-semibold ${
                  selectedDomain === domain 
                  ? "border-green-500 bg-green-500/10 text-green-400" 
                  : "border-gray-200 bg-white hover:border-gray-300 text-gray-900"
                }`}
              >
                {domain}
              </button>
            ))}
          </div>

          <button
            disabled={!selectedDomain || loading}
            onClick={() => setSessionStarted(true)}
            className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xl transition-all shadow-lg shadow-green-900/20"
          >
            {loading ? "Initializing..." : "Launch Interview"}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-green-50 rounded-full text-xs font-mono text-green-600 border border-green-100">
            LIVE SESSION: {selectedDomain}
          </div>
          <motion.div
            aria-hidden
            initial={{ opacity: 1 }}
            animate={isAsking ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={isAsking ? { duration: 1, repeat: Infinity } : {}}
            className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-white text-sm"
            title={isAsking ? 'Interviewer speaking' : 'Interviewer idle'}
          >
            AI
          </motion.div>
          <span className="text-slate-500">|</span>
          <span className="text-sm font-medium">{answersRecorded} / 5 Questions</span>
        </div>
        <button onClick={() => setShowReport(true)} className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors">
          End Session
        </button>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Left: Video & Controls (7 Cols) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <div className="relative aspect-video bg-white rounded-3xl overflow-hidden border border-gray-200 shadow">
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <VideoOff size={64} className="text-gray-400" />
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: isVideoOn ? 'scaleX(-1)' : undefined }}
            />
            
            {/* Visual Overlays */}
            <div className="absolute bottom-6 left-6 flex items-center gap-3">
              <AudioVisualizer isActive={isRecording} />
              {isRecording && <span className="text-xs font-bold text-green-500 animate-pulse uppercase tracking-widest">Recording</span>}
            </div>
          </div>

          {/* Action Dock */}
          <div className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex gap-2">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-xl transition-colors ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white text-gray-700 border'}`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <button 
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-4 rounded-xl transition-colors ${!isVideoOn ? 'bg-red-500/20 text-red-500' : 'bg-white text-gray-700 border'}`}
              >
                {!isVideoOn ? <VideoOff size={24} /> : <Video size={24} />}
              </button>
            </div>

            <button 
              onClick={handleToggleRecording}
              className={`px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all ${
                isRecording 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isRecording ? <><StopCircle size={24} /> Stop Answer</> : <><Mic size={24} /> Answer Question</>}
            </button>

            <button
              onClick={() => { if (!isAsking) askNextHardcodedQuestion(); }}
              disabled={isAsking}
              className={`px-4 py-3 ml-2 rounded-xl font-semibold ${isAsking ? 'bg-green-400/30 text-green-200' : 'bg-green-500 hover:bg-green-600 text-white'}`}
            >
              {isAsking ? 'Asking…' : 'Ask Question'}
            </button>

            <button onClick={() => {
              try {
                if (!recordedChunks.length) return alert('No recording available');
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `interview-${selectedDomain || 'session'}.webm`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) { console.error('Download failed', e); }
            }} className="p-4 bg-white rounded-xl text-gray-700 border">
              <Download size={24} />
            </button>
          </div>
        </div>

        {/* Right: Conversation & Transcript (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col bg-white border border-gray-200 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-400" />
              Interview Log
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setTtsEnabled(!ttsEnabled)} className="text-gray-500">
                  {ttsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
               </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'interviewer' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl ${
                  m.role === 'interviewer' 
                  ? 'bg-gray-50 border border-gray-100 text-gray-900 rounded-tl-none' 
                  : 'bg-green-600 text-white rounded-tr-none shadow-lg shadow-green-900/10'
                }`}>
                  <p className="text-sm leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}

            {isRecording && (
              <div className="flex justify-end">
                <div className="max-w-[85%] p-4 rounded-2xl bg-green-50 border border-green-100 text-green-700 italic rounded-tr-none">
                  {transcript || "Listening..."}
                </div>
              </div>
            )}

            {isThinking && (
              <div className="flex justify-start items-center gap-3">
                <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100">
                  <Loader className="animate-spin text-green-500" size={20} />
                </div>
                <span className="text-xs font-medium text-gray-500 animate-pulse">AI is analyzing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
}