/**
 * Custom Hook: useApiStatus
 * Monitor API quota and cache status in real-time
 */

import { useEffect, useState, useCallback } from 'react';

export interface ApiStatusInfo {
  cache: {
    size: number;
    totalHits: number;
    averageHitsPerEntry: string;
    inFlightRequests: number;
  };
  quota: {
    canProceed: boolean;
    requestsRemaining: number;
    estimatedResetTime: string;
    reason?: string;
  };
  timestamp: string;
}

export const useApiStatus = (pollInterval = 30000) => {
  const [status, setStatus] = useState<ApiStatusInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/status/cache');
      if (!response.ok) throw new Error('Failed to fetch API status');
      
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('API status fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, pollInterval]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
    quotaStatus: status?.quota,
    cacheStats: status?.cache,
    isLowQuota: status ? status.quota.requestsRemaining < 5 : false,
    isNoQuota: status ? !status.quota.canProceed : false,
  };
};

/**
 * Hook for displaying quota warning in UI
 */
export const useQuotaWarning = () => {
  const { quotaStatus, isLowQuota, isNoQuota } = useApiStatus(30000);

  return {
    showWarning: isLowQuota || isNoQuota,
    warningType: isNoQuota ? 'critical' : isLowQuota ? 'warning' : null,
    message: isNoQuota
      ? `API quota exceeded: ${quotaStatus?.reason}. Service will resume at ${new Date(quotaStatus?.estimatedResetTime || '').toLocaleTimeString()}`
      : isLowQuota
      ? `⚠️ Low API quota: ${quotaStatus?.requestsRemaining} requests remaining`
      : null,
    requestsRemaining: quotaStatus?.requestsRemaining || 0,
    resetTime: quotaStatus?.estimatedResetTime,
  };
};
