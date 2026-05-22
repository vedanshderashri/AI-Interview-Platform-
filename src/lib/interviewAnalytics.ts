// Real-time interview analytics and metrics collection

export interface InterviewMetrics {
  // Timing metrics
  totalSpeakingTime: number; // in milliseconds
  totalSilenceTime: number;
  averageSpeakingDuration: number;
  pauseCount: number;
  averagePauseDuration: number;

  // Linguistic metrics
  wordCount: number;
  sentenceCount: number;
  averageWordsPerSentence: number;
  uniqueWords: number;
  filler_words: number; // um, uh, like, you know
  fillerWordPercentage: number;

  // Confidence metrics
  speakingPace: number; // words per minute
  confidenceIndex: number; // 0-100
  clarityScore: number; // 0-100

  // Response quality
  answerCompleteness: number; // 0-100
  technicalAccuracy: number; // 0-100 (AI evaluated)
  communicationQuality: number; // 0-100

  // Eye contact and presence (simulated from audio patterns)
  eyeContactEstimate: number; // 0-100
  attentionSpans: Array<{ duration: number; timestamp: number }>;

  // Emotional/cognitive indicators
  enthusiasm: number; // 0-100
  clarity: number; // 0-100
  coherence: number; // 0-100
}

export interface QuestionResponse {
  questionNumber: number;
  question: string;
  answer: string;
  metrics: Partial<InterviewMetrics>;
  timestamp: Date;
}

export class InterviewAnalytics {
  private metrics: InterviewMetrics = {
    totalSpeakingTime: 0,
    totalSilenceTime: 0,
    averageSpeakingDuration: 0,
    pauseCount: 0,
    averagePauseDuration: 0,
    wordCount: 0,
    sentenceCount: 0,
    averageWordsPerSentence: 0,
    uniqueWords: 0,
    filler_words: 0,
    fillerWordPercentage: 0,
    speakingPace: 0,
    confidenceIndex: 75,
    clarityScore: 75,
    answerCompleteness: 0,
    technicalAccuracy: 0,
    communicationQuality: 0,
    eyeContactEstimate: 0,
    attentionSpans: [],
    enthusiasm: 0,
    clarity: 0,
    coherence: 0,
  };

