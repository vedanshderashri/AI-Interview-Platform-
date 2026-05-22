/**
 * API Response Caching System
 * Implements request deduplication, response caching, and quota management
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  hits: number;
}

interface QuotaTracker {
  requestCount: number;
  tokenCount: number;
  resetTime: number;
  lastRequestTime: number;
}

const responseCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();
const quotaTracker: QuotaTracker = {
  requestCount: 0,
  tokenCount: 0,
  resetTime: Date.now() + 60000, // Reset every minute
  lastRequestTime: 0,
};

// Config for different endpoints
const CACHE_CONFIG: Record<string, { ttl: number; maxSize: number }> = {
  analyze: { ttl: 3600000, maxSize: 50 }, // 1 hour for interview analysis
  'ai-coach': { ttl: 1800000, maxSize: 30 }, // 30 minutes for coaching
  'interview-ai': { ttl: 900000, maxSize: 20 }, // 15 minutes for interview questions
};

// Rate limiting config (free tier)
const RATE_LIMIT_CONFIG = {
  requestsPerMinute: 15,
  tokensPerMinute: 30000,
  requestsPerDay: 1000,
};

/**
 * Generate cache key from request data
 */
function generateCacheKey(endpoint: string, data: any): string {
  const hash = JSON.stringify(data);
  return `${endpoint}:${hash}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry<any>): boolean {
  return Date.now() - entry.timestamp < entry.ttl;
}

/**
 * Get from cache or return null if expired/missing
 */
export function getFromCache<T>(endpoint: string, data: any): T | null {
  const key = generateCacheKey(endpoint, data);
  const entry = responseCache.get(key);

  if (!entry) return null;

  if (!isCacheValid(entry)) {
    responseCache.delete(key);
    return null;
  }

  // Update hit count for analytics
  entry.hits++;
  console.log(`[Cache Hit] ${key} (${entry.hits} hits)`);
  return entry.data as T;
}

/**
 * Save to cache
 */
export function saveToCache<T>(endpoint: string, data: any, response: T): void {
  const key = generateCacheKey(endpoint, data);
  const config = CACHE_CONFIG[endpoint] || { ttl: 1800000, maxSize: 20 };

  // Enforce max cache size
  if (responseCache.size >= config.maxSize) {
    // Remove least recently used (first entry)
    const firstKey = responseCache.keys().next().value;
    if (firstKey !== undefined) {
      responseCache.delete(firstKey);
    }
  }

  responseCache.set(key, {
    data: response,
    timestamp: Date.now(),
    ttl: config.ttl,
    hits: 0,
  });

  console.log(`[Cache Stored] ${key}`);
}

/**
 * Check if request is already in flight (deduplication)
 */
export function getInFlightRequest(endpoint: string, data: any): Promise<any> | null {
  const key = generateCacheKey(endpoint, data);
  return inFlightRequests.get(key) || null;
}

/**
 * Register in-flight request
 */
export function registerInFlightRequest(
  endpoint: string,
  data: any,
  promise: Promise<any>
): void {
  const key = generateCacheKey(endpoint, data);
  inFlightRequests.set(key, promise);

  // Auto-cleanup after request completes
  promise
    .finally(() => {
      inFlightRequests.delete(key);
    })
    .catch(() => {}); // Silently handle rejection cleanup
}

/**
 * Check quota status
 */
export function checkQuotaStatus(): {
  canProceed: boolean;
  requestsRemaining: number;
  estimatedResetTime: number;
  reason?: string;
} {
  const now = Date.now();

  // Reset counters if minute has passed
  if (now > quotaTracker.resetTime) {
    quotaTracker.requestCount = 0;
    quotaTracker.tokenCount = 0;
    quotaTracker.resetTime = now + 60000;
  }

  const requestsRemaining = RATE_LIMIT_CONFIG.requestsPerMinute - quotaTracker.requestCount;
  const tokensRemaining = RATE_LIMIT_CONFIG.tokensPerMinute - quotaTracker.tokenCount;

  if (requestsRemaining <= 0) {
    return {
      canProceed: false,
      requestsRemaining: 0,
      estimatedResetTime: quotaTracker.resetTime,
      reason: 'Request quota exceeded for this minute',
    };
  }

  if (tokensRemaining <= 0) {
    return {
      canProceed: false,
      requestsRemaining,
      estimatedResetTime: quotaTracker.resetTime,
      reason: 'Token quota exceeded for this minute',
    };
  }

  return {
    canProceed: true,
    requestsRemaining,
    estimatedResetTime: quotaTracker.resetTime,
  };
}

/**
 * Track API request for quota management
 */
export function trackApiRequest(estimatedTokens: number = 0): void {
  quotaTracker.requestCount++;
  quotaTracker.tokenCount += estimatedTokens;
  quotaTracker.lastRequestTime = Date.now();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  let totalHits = 0;
  let totalEntries = 0;

  for (const entry of responseCache.values()) {
    totalHits += entry.hits;
    totalEntries++;
  }

  return {
    cacheSize: responseCache.size,
    totalHits,
    averageHitsPerEntry: totalEntries > 0 ? (totalHits / totalEntries).toFixed(2) : 0,
    quotaStatus: checkQuotaStatus(),
  };
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): number {
  let cleared = 0;
  const now = Date.now();

  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      responseCache.delete(key);
      cleared++;
    }
  }

  if (cleared > 0) {
    console.log(`[Cache Cleanup] Cleared ${cleared} expired entries`);
  }

  return cleared;
}

/**
 * Clear all cache (useful for testing/debugging)
 */
export function clearAllCache(): void {
  responseCache.clear();
  inFlightRequests.clear();
  console.log('[Cache] All cache cleared');
}

/**
 * Get cache info for debugging
 */
export function getCacheInfo() {
  const entries = Array.from(responseCache.entries()).map(([key, entry]) => ({
    key,
    age: Date.now() - entry.timestamp,
    ttl: entry.ttl,
    hits: entry.hits,
    valid: isCacheValid(entry),
  }));

  return {
    entries,
    totalSize: responseCache.size,
    inFlightRequests: inFlightRequests.size,
  };
}
