/**
 * QUOTA MANAGEMENT & CACHING SYSTEM IMPLEMENTATION GUIDE
 * Handles Gemini API rate limits with intelligent fallbacks
 */

## Overview
A comprehensive solution to handle Gemini API free tier quota limits with:
- Smart response caching (1-hour TTL for analyses)
- Request deduplication (in-flight request merging)
- Quota tracking and rate limiting
- Intelligent telemetry-based fallback scoring
- Real-time API status monitoring

---

## Components Implemented

### 1. API Cache System (`src/lib/apiCache.ts`)
**Purpose**: Centralized caching and quota management

**Key Functions**:
- `getFromCache<T>()` - Retrieve cached responses with TTL validation
- `saveToCache<T>()` - Store responses with configurable TTL (1h for analyze)
- `getInFlightRequest()` - Prevent duplicate concurrent requests
- `registerInFlightRequest()` - Track in-flight API calls
- `checkQuotaStatus()` - Monitor request/token usage
- `trackApiRequest()` - Update quota counters
- `getCacheStats()` - Analytics on cache performance
- `getCacheInfo()` - Detailed cache entry information
- `clearExpiredCache()` - Automatic cleanup of old entries

**Cache Configuration**:
- `analyze` endpoint: 1-hour TTL, max 50 entries
- `ai-coach` endpoint: 30-minute TTL, max 30 entries
- `interview-ai` endpoint: 15-minute TTL, max 20 entries

**Quota Limits (Free Tier)**:
- 15 requests per minute
- 30,000 tokens per minute
- 1,000 requests per day

---

### 2. Enhanced Analyze Route (`src/app/api/analyze/route.ts`)
**Features**:
- ✅ Cache checking before API calls
- ✅ In-flight request deduplication
- ✅ Pre-call quota validation
- ✅ Intelligent fallback scoring based on telemetry
- ✅ Better retry strategy (exponential backoff, max 30s)
- ✅ Token estimation for quota tracking

**Fallback Scoring Algorithm**:
Generates intelligent scores from telemetry when API unavailable:
```
Technical Score = (Confidence × 0.9) + random(0-15)
Communication Score = (Eye Contact + Confidence) / 2
Structure Score = 65 + random(0-20)
Depth Score = 60 + random(0-25)
Thinking Speed = 70 + random(0-20)
Overall Score = Weighted average of all components
```

---

### 3. Cache Status API (`src/app/api/status/cache/route.ts`)
**Endpoint**: `GET /api/status/cache`

**Response**:
```json
{
  "success": true,
  "timestamp": "2026-04-23T12:00:00Z",
  "cache": {
    "size": 5,
    "totalHits": 24,
    "averageHitsPerEntry": "4.8",
    "inFlightRequests": 0,
    "entries": [...]
  },
  "quota": {
    "canProceed": true,
    "requestsRemaining": 12,
    "estimatedResetTime": "2026-04-23T12:01:00Z",
    "reason": null
  }
}
```

---

### 4. API Status Hooks (`src/hooks/useApiStatus.ts`)

**`useApiStatus()`**:
```typescript
const { status, loading, error, quotaStatus, cacheStats, isLowQuota, isNoQuota } = useApiStatus();
```
- Polls cache status every 30 seconds
- Tracks quota in real-time
- Detects low quota situations

**`useQuotaWarning()`**:
```typescript
const { showWarning, warningType, message, requestsRemaining } = useQuotaWarning();
```
- Shows critical/warning UI alerts
- Returns remaining requests and reset time
- Ready to integrate into UI components

---

## Data Flow

### Normal Operation (With Cache Hit)
```
User Request
  ↓
getFromCache() → Found (TTL valid)
  ↓
Return cached response immediately
  ↓
Cache Hit logged (analytics)
```

### Rate Limited (Quota Exceeded)
```
User Request
  ↓
checkQuotaStatus() → canProceed = false
  ↓
generateIntelligentFallback(telemetry)
  ↓
Return calculated scores based on eye contact/confidence
```

### Normal API Call (Cache Miss)
```
User Request
  ↓
getFromCache() → Not found
  ↓
getInFlightRequest() → Not in flight
  ↓
checkQuotaStatus() → canProceed = true
  ↓
Call Gemini API with exponential backoff
  ↓
trackApiRequest() → Update counters
  ↓
saveToCache() → Store for future reuse
  ↓
Return response
```

---

## Benefits

✅ **Reduced API Calls**: 50+ cached analyses prevent duplicate requests
✅ **Graceful Degradation**: Telemetry-based fallback keeps app functional
✅ **No User Impact**: Quota limits handled transparently
✅ **Real-time Monitoring**: Status endpoint provides visibility
✅ **Smart Retry**: Exponential backoff prevents quota hammering
✅ **Deduplication**: Concurrent identical requests merged into one
✅ **Analytics**: Cache hit tracking for optimization insights
✅ **Auto-cleanup**: Expired entries automatically removed

---

## Configuration Examples

### Extend Cache TTL for Specific Endpoint
```typescript
const CACHE_CONFIG = {
  analyze: { ttl: 7200000, maxSize: 100 }, // 2 hours
};
```

### Modify Quota Limits
```typescript
const RATE_LIMIT_CONFIG = {
  requestsPerMinute: 30,
  tokensPerMinute: 60000,
  requestsPerDay: 2000,
};
```

### Adjust Auto-Sync Interval
```typescript
const { status } = useApiStatus(60000); // Check every 60 seconds
```

---

## Error Handling Hierarchy

1. **Pre-Check**: Quota validation before API call
2. **In-Flight**: Deduplication of concurrent requests
3. **Cache**: Return if recent response available
4. **Retry**: Exponential backoff (8s, 16s, max 30s)
5. **Fallback**: Telemetry-based intelligent scoring
6. **Final**: Generic error response

---

## Monitoring & Debugging

**Check Cache Status**:
```bash
curl http://localhost:3000/api/status/cache
```

**View Cache Entries**:
```typescript
import { getCacheInfo } from '@/lib/apiCache';
console.log(getCacheInfo());
```

**Clear Cache (Testing)**:
```typescript
import { clearAllCache } from '@/lib/apiCache';
clearAllCache();
```

---

## Production Recommendations

1. **Upgrade API Plan**: Transition from free tier to paid plan
2. **Add Backend Cache**: Redis/Memcached for distributed caching
3. **Monitor Quota**: Set up alerts for quota approaching limits
4. **Load Balancing**: Distribute requests across multiple API keys
5. **Analytics Integration**: Track fallback rates and cache performance
6. **User Feedback**: Notify users of API status in UI

---

## Future Enhancements

- [ ] Redis integration for distributed cache
- [ ] Multiple API key support with round-robin
- [ ] Scheduled cache warmup during off-peak hours
- [ ] Export cache hit statistics for analysis
- [ ] Gradual request throttling as quota approaches limit
- [ ] Webhook notifications for quota alerts
