import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import InterviewSession from '@/models/InterviewSession';

/**
 * GET /api/analytics/sync
 * Fetches all interview sessions for a specific user
 */
export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sessions = await InterviewSession.find({ userId }).sort({ date: -1 });

    if (sessions.length > 0) {
      const technicalScores = sessions.map((s: any) => s.technicalScore);
      const communicationScores = sessions.map((s: any) => s.communicationScore);

      const avgTechnical = technicalScores.reduce((a: number, b: number) => a + b, 0) / sessions.length;
      const avgCommunication = communicationScores.reduce((a: number, b: number) => a + b, 0) / sessions.length;

      return new Response(
        JSON.stringify({
          success: true,
          sessions,
          aggregates: {
            totalSessions: sessions.length,
            avgTechnicalScore: Math.round(avgTechnical),
            avgCommunicationScore: Math.round(avgCommunication),
          },
          syncedAt: new Date().toISOString(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sessions: [],
        aggregates: {
          totalSessions: 0,
          avgTechnicalScore: 0,
          avgCommunicationScore: 0,
        },
        syncedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analytics sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to sync analytics data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/analytics/sync
 * Saves a new interview session to MongoDB
 */
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { userId, ...sessionData } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await InterviewSession.create({
      userId,
      ...sessionData,
      date: new Date(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Session saved successfully',
        sessionId: session._id,
        savedAt: new Date().toISOString(),
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analytics save error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to save analytics session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
