import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import atsConfig from '@/config/ats-scoring.json';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Helper function to extract text from PDF
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Simple text extraction - in production, use pdfjs or similar
  const text = new TextDecoder().decode(uint8Array);
  return text;
}

// Fallback mock analysis when API quota is exceeded or error occurs
function generateFallbackAnalysis(resumeText: string) {
  // Simple heuristic analysis as fallback
  const hasKeywords = (keywords: string[]) => keywords.some(kw => resumeText.toLowerCase().includes(kw));
  
  const techKeywords = ['python', 'javascript', 'typescript', 'react', 'node', 'java', 'sql', 'aws', 'docker', 'api'];
  const softSkills = ['leadership', 'communication', 'teamwork', 'management', 'mentoring', 'problem solving'];
  const certKeywords = ['aws', 'gcp', 'azure', 'certified', 'certification'];
  
  const matchedTech = techKeywords.filter(kw => resumeText.toLowerCase().includes(kw));
  const matchedSoft = softSkills.filter(kw => resumeText.toLowerCase().includes(kw));
  
  const keywordScore = Math.min(100, (matchedTech.length * 15) + (matchedSoft.length * 10));
  const skillsScore = Math.min(100, matchedTech.length * 12 + 40);
  const experienceScore = resumeText.toLowerCase().includes('year') ? 75 : 60;
  const educationScore = resumeText.toLowerCase().includes('bachelor') || resumeText.toLowerCase().includes('master') ? 80 : 50;
  const formattingScore = resumeText.split('\n').length > 5 ? 85 : 60;
  const projectScore = resumeText.toLowerCase().includes('project') ? 70 : 40;
  const certScore = hasKeywords(certKeywords) ? 75 : 40;
  
  const finalScore = Math.round(
    (keywordScore * 0.30 + skillsScore * 0.20 + experienceScore * 0.20 + 
     educationScore * 0.10 + formattingScore * 0.10 + projectScore * 0.05 + certScore * 0.05)
  );

  return {
    success: true,
    final_score: finalScore,
    rating: finalScore >= 85 ? 'excellent' : finalScore >= 70 ? 'good' : finalScore >= 50 ? 'average' : 'poor',
    scores: {
      keywords_match: keywordScore,
      skills_relevance: skillsScore,
      experience: experienceScore,
      education: educationScore,
      formatting: formattingScore,
      projects: projectScore,
      certifications: certScore
    },
    matched_keywords: matchedTech,
    missing_keywords: techKeywords.filter(kw => !matchedTech.includes(kw)).slice(0, 5),
    strengths: [
      `Found ${matchedTech.length} technical skills in resume`,
      matchedSoft.length > 0 ? `Includes soft skills: ${matchedSoft.join(', ')}` : 'Consider adding soft skills',
      'Resume has clear structure and sections'
    ],
    weaknesses: [
      'Consider adding more specific technical keywords',
      'Quantify achievements with numbers and metrics',
      'Include relevant certifications if applicable'
    ],
    suggestions: [
      'Add more industry-specific keywords relevant to target roles',
      'Quantify your accomplishments with metrics (e.g., "improved X by Y%")',
      'Use standard resume sections: Summary, Experience, Education, Skills, Projects',
      'Highlight relevant technical skills prominently',
      'Include measurable impact in project descriptions'
    ],
    formatting_issues: [],
    overall_feedback: 'Resume has a reasonable structure. To improve ATS compatibility, add more specific keywords, quantify achievements, and ensure proper formatting. (Using heuristic fallback)'
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!groq) {
      return NextResponse.json({
        success: false,
        error: 'GROQ_API_KEY not configured. Please set up your API key in environment variables.'
      }, { status: 500 });
    }

    // Extract text from PDF
    const resumeText = await extractTextFromPDF(file);

    if (!resumeText.trim() || resumeText.length < 50) {
      return NextResponse.json({ 
        error: 'Could not extract sufficient text from the file. Please ensure it\'s a valid text-based PDF.' 
      }, { status: 400 });
    }

    const prompt = `
    # ROLE
    You are a Senior Technical Recruiter and ATS (Applicant Tracking System) Optimization Expert. Your goal is to analyze the provided resume text with extreme precision and provide a high-fidelity report.

    # RESUME CONTENT
    """
    ${resumeText}
    """

    # SCORING CONFIGURATION
    ${JSON.stringify(atsConfig.scoring.sections, null, 2)}

    # OBJECTIVE
    Analyze the resume for:
    1. **Keyword Density**: Identify industry-standard technical and soft skill keywords.
    2. **Structural Integrity**: Check for standard sections (Experience, Education, Skills, etc.).
    3. **Content Quality**: Evaluate the use of action verbs and quantified achievements (e.g., "Increased revenue by 20%").
    4. **ATS Readability**: Identify potential formatting issues that might trip up older ATS systems.
    5. **Impact Scoring**: Provide a weighted score based on the provided configuration.

    # OUTPUT SPECIFICATIONS
    Return ONLY a JSON object. Do not include any introductory or concluding text.
    The JSON must follow this exact structure:
    {
      "success": true,
      "final_score": <integer 0-100>,
      "rating": "<'excellent' | 'good' | 'average' | 'poor'>",
      "scores": {
        "keywords_match": <integer 0-100>,
        "skills_relevance": <integer 0-100>,
        "experience": <integer 0-100>,
        "education": <integer 0-100>,
        "formatting": <integer 0-100>,
        "projects": <integer 0-100>,
        "certifications": <integer 0-100>
      },
      "matched_keywords": [<string array of found keywords>],
      "missing_keywords": [<string array of recommended keywords based on the profile>],
      "strengths": [<string array of 3-5 major strengths>],
      "weaknesses": [<string array of 3-5 specific areas for improvement>],
      "suggestions": [<string array of 5+ actionable, high-impact recommendations>],
      "formatting_issues": [<string array of identified formatting problems>],
      "overall_feedback": "A 2-3 sentence professional summary"
    }
    `;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional ATS analyzer. You output ONLY valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const outputText = completion.choices[0]?.message?.content || "";
      const jsonResponse = JSON.parse(outputText);

      return NextResponse.json(jsonResponse, { status: 200 });

    } catch (apiError: any) {
      console.error('Groq API Error:', apiError);
      // Fallback to heuristic analysis if API fails
      return NextResponse.json(generateFallbackAnalysis(resumeText), { status: 200 });
    }

  } catch (error: any) {
    console.error('Error in ATS analyzer:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to analyze resume' 
    }, { status: 500 });
  }
}
