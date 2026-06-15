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

export async function GET(request: Request) {
  try {
    const TAVUS_API_KEY = getTavusApiKey();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!TAVUS_API_KEY) {
      return NextResponse.json({ error: 'TAVUS_API_KEY not configured' }, { status: 400 });
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Fetch conversation with verbose=true to get transcripts
    const response = await fetch(`${TAVUS_BASE_URL}/conversations/${conversationId}?verbose=true`, {
      method: 'GET',
      headers: {
        'x-api-key': TAVUS_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: 'Failed to fetch conversation history', details: error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching Tavus history:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
