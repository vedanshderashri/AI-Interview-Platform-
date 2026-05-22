import { NextResponse } from "next/server";

export async function GET() {
  console.log("=== TEST API CALLED ===");
  console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
  console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length);
  
  return NextResponse.json({
    message: "Test API works",
    apiKeyExists: !!process.env.GEMINI_API_KEY,
    apiKeyLength: process.env.GEMINI_API_KEY?.length,
  });
}
