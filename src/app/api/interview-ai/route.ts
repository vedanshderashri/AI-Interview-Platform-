import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const INTERVIEW_PROMPT = `You are an expert interview coach conducting a technical/behavioral interview. Your role is to:

1. Ask one clear, relevant interview question at a time
2. Listen to the candidate's response
3. Provide constructive feedback
4. Score the response (1-10)
5. Ask follow-up questions if needed
6. After 5 questions, provide an overall assessment

Format your responses as JSON:
{
  "question": "Your next interview question",
  "feedback": "Feedback on previous answer (if applicable)",
  "score": 0,
  "followUp": "Optional follow-up question",
  "nextStep": "question" | "assessment",
  "assessment": "Overall assessment (if finished)"
}`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { messages, questionCount } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    // Build context for the interview
    let conversationContext = INTERVIEW_PROMPT + "\n\nInterview Progress: " + (questionCount || 0) + " questions asked\n\nConversation:\n";
    
    for (const msg of messages) {
      conversationContext += `${msg.role === "user" ? "Candidate" : "Interviewer"}: ${msg.content}\n`;
    }

    const result = await model.generateContent(conversationContext);
    const responseText = result.response.text();

    if (!responseText) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: responseText });

  } catch (error: any) {
    console.error("Interview API Error:", error?.message || error);
    
    return NextResponse.json(
      { 
        error: error?.message || "Failed to generate interview response",
      },
      { status: 500 }
    );
  }
}
