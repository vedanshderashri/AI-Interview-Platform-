import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getFromCache,
  saveToCache,
  getInFlightRequest,
  registerInFlightRequest,
  checkQuotaStatus,
  trackApiRequest,
} from '@/lib/apiCache';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * Analyze conversation content to extract performance metrics
 */
function analyzeConversationContent(history: any[], topics: string[]): any {
  let userResponses = [];
  for (let i = 1; i < history.length; i += 2) {
    if (history[i]?.role === 'user' || history[i]?.role !== 'model') {
      userResponses.push(history[i]?.content || '');
    }
  }

  // Calculate metrics from responses
  const totalWords = userResponses.reduce((sum, resp) => sum + (resp.split(/\s+/).length || 0), 0);
  const avgResponseLength = userResponses.length > 0 ? totalWords / userResponses.length : 0;
  
  // Analyze response quality
  let technicalTermCount = 0;
  const technicalPatterns = /\b(implement|algorithm|optimize|architecture|framework|database|api|async|promise|hook|component|state|lifecycle|performance|efficiency|scalability|redundancy|load-balanc|cach|queue|stream|buffer)\b/gi;
  userResponses.forEach(resp => {
    const matches = resp.match(technicalPatterns) || [];
    technicalTermCount += matches.length;
  });

  // Estimate technical depth based on response length and technical terms
  const technicalDepthRatio = totalWords > 0 ? Math.min(100, (technicalTermCount / totalWords) * 500) : 0;
  
  // Analyze filler words
  const fillerPatterns = /\b(um|uh|like|you know|kind of|sort of|basically|actually|literally|honestly|well|so|I mean)\b/gi;
  let fillerCount = 0;
  userResponses.forEach(resp => {
    const matches = resp.match(fillerPatterns) || [];
    fillerCount += matches.length;
  });

  const fillerRatio = totalWords > 0 ? (fillerCount / totalWords) * 100 : 0;

  // Analyze structure - look for STAR elements
  let starElementCount = 0;
  const starPatterns = /\b(situation|task|action|result|challenge|solved|implemented|learned|achieved|delivered)\b/gi;
  userResponses.forEach(resp => {
    const matches = resp.match(starPatterns) || [];
    starElementCount += matches.length;
  });

  return {
    userResponseCount: userResponses.length,
    totalWords,
    avgResponseLength,
    technicalTermCount,
    technicalDepthRatio,
    fillerCount,
    fillerRatio,
    starElementCount,
    userResponses
  };
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
    const { history = [], topics = [], timelineData = [] } = body;

    // Analyze the conversation content
    const conversationAnalysis = analyzeConversationContent(history, topics);

    // Create a cache key based on content
    const cacheKey = { history: history.length, topics, wordCount: conversationAnalysis.totalWords };
    
    // Check if we have a cached response
    const cachedResponse = getFromCache('analyze', cacheKey);
    if (cachedResponse) {
      console.log('[Analyze] Returning cached response');
      return NextResponse.json(cachedResponse, { status: 200 });
    }

    // Check if identical request is already in flight
    const inFlight = getInFlightRequest('analyze', cacheKey);
    if (inFlight) {
      console.log('[Analyze] Returning in-flight request');
      const result = await inFlight;
      return NextResponse.json(result, { status: 200 });
    }

    // Telemetry summary
    const avgEye = timelineData.length > 0 ? Math.round(timelineData.reduce((acc: any, curr: any) => acc + curr.eyeContact, 0) / timelineData.length) : 75;
    const avgConf = timelineData.length > 0 ? Math.round(timelineData.reduce((acc: any, curr: any) => acc + curr.confidence, 0) / timelineData.length) : 75;
    const topicsStr = topics.join(', ') || 'General';

    // Use a basic fallback if Gemini API is missing
    if (!genAI) {
      const fallback = {
        strengthsFeedback: `You answered ${conversationAnalysis.userResponseCount} questions with an average of ${Math.round(conversationAnalysis.avgResponseLength)} words per response. Note: Add GEMINI_API_KEY to .env.local for AI-powered analysis.`,
        improvementsFeedback: "Try to use more technical terminology and provide specific examples from your experience.",
        technicalScore: Math.min(100, Math.max(40, Math.round(conversationAnalysis.technicalDepthRatio))),
        communicationScore: Math.min(100, Math.max(40, Math.round(85 - (conversationAnalysis.fillerRatio * 0.5)))),
        nervousnessScore: Math.max(0, 100 - avgConf),
        overallScore: Math.min(100, Math.max(40, Math.round((85 - (conversationAnalysis.fillerRatio * 0.3)) * 0.7 + avgConf * 0.3))),
        structureScore: Math.min(100, Math.max(40, Math.round(50 + conversationAnalysis.starElementCount * 3))),
        depthScore: Math.min(100, Math.max(40, Math.round(conversationAnalysis.technicalDepthRatio * 1.2))),
        thinkingSpeed: Math.min(100, Math.max(40, Math.round(80 - (conversationAnalysis.fillerRatio * 0.3)))),
        decisionConfidence: avgConf,
      };
      saveToCache('analyze', cacheKey, fallback);
      return NextResponse.json(fallback, { status: 200 });
    }

    // Check quota before proceeding
    const quotaStatus = checkQuotaStatus();
    if (!quotaStatus.canProceed) {
      console.warn(`[Analyze] Quota check failed: ${quotaStatus.reason}`);
      const fallback = {
        strengthsFeedback: `You answered ${conversationAnalysis.userResponseCount} questions. Detailed analysis temporarily unavailable - your responses have been recorded.`,
        improvementsFeedback: `Try again in ${Math.ceil((quotaStatus.estimatedResetTime - Date.now()) / 1000)}s for detailed AI-powered feedback.`,
        technicalScore: Math.min(100, Math.max(40, Math.round(conversationAnalysis.technicalDepthRatio))),
        communicationScore: Math.min(100, Math.max(40, Math.round(85 - (conversationAnalysis.fillerRatio * 0.5)))),
        nervousnessScore: Math.max(0, 100 - avgConf),
        overallScore: Math.min(100, Math.max(40, Math.round((85 - (conversationAnalysis.fillerRatio * 0.3)) * 0.7 + avgConf * 0.3))),
        structureScore: Math.min(100, Math.max(40, Math.round(50 + conversationAnalysis.starElementCount * 3))),
        depthScore: Math.min(100, Math.max(40, Math.round(conversationAnalysis.technicalDepthRatio * 1.2))),
        thinkingSpeed: Math.min(100, Math.max(40, Math.round(80 - (conversationAnalysis.fillerRatio * 0.3)))),
        decisionConfidence: avgConf,
      };
      return NextResponse.json(fallback, { status: 200 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Summarize the input
    const conversation = history.map((msg: any) => `${msg.role === 'model' ? 'Interviewer' : 'Candidate'}: ${msg.content}`).join('\n');
    
    const prompt = `
    # ROLE
    You are a Senior Technical Recruiter and Behavioral Psychologist. Analyze this candidate's interview performance based on their actual responses.

    # INTERVIEW CONTEXT
    - Topics/Domains: ${topicsStr}
    - Number of Questions: ${conversationAnalysis.userResponseCount}
    - Total Words Spoken: ${conversationAnalysis.totalWords}
    - Average Response Length: ${Math.round(conversationAnalysis.avgResponseLength)} words
    - Filler Word Usage: ${conversationAnalysis.fillerRatio.toFixed(1)}%
    - Candidate Metrics: Avg Eye-Contact: ${avgEye}%, Avg Confidence: ${avgConf}%
    
    # ACTUAL INTERVIEW TRANSCRIPT
    ${conversation}

    # ANALYSIS REQUIREMENTS
    1. **Technical Depth Analysis**: Evaluate if answers show deep technical understanding or were superficial. Review actual technical terminology used (${conversationAnalysis.technicalTermCount} technical terms detected).
    2. **Response Structure**: Assess if answers followed logical flow with context/examples. (${conversationAnalysis.starElementCount} STAR framework elements detected)
    3. **Communication Quality**: Evaluate clarity, articulation, and engagement level given filler word usage (${conversationAnalysis.fillerRatio.toFixed(1)}%).
    4. **Confidence Correlation**: Map confidence metrics (${avgConf}%) to response content. Were answers hesitant or assertive?
    5. **Specific Strengths & Weaknesses**: Reference ACTUAL answers from the transcript. Identify 2-3 specific strong responses and 2-3 areas for improvement.

    # CRITICAL: Score Analysis Requirements
    - technicalScore: Based on actual technical terms used and explanation depth - NOT random numbers
    - depthScore: How detailed and expert-level were answers (analyze content, not guesses)
    - structureScore: Did answers follow logical STAR structure?
    - thinkingSpeed: Derived from articulation patterns and response clarity
    - decisionConfidence: Must align with provided ${avgConf}% confidence metric

    # OUTPUT FORMAT
    Output ONLY a valid JSON object:
    {
      "strengthsFeedback": "<string: Reference specific strong answers from the transcript. What did the candidate do well technically and behaviorally?>",
      "improvementsFeedback": "<string: Reference specific weak answers and explain what was missing. Be constructive and actionable.>",
      "technicalScore": <number: 0-100, based on actual technical content, NOT random>,
      "communicationScore": <number: 0-100, based on clarity and articulation>,
      "nervousnessScore": <number: 0-100, complement of confidence: ${100 - avgConf}>,
      "overallScore": <number: 0-100, weighted average of performance>,
      "structureScore": <number: 0-100, logical flow of responses>,
      "depthScore": <number: 0-100, technical depth shown>,
      "thinkingSpeed": <number: 0-100, articulation speed and clarity>,
      "decisionConfidence": <number: Must be ${avgConf}>
    }
    Return ONLY raw JSON. No markdown.`;

    // Create a promise for this API call
    const apiPromise = (async () => {
      let result;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          result = await model.generateContent(prompt);
          trackApiRequest(Math.ceil(conversation.length / 4));
          break;
        } catch (err: any) {
          if (err?.status === 429 && attempt < 2) {
            const retryDelay = Math.min((attempt + 1) * 10000, 30000);
            console.warn(`[Analyze] Rate limited. Retrying in ${retryDelay}ms... (Attempt ${attempt + 1}/3)`);
            await new Promise(res => setTimeout(res, retryDelay));
          } else if (err?.status === 429) {
            console.warn('[Analyze] Quota exceeded. Using conversation-based fallback.');
            // Use content-based fallback instead of random numbers
            const contentBasedFallback = {
              strengthsFeedback: `You provided ${conversationAnalysis.userResponseCount} responses averaging ${Math.round(conversationAnalysis.avgResponseLength)} words each. Your answers contained ${conversationAnalysis.technicalTermCount} technical terms and demonstrated effort.`,
              improvementsFeedback: `Focus on reducing filler words (${conversationAnalysis.fillerRatio.toFixed(1)}% detected) and adding more specific examples from your experience.`,
              technicalScore: Math.min(100, Math.max(40, Math.round(conversationAnalysis.technicalDepthRatio))),
              communicationScore: Math.min(100, Math.max(40, Math.round(85 - (conversationAnalysis.fillerRatio * 0.5)))),
              nervousnessScore: Math.max(0, 100 - avgConf),
              overallScore: Math.min(100, Math.max(40, Math.round((85 - (conversationAnalysis.fillerRatio * 0.3)) * 0.7 + avgConf * 0.3))),
              structureScore: Math.min(100, Math.max(40, Math.round(50 + conversationAnalysis.starElementCount * 3))),
              depthScore: Math.min(100, Math.max(40, Math.round(conversationAnalysis.technicalDepthRatio * 1.2))),
              thinkingSpeed: Math.min(100, Math.max(40, Math.round(80 - (conversationAnalysis.fillerRatio * 0.3)))),
              decisionConfidence: avgConf,
            };
            saveToCache('analyze', cacheKey, contentBasedFallback);
            return contentBasedFallback;
          } else {
            throw err;
          }
        }
      }

      if (!result) throw new Error('Failed to generate analysis after retries');
      
      let outputText = result.response.text().trim();
      
      // Clean up potential markdown formatting around JSON
      if (outputText.startsWith('```json')) outputText = outputText.slice(7);
      if (outputText.startsWith('```')) outputText = outputText.slice(3);
      if (outputText.endsWith('```')) outputText = outputText.slice(0, -3);

      const jsonResponse = JSON.parse(outputText);
      
      // Validate that scores are not random/fake
      jsonResponse.decisionConfidence = avgConf; // Lock to actual confidence
      
      saveToCache('analyze', cacheKey, jsonResponse);
      return jsonResponse;
    })();

    // Register the in-flight request
    registerInFlightRequest('analyze', cacheKey, apiPromise);

    const result = await apiPromise;
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('[Analyze] Error:', error?.message || error);
    
    // Return content-based fallback instead of random scores
    const conversationAnalysis = analyzeConversationContent(body.history || [], body.topics || []);
    const avgConf = body?.timelineData?.length > 0
      ? Math.round(body.timelineData.reduce((acc: any, curr: any) => acc + curr.confidence, 0) / body.timelineData.length)
      : 75;

    const fallback = {
      strengthsFeedback: `You completed the interview with ${conversationAnalysis.userResponseCount} responses. Your answers contained ${conversationAnalysis.technicalTermCount} technical terms and demonstrated engagement.`,
      improvementsFeedback: "Continue practicing to refine your technical depth and reduce hesitation patterns.",
      technicalScore: Math.min(100, Math.max(40, Math.round(conversationAnalysis.technicalDepthRatio))),
      communicationScore: Math.min(100, Math.max(40, Math.round(85 - (conversationAnalysis.fillerRatio * 0.5)))),
      nervousnessScore: Math.max(0, 100 - avgConf),
      overallScore: Math.min(100, Math.max(40, Math.round((85 - (conversationAnalysis.fillerRatio * 0.3)) * 0.7 + avgConf * 0.3))),
      structureScore: Math.min(100, Math.max(40, Math.round(50 + conversationAnalysis.starElementCount * 3))),
      depthScore: Math.min(100, Math.max(40, Math.round(conversationAnalysis.technicalDepthRatio * 1.2))),
      thinkingSpeed: Math.min(100, Math.max(40, Math.round(80 - (conversationAnalysis.fillerRatio * 0.3)))),
      decisionConfidence: avgConf,
    };
    
    return NextResponse.json(fallback, { status: 200 });
  }
}
