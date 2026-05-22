/**
 * Analytics Data Synchronization Utility
 * Syncs interview data between stores, localStorage, and the analytics dashboard
 */

import { TelemetryPoint } from '@/store/interviewStore';

export interface AnalyticsSession {
  id: string;
  sessionTitle: string;
  candidateName: string;
  date: Date;
  duration: number;
  technicalScore: number;
  communicationScore: number;
  nervousnessScore: number;
  overallScore: number;
  structureScore: number;
  depthScore: number;
  thinkingSpeed: number;
  decisionConfidence: number;
  strengthsFeedback: string;
  improvementsFeedback: string;
  topics: string[];
  videoRecordingUrl?: string;
  timelineData: TelemetryPoint[];
}

const STORAGE_KEY = 'kriyeta_analytics_sessions';
const ACTIVE_SESSION_KEY = 'kriyeta_active_session';
const SYNC_CACHE_KEY = 'kriyeta_sync_cache';

/**
 * Save a session to persistent storage
 */
export const saveAnalyticsSession = (session: AnalyticsSession) => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    const sessions = existing ? JSON.parse(existing) : [];

    // Check if session already exists
    const existingIndex = sessions.findIndex((s: AnalyticsSession) => s.id === session.id);

    if (existingIndex !== -1) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }

    // Keep only last 50 sessions to avoid bloating localStorage
    if (sessions.length > 50) {
      sessions.shift();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return true;
  } catch (error) {
    console.error('Failed to save analytics session:', error);
    return false;
  }
};

/**
 * Get all saved analytics sessions
 */
export const getAllAnalyticsSessions = (): AnalyticsSession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to retrieve analytics sessions:', error);
    return [];
  }
};

/**
 * Get a specific session by ID
 */
export const getAnalyticsSessionById = (id: string): AnalyticsSession | null => {
  try {
    const sessions = getAllAnalyticsSessions();
    return sessions.find((s) => s.id === id) || null;
  } catch (error) {
    console.error('Failed to get session by ID:', error);
    return null;
  }
};

/**
 * Save active session snapshot for real-time syncing
 */
export const saveActiveSessionSnapshot = (sessionData: Partial<AnalyticsSession>) => {
  try {
    const snapshot = {
      ...sessionData,
      syncedAt: new Date().toISOString(),
    };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(snapshot));
    return true;
  } catch (error) {
    console.error('Failed to save active session snapshot:', error);
    return false;
  }
};

/**
 * Get active session snapshot
 */
export const getActiveSessionSnapshot = (): Partial<AnalyticsSession> | null => {
  try {
    const data = localStorage.getItem(ACTIVE_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get active session snapshot:', error);
    return null;
  }
};

/**
 * Clear active session
 */
export const clearActiveSession = () => {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear active session:', error);
    return false;
  }
};

/**
 * Calculate analytics aggregates from multiple sessions
 */
