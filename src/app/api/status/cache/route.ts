import { NextResponse } from 'next/server';
import { getCacheStats, getCacheInfo } from '@/lib/apiCache';

/**
 * GET /api/status/cache
 * Returns cache statistics and quota information
 */
export async function GET() {
  try {
    const stats = getCacheStats();
    const cacheInfo = getCacheInfo();

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        cache: {
          size: stats.cacheSize,
          totalHits: stats.totalHits,
          averageHitsPerEntry: stats.averageHitsPerEntry,
          entries: cacheInfo.entries.slice(0, 10), // Show last 10 entries
          inFlightRequests: cacheInfo.inFlightRequests,
        },
        quota: {
          canProceed: stats.quotaStatus.canProceed,
          requestsRemaining: stats.quotaStatus.requestsRemaining,
          estimatedResetTime: new Date(stats.quotaStatus.estimatedResetTime).toISOString(),
          reason: stats.quotaStatus.reason,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cache status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get cache status' },
      { status: 500 }
    );
  }
}