  private responses: QuestionResponse[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private speakingIntervals: Array<{ start: number; end: number }> = [];
  private currentSpeakingStart: number | null = null;
  private silentFrameCount = 0;
  private responseStartTime: number | null = null;

  private static readonly FILLER_WORDS = [
    'um',
    'uh',
    'like',
    'you know',
    'basically',
    'actually',
    'sort of',
    'kind of',
    'i mean',
    'right',
    'yeah',
    'so',
  ];

  constructor() {}

  /**
   * Initialize audio analysis for real-time metrics
   */
  async initializeAudioAnalysis(stream: MediaStream): Promise<void> {
    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(stream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      source.connect(this.analyser);

      // Create script processor for real-time analysis
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.analyser.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.scriptProcessor.onaudioprocess = this.analyzeAudio.bind(this);
    } catch (error) {
      console.error('Error initializing audio analysis:', error);
    }
  }

  /**
   * Analyze audio buffer for speaking/silence detection and confidence
   */
  private analyzeAudio = (event: AudioProcessingEvent): void => {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average frequency (indicates if speaking)
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const isSpeaking = average > 30; // Threshold for speech detection

    const now = Date.now();

    if (isSpeaking) {
      this.silentFrameCount = 0;
      if (this.currentSpeakingStart === null) {
        this.currentSpeakingStart = now;
        if (!this.responseStartTime) {
          this.responseStartTime = now;
        }
      }
    } else {
      this.silentFrameCount++;
      if (this.silentFrameCount > 10 && this.currentSpeakingStart !== null) {
        // 10+ frames of silence = end of speech
        this.speakingIntervals.push({
          start: this.currentSpeakingStart,
          end: now,
        });
        this.currentSpeakingStart = null;
      }
    }
  };

  /**
   * Analyze response text and update metrics
   */
  analyzeResponse(
    answerText: string,
    question: string,
    questionNumber: number
  ): Partial<InterviewMetrics> {
    const words = answerText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const wordCount = words.length;

    // Count sentences (rough estimate)
    const sentences = answerText
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;

    // Calculate speaking time
    let totalSpeakingTime = 0;
    let maxPause = 0;
    let totalPauseDuration = 0;

    for (const interval of this.speakingIntervals) {
      const duration = interval.end - interval.start;
      totalSpeakingTime += duration;
    }

    const pauseCount = this.speakingIntervals.length - 1;
    if (pauseCount > 0) {
      totalPauseDuration = pauseCount > 0 ? totalSpeakingTime * 0.2 : 0; // Estimate
      maxPause = totalPauseDuration / pauseCount;
    }

    // Count filler words
    const fillerWordMatches = answerText
      .toLowerCase()
      .match(new RegExp(InterviewAnalytics.FILLER_WORDS.join('|'), 'gi')) || [];
    const fillerWordCount = fillerWordMatches.length;

    // Unique words
    const uniqueWords = new Set(words).size;

    // Calculate metrics
    const speakingPace =
      totalSpeakingTime > 0 ? (wordCount / totalSpeakingTime) * 60000 : 0;
    const fillerPercentage =
      wordCount > 0 ? (fillerWordCount / wordCount) * 100 : 0;

    // Confidence index (higher word count, fewer fillers, consistent pace = more confidence)
    let confidenceIndex = 70;
    if (wordCount > 100) confidenceIndex += 10;
    if (wordCount > 200) confidenceIndex += 5;
    if (fillerPercentage < 5) confidenceIndex += 10;
    if (fillerPercentage > 15) confidenceIndex -= 15;
    if (speakingPace > 100 && speakingPace < 150) confidenceIndex += 8;
    confidenceIndex = Math.min(100, Math.max(0, confidenceIndex));

    // Clarity score (based on pause patterns and filler words)
    let clarityScore = 75;
    if (pauseCount > 20) clarityScore -= 10;
    if (fillerPercentage > 20) clarityScore -= 15;
    if (sentenceCount > 0 && wordCount / sentenceCount > 20) clarityScore += 5;
    clarityScore = Math.min(100, Math.max(0, clarityScore));

    // Answercompleteness (word count relative to question)
    const answerCompleteness = Math.min(
      100,
      Math.max(0, (wordCount / 150) * 100)
    );

    // Enthusiasm (based on speaking pace and word count)
    const enthusiasm = Math.min(
      100,
      (speakingPace / 150) * 50 + (wordCount / 200) * 50
    );

    // Coherence (fewer fillers, better structure)
    const coherence = Math.max(
      0,
      100 - fillerPercentage - (pauseCount > 15 ? 10 : 0)
    );

    // Calculate eye contact estimate (simulated from response consistency)
    const eyeContactEstimate = Math.min(100, confidenceIndex * 0.95 + 5);

    const responseMetrics: Partial<InterviewMetrics> = {
      totalSpeakingTime,
      totalSilenceTime: totalPauseDuration,
      averageSpeakingDuration:
        this.speakingIntervals.length > 0
          ? totalSpeakingTime / this.speakingIntervals.length
          : 0,
      pauseCount,
      averagePauseDuration: maxPause,
      wordCount,
      sentenceCount,
      averageWordsPerSentence:
        sentenceCount > 0 ? wordCount / sentenceCount : 0,
      uniqueWords,
      filler_words: fillerWordCount,
      fillerWordPercentage: fillerPercentage,
      speakingPace: Math.round(speakingPace * 10) / 10,
      confidenceIndex: Math.round(confidenceIndex),
      clarityScore: Math.round(clarityScore),
      answerCompleteness: Math.round(answerCompleteness),
      enthusiasm: Math.round(enthusiasm),
      clarity: Math.round(clarityScore),
      coherence: Math.round(coherence),
      eyeContactEstimate: Math.round(eyeContactEstimate),
    };

    // Store response
    this.responses.push({
      questionNumber,
      question,
      answer: answerText,
      metrics: responseMetrics,
      timestamp: new Date(),
    });

    // Reset for next question
    this.speakingIntervals = [];
    this.currentSpeakingStart = null;
    this.responseStartTime = null;
    this.silentFrameCount = 0;

    return responseMetrics;
  }

  /**
   * Generate aggregate metrics from all responses
   */
  generateAggregateMetrics(): InterviewMetrics {
    if (this.responses.length === 0) {
      return this.metrics;
    }

    const avgMetrics = {
      totalSpeakingTime: 0,
      totalSilenceTime: 0,
      averageSpeakingDuration: 0,
      pauseCount: 0,
      averagePauseDuration: 0,
      wordCount: 0,
      sentenceCount: 0,
      averageWordsPerSentence: 0,
      uniqueWords: 0,
      filler_words: 0,
      fillerWordPercentage: 0,
      speakingPace: 0,
      confidenceIndex: 0,
      clarityScore: 0,
      answerCompleteness: 0,
      technicalAccuracy: 0,
      communicationQuality: 0,
      eyeContactEstimate: 0,
      attentionSpans: [] as Array<{ duration: number; timestamp: number }>,
      enthusiasm: 0,
      clarity: 0,
      coherence: 0,
    };

    const count = this.responses.length;

    this.responses.forEach((resp) => {
      const m = resp.metrics;
      avgMetrics.totalSpeakingTime += m.totalSpeakingTime || 0;
      avgMetrics.wordCount += m.wordCount || 0;
      avgMetrics.confidenceIndex += m.confidenceIndex || 0;
      avgMetrics.clarityScore += m.clarityScore || 0;
      avgMetrics.speakingPace += m.speakingPace || 0;
      avgMetrics.filler_words += m.filler_words || 0;
      avgMetrics.fillerWordPercentage += m.fillerWordPercentage || 0;
      avgMetrics.pauseCount += m.pauseCount || 0;
      avgMetrics.answerCompleteness += m.answerCompleteness || 0;
      avgMetrics.enthusiasm += m.enthusiasm || 0;
      avgMetrics.clarity += m.clarity || 0;
      avgMetrics.coherence += m.coherence || 0;
      avgMetrics.eyeContactEstimate += m.eyeContactEstimate || 0;
    });

    // Calculate averages
    avgMetrics.confidenceIndex = Math.round(avgMetrics.confidenceIndex / count);
    avgMetrics.clarityScore = Math.round(avgMetrics.clarityScore / count);
    avgMetrics.speakingPace = Math.round((avgMetrics.speakingPace / count) * 10) / 10;
    avgMetrics.fillerWordPercentage = Math.round(
      (avgMetrics.fillerWordPercentage / count) * 10
    ) / 10;
    avgMetrics.answerCompleteness = Math.round(
      avgMetrics.answerCompleteness / count
    );
    avgMetrics.enthusiasm = Math.round(avgMetrics.enthusiasm / count);
    avgMetrics.clarity = Math.round(avgMetrics.clarity / count);
    avgMetrics.coherence = Math.round(avgMetrics.coherence / count);
    avgMetrics.eyeContactEstimate = Math.round(
      avgMetrics.eyeContactEstimate / count
    );
    avgMetrics.communicationQuality = Math.round(
      (avgMetrics.clarity + avgMetrics.coherence) / 2
    );
    avgMetrics.technicalAccuracy = 75; // This would be AI evaluated

    return avgMetrics;
  }

  /**
   * Get all responses
   */
  getResponses(): QuestionResponse[] {
    return this.responses;
  }

  /**
   * Cleanup audio resources
   */
  cleanup(): void {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
    }
    if (this.analyser) {
      this.analyser.disconnect();
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