export const calculateAggregateMetrics = (sessions: AnalyticsSession[]) => {
  if (sessions.length === 0) {
    return {
      avgTechnicalScore: 0,
      avgCommunicationScore: 0,
      avgOverallScore: 0,
      avgConfidence: 0,
      totalSessions: 0,
      bestScore: 0,
      worstScore: 0,
      trends: {
        technicalTrend: 0,
        communicationTrend: 0,
      },
    };
  }

  const scores = sessions.map((s) => s.overallScore);
  const technicalScores = sessions.map((s) => s.technicalScore);
  const communicationScores = sessions.map((s) => s.communicationScore);
  const confidenceScores = sessions.map((s) => s.decisionConfidence);

  const avgTechnical = Math.round(technicalScores.reduce((a, b) => a + b, 0) / sessions.length);
  const avgCommunication = Math.round(communicationScores.reduce((a, b) => a + b, 0) / sessions.length);
  const avgOverall = Math.round(scores.reduce((a, b) => a + b, 0) / sessions.length);
  const avgConfidence = Math.round(confidenceScores.reduce((a, b) => a + b, 0) / sessions.length);

  // Calculate trends (comparing first half vs second half)
  const midpoint = Math.floor(sessions.length / 2);
  const firstHalf = sessions.slice(0, midpoint);
  const secondHalf = sessions.slice(midpoint);

  const firstHalfTech = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b.technicalScore, 0) / firstHalf.length : 0;
  const secondHalfTech = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b.technicalScore, 0) / secondHalf.length : 0;
  const technicalTrend = Math.round(secondHalfTech - firstHalfTech);

  const firstHalfComm = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b.communicationScore, 0) / firstHalf.length : 0;
  const secondHalfComm = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b.communicationScore, 0) / secondHalf.length : 0;
  const communicationTrend = Math.round(secondHalfComm - firstHalfComm);

  return {
    avgTechnicalScore: avgTechnical,
    avgCommunicationScore: avgCommunication,
    avgOverallScore: avgOverall,
    avgConfidence: avgConfidence,
    totalSessions: sessions.length,
    bestScore: Math.max(...scores),
    worstScore: Math.min(...scores),
    trends: {
      technicalTrend,
      communicationTrend,
    },
  };
};

/**
 * Get analytics for a specific time period
 */
export const getSessionsByDateRange = (
  startDate: Date,
  endDate: Date
): AnalyticsSession[] => {
  try {
    const sessions = getAllAnalyticsSessions();
    return sessions.filter((s) => {
      const sessionDate = new Date(s.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  } catch (error) {
    console.error('Failed to filter sessions by date:', error);
    return [];
  }
};

/**
 * Get analytics by candidate
 */
export const getSessionsByCandidate = (candidateName: string): AnalyticsSession[] => {
  try {
    const sessions = getAllAnalyticsSessions();
    return sessions.filter((s) =>
      s.candidateName.toLowerCase().includes(candidateName.toLowerCase())
    );
  } catch (error) {
    console.error('Failed to filter sessions by candidate:', error);
    return [];
  }
};

/**
 * Sync data from dashboard API endpoint
 */
export const syncAnalyticsFromServer = async (endpoint: string = '/api/analytics/sync') => {
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const data = await response.json();
    const sessions = data.sessions as AnalyticsSession[];

    // Merge with local sessions
    const localSessions = getAllAnalyticsSessions();
    const merged = [...localSessions];

    for (const remoteSession of sessions) {
      const existingIndex = merged.findIndex((s) => s.id === remoteSession.id);
      if (existingIndex !== -1) {
        // Update if remote is newer
        if (new Date(remoteSession.date) > new Date(merged[existingIndex].date)) {
          merged[existingIndex] = remoteSession;
        }
      } else {
        merged.push(remoteSession);
      }
    }

    // Save merged data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    // Update sync cache
    localStorage.setItem(SYNC_CACHE_KEY, JSON.stringify({
      lastSync: new Date().toISOString(),
      sessionCount: merged.length,
    }));

    return { success: true, sessionCount: merged.length };
  } catch (error) {
    console.error('Failed to sync analytics from server:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Export analytics data as JSON
 */
export const exportAnalyticsAsJSON = (sessions?: AnalyticsSession[]) => {
  try {
    const data = sessions || getAllAnalyticsSessions();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to export analytics:', error);
    return false;
  }
};

/**
 * Clear all analytics data (use with caution)
 */
export const clearAllAnalytics = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.removeItem(SYNC_CACHE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear analytics:', error);
    return false;
  }
};

/**
 * Get sync status information
 */
export const getSyncStatus = () => {
  try {
    const cache = localStorage.getItem(SYNC_CACHE_KEY);
    const status = cache ? JSON.parse(cache) : { lastSync: null, sessionCount: 0 };
    return {
      ...status,
      localSessionCount: getAllAnalyticsSessions().length,
    };
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return { lastSync: null, sessionCount: 0, localSessionCount: 0 };
  }
};
