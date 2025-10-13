# API Cost Reduction - Caching System

This document explains the multi-layer caching system designed to minimize API costs during testing and production.

## Overview

The caching system prevents duplicate API calls by storing 3D model results based on image content. If you upload the same image twice, the cached result is used instantly without calling the Tripo API.

## Features

✅ **Client-Side Cache** - Uses browser localStorage, works instantly
✅ **Server-Side Cache** - In-memory cache shared across all users
✅ **Mock API Mode** - Zero API calls for UI/UX testing
✅ **Content-Based Hashing** - SHA-256 ensures identical images are detected
✅ **7-Day TTL** - Automatic cache expiration

## How It Works

### 1. Client-Side Caching

**Location:** `src/utils/imageCache.ts`

When you upload an image:
1. Generate SHA-256 hash from image data
2. Check localStorage for cached result
3. If found: Use cached taskId and modelUrl (instant!)
4. If not found: Call API and cache the result

**Storage:** Browser localStorage (per-user, per-browser)
**Persistence:** Survives page refreshes, lost on browser clear
**Capacity:** ~5-10MB typical browser limit

**Example:**
```typescript
// Check cache before API call
const imageHash = await hashImageData(dataUrl);
const cached = getCachedResult(imageHash);

if (cached) {
  // Instant result, no API call!
  setTaskId(cached.taskId);
  setModelUrl(cached.modelUrl);
}
```

### 2. Server-Side Caching

**Location:** `api/_shared.ts`

Server checks for cached results by image hash:
1. Client sends `imageHash` with upload request
2. Server checks in-memory cache
3. If found: Return existing taskId (no Tripo API call!)
4. If not found: Call Tripo API, cache result when complete

**Storage:** In-memory on Vercel serverless function
**Persistence:** Lost on function cold start (~15 minutes idle)
**Sharing:** Shared across ALL users (massive savings!)

**Benefits:**
- If User A uploads an image, User B gets instant results for the same image
- Perfect for demo/testing with sample images
- Reduces API costs by 90%+ during development

### 3. Mock API Mode

**Location:** `api/create-mesh.ts`, `api/status.ts`

For UI/UX testing without any API calls:

**Enable in `.env`:**
```bash
MOCK_API_RESPONSES=true
```

**What it does:**
- Returns fake taskId instantly
- Status endpoint returns sample cube model
- No Tripo API calls at all
- Still tests credit limits and UI flow

**Perfect for:**
- Frontend development
- UI/UX iteration
- Testing error states
- Demo environments

## Configuration

### Environment Variables

```bash
# Mock Mode - Zero API calls
MOCK_API_RESPONSES=false

# Bypass credit limits (dev only)
DEV_MODE_BYPASS_LIMITS=false

# Cache TTL (future: Vercel KV)
# CACHE_TTL_DAYS=7
```

### Client-Side Cache Management

```typescript
import { clearCache, getCacheStats } from '@/utils/imageCache';

// Get cache stats
const stats = getCacheStats();
console.log(`Cached: ${stats.count} models, ${stats.totalSizeKB}KB`);

// Clear all cached results
clearCache();
```

## Testing the Cache

### Test 1: Upload Same Image Twice

1. Upload an image → waits for API response
2. Upload the **exact same image** again → instant result!

**Expected logs:**
```
🔍 [APP] Checking cache for uploaded image...
⚡ [APP] Using cached result! Saved API call.
```

### Test 2: Server-Side Cache

1. User A uploads image → API call made
2. User B uploads **same image** → cached result, no API call!

**Expected logs:**
```
⚡ [SERVER-CACHE] Returning cached taskId! Saved API call.
```

### Test 3: Mock Mode

1. Set `MOCK_API_RESPONSES=true`
2. Upload any image → instant fake cube model
3. Check console for:

```
🎭 [MOCK MODE] Returning fake taskId without calling API
```

## Cost Savings Calculation

### Without Caching
- 10 test uploads × $0.10 = **$1.00**

### With Client Cache
- First upload: $0.10 (API call)
- Next 9 uploads: $0.00 (cached)
- **Total: $0.10** (90% savings!)

### With Server Cache (Shared)
- User A uploads 10 different images: $1.00
- User B uploads same 10 images: $0.00 (all cached!)
- **Total: $1.00** (50% savings across users!)

### With Mock Mode
- 100 test uploads: **$0.00** (100% savings!)

## Cache Architecture

```
┌─────────────┐
│   Browser   │
│             │
│ ┌─────────┐ │
│ │localStorage│ Client-Side Cache
│ │  (User)  │ │  • 7 day TTL
│ └─────────┘ │  • Per browser
└──────┬──────┘  • Instant lookup
       │
       │ Upload (with imageHash)
       ▼
┌─────────────┐
│   Server    │
│             │
│ ┌─────────┐ │
│ │ Memory  │ │ Server-Side Cache
│ │ (Shared)│ │  • 7 day TTL
│ └─────────┘ │  • All users
└──────┬──────┘  • Shared results
       │
       │ If not cached
       ▼
┌─────────────┐
│  Tripo API  │  $$$ Costs money
└─────────────┘
```

## Best Practices

### During Development

1. **Enable Mock Mode** for UI work:
   ```bash
   MOCK_API_RESPONSES=true
   ```

2. **Use DEV_MODE_BYPASS_LIMITS** to skip credit checks:
   ```bash
   DEV_MODE_BYPASS_LIMITS=true
   ```

3. **Test with same image** to verify caching works

### Before Production

1. **Disable Mock Mode:**
   ```bash
   MOCK_API_RESPONSES=false
   ```

2. **Disable Bypass Limits:**
   ```bash
   DEV_MODE_BYPASS_LIMITS=false
   ```

3. **Keep Caching Enabled** (it's always beneficial!)

## Future Enhancements

### Vercel KV Integration (Optional)

For persistent server-side caching:

```bash
# Add to .env
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
ENABLE_SERVER_CACHE=true
```

**Benefits:**
- Cache survives serverless function restarts
- Permanent storage (until TTL)
- Shared across all deployments

**Cost:** ~$0.50/month for hobby tier

## Troubleshooting

### Cache Not Working?

**Check these:**
1. Image hash is being generated (check console logs)
2. localStorage is enabled in browser
3. Same exact image file (even 1 pixel difference = different hash)

**Clear cache:**
```javascript
localStorage.clear();
// or use clearCache() utility
```

### Mock Mode Not Working?

1. Check `.env` file exists and has `MOCK_API_RESPONSES=true`
2. Restart dev server after changing .env
3. Check console for "🎭 [MOCK MODE]" messages

### Server Cache Not Persisting?

- In-memory cache resets on Vercel function cold start (~15 min idle)
- This is normal for free tier
- Upgrade to Vercel KV for persistence

## Monitoring

### Check Cache Performance

```typescript
// Client-side
const stats = getCacheStats();
console.log('Client cache:', stats);

// Server-side (add to status endpoint)
GET /api/cache-stats
```

### Expected Hit Rates

- **Development:** 80-90% (same test images)
- **Production:** 20-40% (user-submitted images)

## Summary

The caching system provides three layers of cost protection:

1. **Client Cache** - Instant, per-user, survives refreshes
2. **Server Cache** - Shared, all users, saves 90%+ API costs
3. **Mock Mode** - Zero API calls, perfect for UI work

**Result:** Minimal API costs during testing, significant savings in production! 🎉
