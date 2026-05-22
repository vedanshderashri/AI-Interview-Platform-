/**
 * Custom Hook: useAnalyticsSync
 * Provides real-time analytics data syncing and state management
 */

import { useEffect, useState, useCallback } from 'react';
import {
  getAllAnalyticsSessions,
  calculateAggregateMetrics,
  syncAnalyticsFromServer,
  getSyncStatus,
  saveActiveSessionSnapshot,
  AnalyticsSession,
} from '@/lib/analyticsSync';

interface UseAnalyticsSyncReturn {
  sessions: AnalyticsSession[];
  aggregateMetrics: any;
  syncStatus: any;
  syncing: boolean;
  lastSyncError: string | null;
  manualSync: () => Promise<void>;
  refreshData: () => void;
}

export const useAnalyticsSync = (autoSync = true, syncInterval = 60000): UseAnalyticsSyncReturn => {
  const [sessions, setSessions] = useState<AnalyticsSession[]>([]);
  const [aggregateMetrics, setAggregateMetrics] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  // Refresh local data
  const refreshData = useCallback(() => {
    try {
      const allSessions = getAllAnalyticsSessions();
      setSessions(allSessions);
      const metrics = calculateAggregateMetrics(allSessions);
      setAggregateMetrics(metrics);
      setSyncStatus(getSyncStatus());
    } catch (error) {
      console.error('Failed to refresh analytics data:', error);
      setLastSyncError(String(error));
    }
  }, []);

  // Manual sync trigger
  const manualSync = useCallback(async () => {
    setSyncing(true);
    setLastSyncError(null);
    try {
      const result = await syncAnalyticsFromServer('/api/analytics/sync');
      if (result.success) {
        refreshData();
      } else {
        setLastSyncError(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      setLastSyncError(String(error));
    } finally {
      setSyncing(false);
    }
  }, [refreshData]);

  // Auto-sync effect
  useEffect(() => {
    // Initial load
    refreshData();

    if (!autoSync) return;

    // Set up interval for auto-sync
    const interval = setInterval(() => {
      manualSync();
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, syncInterval, refreshData, manualSync]);

  return {
    sessions,
    aggregateMetrics,
    syncStatus,
    syncing,
    lastSyncError,
    manualSync,
    refreshData,
  };
};

/**
 * Custom Hook: useSessionSnapshot
 * Snapshots current session for real-time dashboard updates
 */
export interface SessionSnapshotData {
  sessionTitle: string;
  candidateName: string;
  currentScore: number;
  confidence: number;
  eyeContact: number;
  fillerWords: number;
  wordsSpoken: number;
  speakingPace: number;
}

export const useSessionSnapshot = (data: Partial<SessionSnapshotData>, enabled = true) => {
  const [lastSnapshot, setLastSnapshot] = useState<Partial<SessionSnapshotData>>(data);

  useEffect(() => {
    if (!enabled) return;

    // Update snapshot every 5 seconds
    const interval = setInterval(() => {
      try {
        saveActiveSessionSnapshot(data);
        setLastSnapshot(data);
      } catch (error) {
        console.error('Failed to save session snapshot:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [data, enabled]);

  return lastSnapshot;
};

/**
 * Custom Hook: usePastSessions
 * Filter and query past sessions with various criteria
 */
import { getSessionsByCandidate, getSessionsByDateRange } from '@/lib/analyticsSync';

export const usePastSessions = (filterType?: 'candidate' | 'dateRange', filterValue?: any) => {
  const [filteredSessions, setFilteredSessions] = useState<AnalyticsSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    try {
      let results: AnalyticsSession[] = [];

      if (filterType === 'candidate' && filterValue) {
        results = getSessionsByCandidate(filterValue);
      } else if (filterType === 'dateRange' && filterValue?.start && filterValue?.end) {
        results = getSessionsByDateRange(filterValue.start, filterValue.end);
      } else {
        results = getAllAnalyticsSessions();
      }

      setFilteredSessions(results);
    } catch (error) {
      console.error('Failed to filter sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterValue]);

  return { sessions: filteredSessions, loading };
};
