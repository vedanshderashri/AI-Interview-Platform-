import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const { base64, mimeType } = await request.json();

    if (!base64 || !mimeType) {
      return NextResponse.json({ error: 'Missing document data' }, { status: 400 });
    }

    if (!genAI) {
      return NextResponse.json({ text: "Mock Resume Text: Experienced Software Engineer." }, { status: 200 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = "Parse this resume. Return a highly detailed, comprehensive text summary of the candidate's skills, professional experience, education, and projects. Output ONLY plain text, no markdown. Treat this as the primary source of truth for an interview.";

    const documentPart = {
      inlineData: {
        data: base64,
        mimeType: mimeType
      }
    };

    const result = await model.generateContent([prompt, documentPart]);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text }, { status: 200 });
  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 });
  }
}
