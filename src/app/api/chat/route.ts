import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API only if the key exists to avoid crashing on boot
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript, history = [], topics = [], elapsedMs = 0, resumeText = null } = body;

    // Allow empty transcript for initial system initiation (interview start)
    if (transcript === undefined && transcript === null && history.length === 0) {
      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    if (!genAI) {
      // Fallback for when API key is missing
      return NextResponse.json({ response: "I'm Kriyeta. To make me dynamic, please add a GEMINI_API_KEY to your .env.local file. For now, please tell me about a challenge you solved recently." }, { status: 200 });
    }

    const modelTurns = history.filter((m: any) => m.role === 'model').length;

    const isWrappingUp = elapsedMs > 540000 || modelTurns >= 9; 
    const isFinished = elapsedMs >= 600000 || modelTurns >= 10;

    let phaseDirection = "";
    if (modelTurns === 0) {
      phaseDirection = `PHASE 1 (Greeting): Briefly introduce yourself as Kriyeta, the AI Interviewer. Ask if they are ready to begin. Do NOT ask any technical questions. If they say they are ready, immediately proceed to Phase 2 in your next turn.`;
    } else if (modelTurns > 0 && modelTurns <= 3) {
      phaseDirection = `PHASE 2 (Domain Knowledge): The candidate is ready. Ask a specific, difficult technical question regarding [${topics.join(', ')}]. Do not repeat greetings.`;
    } else if (modelTurns > 3 && modelTurns <= 6) {
      phaseDirection = `PHASE 3 (Projects & Experience): Transition to project architecture and real-world system design related to their background.`;
    } else if (modelTurns > 6 && modelTurns <= 8) {
      phaseDirection = `PHASE 4 (Behavioral & Soft Skills): Ask a standard behavioral question (e.g., STAR method).`;
    } else {
      phaseDirection = `PHASE 5 (Wrap Up): Thank them and end the session.`;
    }

    let systemPrompt = `You are Kriyeta, an elite FAANG-level strict technical interviewer and behavioral evaluator.
    The candidate has selected the following domains/topics: [${topics.join(', ') || 'General Soft Skills'}].
    ${resumeText ? `The candidate's background context: \n"${resumeText}"\nTailor questions specifically around their experience.` : ''}
    
    CRITICAL DOMAIN ADHERENCE:
    YOUR SOLE OBJECTIVE is to test the candidate strictly on the selected domains: [${topics.join(', ') || 'General Soft Skills'}]. Do NOT ask about random technologies outside these domains. Focus exclusively on the requested topics.

    CRITICAL INSTRUCTION - CURRENT PHASE:
    ${phaseDirection}

    INTERVIEW STRATEGY:
    1. Be strict, concise, professional, and maintain a high-bar standard. Do not praise them excessively.
    2. Do not output internal reasoning or markdown formatting. 
    3. ALWAYS end your response with exactly ONE sharp question for the candidate, unless the interview is over or it's the wrap-up phase. Do NOT ask multiple questions at once.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Understood. I will act as the interviewer." }] },
        ...history.map((msg: any) => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }))
      ],
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.8,
      }
    });

    // If there's no transcript (or empty string), send an initiation prompt
    const message = (transcript && transcript.trim() !== '')
      ? transcript
      : "[SYSTEM INITIATION: The interview session has just started. Begin by greeting the candidate warmly, introduce yourself as Kriyeta, and ask if they are ready to start.]";
    
    // Retry with backoff on rate limit (429)
    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await chat.sendMessage(message);
        break;
      } catch (err: any) {
        if (err?.status === 429 && attempt < 2) {
          const retryDelay = (attempt + 1) * 5000;
          console.warn(`Rate limited. Retrying in ${retryDelay}ms...`);
          await new Promise(res => setTimeout(res, retryDelay));
        } else {
          throw err;
        }
      }
    }

    if (!result) throw new Error('Failed after retries');
    const aiResponse = result.response.text();

    return NextResponse.json({ 
      response: aiResponse, 
      isFinished,
      type: 'question' 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in chat API:', error);
    if (error?.status === 429) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded',
        response: "I need a moment to formulate my next question. Please hold on briefly.", 
        isFinished: false,
        type: 'system'
      }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
