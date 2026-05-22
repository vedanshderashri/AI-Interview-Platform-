import { NextResponse } from 'next/server';

const TAVUS_API_KEY = process.env.TAVUS_API_KEY;
const TAVUS_BASE_URL = 'https://tavusapi.com/v2';

/** POST /api/tavus/start-conversation
 *  Accepts optional { personaId } in body.
 *  Creates a live Tavus CVI conversation and returns { conversationId, conversationUrl }.
 */
export async function POST(request: Request) {
  try {
    if (!TAVUS_API_KEY) {
      return NextResponse.json(
        { error: 'TAVUS_API_KEY not configured' },
        { status: 400 }
      );
    }

    let personaId: string | undefined;
    let experienceLevel = 'Mid-Level';
    let duration = 10;
    let resumeText = '';
    let selectedTopics: string[] = [];
    let candidateName = 'Candidate';

    try {
      const body = await request.json();
      personaId = body?.personaId;
      experienceLevel = body?.experienceLevel || 'Mid-Level';
      duration = body?.duration || 10;
      resumeText = body?.resumeText || '';
      selectedTopics = body?.selectedTopics || [];
      candidateName = body?.candidateName || 'Candidate';
      // ... we'll use candidateName below
    } catch {
      // Body is optional
    }

    // Seniority-aware cache (only for non-resume sessions to keep things fast)
    const isResumeSession = !!resumeText;
    const cacheKey = `cachedPersonaId_${experienceLevel.replace(/\s+/g, '_')}`;
    
    if (!personaId && !isResumeSession) {
      personaId = (global as any)[cacheKey];
    }

    // Optimization: If no personaId provided and not cached (or if resume session), find it
    if (!personaId) {
      const personaRes = await fetch(`${TAVUS_BASE_URL}/personas`, {
        headers: { 'x-api-key': TAVUS_API_KEY }
      });
      
      if (personaRes.ok) {
        const data = await personaRes.json();
        const personas = data.personas || data;
        
        if (Array.isArray(personas)) {
          // For non-resume sessions, find the seniority-matched persona
          if (!isResumeSession) {
            const interviewer = personas.find((p: any) => 
              p.persona_name === `Interviewer (${experienceLevel})`
            );
            if (interviewer) {
              personaId = interviewer.persona_id || interviewer.id;
              (global as any)[cacheKey] = personaId;
            }
          }
        }
      }
      
      // Still no persona? Create it on the fly
      if (!personaId) {
         const topicsStr = selectedTopics.join(', ') || 'General Technical Knowledge';
         const systemPrompt = `# SYSTEM PROMPT — Structured Screening Interview

## IDENTITY
You are a professional digital interviewer conducting a structured screening interview for Kriyeta. You are warm, composed, and professional.

## CANDIDATE CONTEXT
- **Candidate Name**: ${candidateName}
- **Target Seniority**: ${experienceLevel}
- **Allocated Time**: ${duration} minutes
- **Focus Areas**: ${topicsStr}
${isResumeSession ? `- **Resume Background**: ${resumeText}` : ''}

---

## CRITICAL CONSTRAINTS
- Greet ${candidateName} warmly by name.
- Conduct ONLY this screening interview using the questions provided below.
- Never teach, hint, correct, or evaluate answers. Use neutral acknowledgments.
- Follow the sequence: Greeting -> Warmup -> Screening Questions -> Closing.

---

## OPENING PHASE (Greeting)
1. Greet ${candidateName} warmly.
2. Provide a brief pleasantry (e.g., "How are you doing today?").
3. Transition: "Alright, ${candidateName}, let's get started. I'll be asking you a series of questions—just take your time."

---

## BASIC SCREENING INTERVIEW QUESTIONS
(Ask these in sequence, weaving in the focus areas: ${topicsStr} where natural)

### Background & Interest
1. Tell me a little bit about yourself and your background.
2. What interests you about this position?

### Experience & Skills
3. What relevant experience do you have that you feel prepares you for this role? (Focus on: ${topicsStr})

### Work Style & Situational
4. Describe how you typically handle working under pressure or tight deadlines.

### Availability & Logistics
5. Are you available to work the schedule required for this position?

### Closing
6. Where do you see yourself professionally in the next few years?

---

## ROLE BEHAVIOR & TRANSITIONS
After each answer, acknowledge neutrally and move forward:
- "Got it, thank you. Next question for you..."
- "Understood. Moving on..."
- "Appreciate that. Let me ask you this..."

---

## CLOSING PHASE
1. Signal end: "Alright, that was my last question for you today."
2. Thank ${candidateName} sincerely.
3. Next steps: "You'll receive a follow-up regarding the next steps."

---

## PURPOSE
Ensure a fair, consistent, and professionally warm digital interview experience.`;
         
         const personaName = isResumeSession 
            ? `Interviewer (Custom-${Date.now()})` 
            : `Interviewer (${experienceLevel})`;

         const createRes = await fetch(`${TAVUS_BASE_URL}/personas`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'x-api-key': TAVUS_API_KEY },
           body: JSON.stringify({
             persona_name: personaName,
             default_replica_id: 'r5f0577fc829',
             system_prompt: systemPrompt
           })
         });
         
         if (createRes.ok) {
           const p = await createRes.json();
           personaId = p.persona_id || p.id;
           if (!isResumeSession) (global as any)[cacheKey] = personaId;
         }
      }
    }

    // Build conversation payload
    const payload: Record<string, unknown> = {
      replica_id: process.env.TAVUS_DEFAULT_REPLICA_ID || 'r5f0577fc829',
    };
    if (personaId) {
      payload.persona_id = personaId;
    }

    const response = await fetch(`${TAVUS_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tavus start-conversation error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create conversation', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(
      {
        conversationId: data.conversation_id,
        conversationUrl: data.conversation_url,
        status: data.status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error starting Tavus conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
