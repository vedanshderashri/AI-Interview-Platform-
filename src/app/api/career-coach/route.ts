import { NextResponse } from 'next/server';

const OPEN_ROUTER_KEY = process.env.OPEN_ROUTER_KEY || '';
const OPEN_ROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const SYSTEM_PROMPT = `You are an expert Career Coach and Interview Mentor. Your role is to:

1. **Help with Interview Preparation**: 
   - Provide tips for answering common interview questions
   - Teach STAR method (Situation, Task, Action, Result)
   - Explain behavioral and technical interview strategies
   - Help practice responses to tough questions

2. **Career Guidance**:
   - Advise on career development and progression
   - Discuss skill-building strategies
   - Help with resume and LinkedIn optimization
   - Provide industry insights

3. **Communication Skills**:
   - Improve clarity and articulation
   - Teach body language and confidence building
   - Help with storytelling and narrative structure
   - Provide feedback on communication style

4. **General Support**:
   - Answer questions about job hunting
   - Discuss work culture and company fit
   - Provide motivation and encouragement
   - Help with professional development

Guidelines:
- Be supportive, encouraging, and constructive
- Provide specific, actionable advice
- Use examples when helpful
- Ask clarifying questions when needed
- Keep responses concise but comprehensive
- Adapt your coaching style to the user's needs

Remember: You're a mentor focused on helping the user succeed in their career and interviews.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    if (!OPEN_ROUTER_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // Format messages for OpenRouter API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    const response = await fetch(`${OPEN_ROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPEN_ROUTER_KEY}`,
        'HTTP-Referer': 'https://mockmate.ai',
        'X-Title': 'MockMate AI Interview Platform',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          ...formattedMessages,
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API Error:', errorData);

      if (response.status === 429) {
        return NextResponse.json(
          {
            success: false,
            message: 'API rate limit reached. Please try again in a moment.',
            error: 'rate_limit',
          },
          { status: 429 }
        );
      }

      throw new Error(`OpenRouter API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || '';

    return NextResponse.json(
      {
        success: true,
        message: assistantMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Career Coach API Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request.',
        error: error?.message || 'unknown_error',
      },
      { status: 500 }
    );
  }
}
