import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import atsConfig from '@/config/ats-scoring.json';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Helper function to extract text from PDF as a fallback heuristic source
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const text = new TextDecoder().decode(uint8Array);
    return text;
  } catch (e) {
    return "Fallback simple developer profile.";
  }
}

// Heuristic fallback analysis when API quota is exceeded or Gemini fails
function generateFallbackAnalysis(resumeText: string) {
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

    if (!genAI) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY not configured. Please set up your API key in environment variables.'
      }, { status: 500 });
    }

    const jobDescription = formData.get('jobDescription') as string || '';

    // Convert PDF file directly to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'application/pdf';

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    let jobDescPrompt = "";
    if (jobDescription.trim()) {
      jobDescPrompt = `
      # TARGET JOB DESCRIPTION
      The candidate is applying for a role with the following target Job Description:
      """
      ${jobDescription}
      """
      
      You must evaluate keywords matching, skills relevance, experience, and projects strictly against this target job description! Tailor strengths, missing technical keywords, gaps, suggestions, and improvements precisely to help them optimize for this specific target job.
      `;
    } else {
      jobDescPrompt = `
      # TARGET PROFILE
      No specific target job description was provided. Analyze the resume generally for their core professional alignment (e.g. software development, product management, etc.) and suggest industry-standard skills and keywords relevant to their general profile.
      `;
    }

    const prompt = `
    # ROLE
    You are a Senior Technical Recruiter and ATS (Applicant Tracking System) Optimization Expert. Your goal is to analyze the provided resume document and provide a high-fidelity diagnostic audit report.

    ${jobDescPrompt}

    # SCORING CONFIGURATION
    ${JSON.stringify(atsConfig, null, 2)}

    # OBJECTIVE
    Perform a complete, detailed, and highly accurate analysis of the candidate's resume, incorporating keywords matching, skills relevance, experience, education, formatting, projects, and certifications.
    Score each section rigorously according to the weight configurations provided. Deduct points for penalties, and reward bonuses where applicable. The total score must sum up precisely to the final_score out of 100 based on the weights.

    # OUTPUT SPECIFICATIONS
    You MUST respond with a valid JSON object matching this schema. Do not output any markdown formatting tags (like \`\`\`json) or any conversational text. Return ONLY the JSON object.
    
    The JSON structure:
    {
      "success": true,
      "final_score": <integer 0-100>,
      "rating": "<'excellent' | 'good' | 'average' | 'poor' based on thresholds>",
      "scores": {
        "keywords_match": <integer 0-100>,
        "skills_relevance": <integer 0-100>,
        "experience": <integer 0-100>,
        "education": <integer 0-100>,
        "formatting": <integer 0-100>,
        "projects": <integer 0-100>,
        "certifications": <integer 0-100>
      },
      "matched_keywords": [<string array of key professional/tech keywords found in the resume>],
      "missing_keywords": [<string array of highly recommended industry-standard keywords missing from the resume based on their profile>],
      "strengths": [<string array of 3-5 major concrete strengths>],
      "weaknesses": [<string array of 3-5 specific concrete areas for improvement>],
      "suggestions": [<string array of 5+ actionable, high-impact concrete recommendations to boost the score>],
      "formatting_issues": [<string array of identified formatting problems like missing sections, tables, images, spelling errors>],
      "overall_feedback": "A professional 3-4 sentence diagnostic summary detailing their market competitiveness."
    }
    `;

    const documentPart = {
      inlineData: {
        data: base64String,
        mimeType: mimeType
      }
    };

    try {
      const result = await model.generateContent([prompt, documentPart]);
      const response = await result.response;
      const responseText = response.text() || '';

      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```[a-zA-Z]*\n/, '');
        cleanedText = cleanedText.replace(/\n```$/, '');
      }

      const jsonResponse = JSON.parse(cleanedText);
      return NextResponse.json(jsonResponse, { status: 200 });

    } catch (apiError: any) {
      console.error('Gemini API Error:', apiError);
      
      // Fallback heuristic if API parsing fails
      const fallbackText = await extractTextFromPDF(file);
      return NextResponse.json(generateFallbackAnalysis(fallbackText), { status: 200 });
    }

  } catch (error: any) {
    console.error('Error in ATS analyzer:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to analyze resume' 
    }, { status: 500 });
  }
}
