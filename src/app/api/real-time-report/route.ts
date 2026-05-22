import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Groq API Key not configured." }, { status: 500 });
    }

    const groq = new Groq({ apiKey });
    const { messages, domain, sessionDuration } = await request.json();

    const transcript = messages
      .map((m: any) => `${m.role === "ai" ? "Interviewer" : "Candidate"}: ${m.content}`)
      .join("\n");

    const prompt = `You are an expert hiring manager. Analyze this interview transcript and return a structured JSON report.
    
    Domain: ${domain}
    Duration: ${Math.floor(sessionDuration / 60)} minutes
    
    Transcript:
    ${transcript}
    
    Return ONLY a JSON object with this structure:
    {
      "overallScore": number (0-100),
      "verdict": "string",
      "summary": "string (2-3 sentences)",
      "nervousnessLevel": number (0-100, where 0 is very calm and 100 is extremely nervous),
      "scores": { "communication": number, "technicalDepth": number, "confidence": number, "clarity": number, "problemSolving": number },
      "strengths": ["string", "string", "string"],
      "improvements": ["string", "string", "string"],
      "topicsDiscussed": ["string", "string", "string"],
      "recommendation": "Hire" | "Consider" | "Pass",
      "detailedFeedback": "string"
    }
    
    Note for nervousnessLevel: Analyze the transcript for filler words (um, uh, like), repetitive phrases, and hesitant starts. Also consider visual cues if video was available (simulate analysis of eye contact, facial tension, and posture based on conversation flow).`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: "json_object" },
      stream: false,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    const report = JSON.parse(raw);

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("Report generation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
