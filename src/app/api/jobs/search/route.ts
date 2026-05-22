import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || 'Software Engineer';
  const location = searchParams.get('location') || 'USA';
  const page = searchParams.get('page') || '1';

  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    return NextResponse.json({ error: 'RAPIDAPI_KEY is not configured' }, { status: 500 });
  }

  try {
    // The user provided search might be different from company jobs
    // But for now we'll use a general search if company is not provided
    const url = `https://indeed12.p.rapidapi.com/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&page=${page}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'indeed12.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
