import { NextResponse } from 'next/server';

export async function GET() {
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    return NextResponse.json({ error: 'RAPIDAPI_KEY is not configured' }, { status: 500 });
  }

  try {
    // Using the Ubisoft endpoint as requested by the user
    const url = 'https://indeed12.p.rapidapi.com/company/Ubisoft/jobs?locality=us&start=1';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': 'indeed12.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    // We only return the latest few for "alerts"
    // Usually these APIs return an array in a specific field, let's assume 'hits' or similar
    // Based on RapidAPI Indeed patterns, it's often 'hits' or 'results'
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
