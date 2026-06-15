import { NextResponse } from 'next/server';

const TAVUS_BASE_URL = 'https://tavusapi.com/v2';

const getTavusApiKey = () => {
  const keys = ['tavus_api', 'mockmate_api', 'TAVUS_API_KEY'];
  for (const k of keys) {
    const val = process.env[k] || process.env[k.toUpperCase()] || process.env[k.toLowerCase()];
    if (val) return val.trim();
  }
  for (const k of Object.keys(process.env)) {
    if (k.trim() === 'tavus_api' || k.trim() === 'mockmate_api' || k.trim() === 'TAVUS_API_KEY') {
      const val = process.env[k];
      if (val) return val.trim();
    }
  }
  return '';
};

interface ConversationRequest {
  personaId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const TAVUS_API_KEY = getTavusApiKey();
    if (!TAVUS_API_KEY) {
      return NextResponse.json(
        { error: 'TAVUS_API_KEY not configured' },
        { status: 400 }
      );
    }

    const body: ConversationRequest = await request.json();
    const { personaId, messages } = body;

    if (!personaId || !messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: personaId, messages' },
        { status: 400 }
      );
    }

    // Create a new conversation
    const createConvResponse = await fetch(`${TAVUS_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY,
      },
      body: JSON.stringify({
        persona_id: personaId,
      }),
    });

    if (!createConvResponse.ok) {
      const error = await createConvResponse.text();
      console.error('Tavus Conversation Creation Error:', error);
      return NextResponse.json(
        { error: 'Failed to create conversation', details: error },
        { status: createConvResponse.status }
      );
    }

    const conversation = await createConvResponse.json();
    const conversationId = conversation.id;

    // Send messages and get response
    const messageResponse = await fetch(
      `${TAVUS_BASE_URL}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TAVUS_API_KEY,
        },
        body: JSON.stringify({
          messages: messages,
        }),
      }
    );

    if (!messageResponse.ok) {
      const error = await messageResponse.text();
      console.error('Tavus Message Error:', error);
      return NextResponse.json(
        { error: 'Failed to send message', details: error },
        { status: messageResponse.status }
      );
    }

    const result = await messageResponse.json();

    return NextResponse.json(
      {
        conversationId,
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in Tavus conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const TAVUS_API_KEY = getTavusApiKey();
    if (!TAVUS_API_KEY) {
      return NextResponse.json(
        { error: 'TAVUS_API_KEY not configured' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${TAVUS_BASE_URL}/conversations/${conversationId}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': TAVUS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Tavus Get Conversation Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversation', details: error },
        { status: response.status }
      );
    }

    const conversation = await response.json();
    return NextResponse.json(conversation, { status: 200 });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
