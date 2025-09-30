# API Contract Documentation

## Backend (Serverless) — Tripo API Integration

**Version:** 1.0  
**Last Updated:** September 30, 2025  
**Provider:** Tripo API (https://api.tripo3d.ai/v2/openapi)

---

## Overview

This document specifies the serverless backend API that proxies requests to Tripo's 3D mesh generation service. The backend consists of two Vercel serverless functions that handle job creation and status polling.

**Architecture:**
- Stateless design (no database/KV storage)
- CORS-enabled for client access
- API key stored server-side only
- Job TTL enforcement (15 minutes)
- Error handling with user-friendly messages

---

## Environment Variables

All environment variables are configured in the Vercel dashboard and remain server-side only.

### Required Variables

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `TRIPO_API_BASE` | `https://api.tripo3d.ai/v2/openapi` | Tripo API base URL |
| `TRIPO_API_KEY` | `sk_live_abc123...` | Provider authentication key (secret) |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Comma-separated CORS origins |
| `MAX_IMAGE_BYTES` | `3000000` | Max image size in bytes (3MB) |
| `JOB_TTL_SECONDS` | `900` | Job timeout in seconds (15 min) |

**Security Notes:**
- Never commit these values to git
- Use Vercel's environment variable encryption
- Rotate `TRIPO_API_KEY` periodically
- Restrict `ALLOWED_ORIGINS` to your domain only

---

## Routes

### 1. POST `/api/create-mesh`

Initiates a single-image to 3D mesh generation job.

**Purpose:** Accept an image from the client, validate it, forward to Tripo API, and return a job ID for polling.

---

#### Request

**Method:** `POST`  
**Content-Type:** `application/json`

**Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
  "options": {
    "target_format": "glb",
    "quality": "fast",
    "subject_type": "object"
  }
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | string | Yes | Base64 data URL or public URL string |
| `options` | object | No | Generation parameters |
| `options.target_format` | string | No | Output format: `"glb"` (default), `"obj"` |
| `options.quality` | string | No | Speed/quality: `"fast"` (default), `"high"` |
| `options.subject_type` | string | No | Subject type: `"object"` (default), `"character"` |

**Validation Rules:**
- `image` must be a valid base64 data URL (JPEG/PNG) or public HTTPS URL
- If data URL, size after decoding must be ≤ `MAX_IMAGE_BYTES`
- `options` fields use defaults if not provided

---

#### Response (Success)

**Status:** `202 Accepted`  
**Content-Type:** `application/json`

```json
{
  "taskId": "job_8b3a2f1e",
  "status": "QUEUED",
  "etaSeconds": 60
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `taskId` | string | Unique job identifier for status polling |
| `status` | string | Initial status (always `"QUEUED"`) |
| `etaSeconds` | number | Estimated time to completion (optional) |

---

#### Response (Error)

**Status Codes:**

| Code | Meaning | Response Body |
|------|---------|---------------|
| `400` | Bad Request | `{ "error": "Missing or invalid image" }` |
| `400` | Image Too Large | `{ "error": "Image too large" }` |
| `402` | Payment Required | `{ "error": "Quota/credits exceeded" }` |
| `429` | Too Many Requests | `{ "error": "Rate limited" }` |
| `500` | Internal Server Error | `{ "error": "Provider error", "detail": "..." }` |

**Error Body Schema:**
```json
{
  "error": "string",
  "detail": "string (optional)"
}
```

---

#### Implementation Notes

**Server-side validation:**
1. Check HTTP method is POST
2. Parse JSON body safely
3. Validate `image` field exists and is string
4. If data URL, decode and check size ≤ `MAX_IMAGE_BYTES`
5. Apply rate limiting (optional, simple IP-based)

**Tripo API call:**
```typescript
const tripoResponse = await fetch(`${TRIPO_API_BASE}/jobs`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TRIPO_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image: imageData,
    params: {
      target_format: options?.target_format ?? 'glb',
      quality: options?.quality ?? 'fast',
      subject_type: options?.subject_type ?? 'object'
    }
  })
});
```

**CORS headers:**
```typescript
res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

---

### 2. GET `/api/status?id=<taskId>`

Polls job progress and retrieves the final asset when complete.

**Purpose:** Allow client to check job status and receive the mesh URL when generation succeeds.

---

#### Request

**Method:** `GET`  
**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The `taskId` returned from `/api/create-mesh` |

**Example:**
```
GET /api/status?id=job_8b3a2f1e
```

---

#### Response (Success)

**Status:** `200 OK`  
**Content-Type:** `application/json`

```json
{
  "taskId": "job_8b3a2f1e",
  "status": "SUCCEEDED",
  "progress": 1.0,
  "message": "Mesh generation complete",
  "asset": {
    "url": "https://cdn.tripo3d.ai/outputs/job_8b3a2f1e/model.glb",
    "format": "glb",
    "sizeBytes": 1837421
  },
  "error": null
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `taskId` | string | Job identifier (echoed from request) |
| `status` | string | Current status (see Status Values below) |
| `progress` | number | Completion percentage (0.0 - 1.0) |
| `message` | string | Human-readable status message (optional) |
| `asset` | object\|null | Available when status is `SUCCEEDED` |
| `asset.url` | string | CDN URL to download the mesh |
| `asset.format` | string | File format (e.g., `"glb"`, `"obj"`) |
| `asset.sizeBytes` | number | File size in bytes |
| `error` | string\|null | Error message when status is `FAILED` or `TIMEOUT` |

---

#### Status Values

| Status | Description | Terminal? | Asset Available? |
|--------|-------------|-----------|------------------|
| `QUEUED` | Job accepted, waiting to start | No | No |
| `RUNNING` | Currently processing | No | No |
| `SUCCEEDED` | Generation complete | Yes | Yes |
| `FAILED` | Generation failed | Yes | No |
| `TIMEOUT` | Exceeded server TTL | Yes | No |

**Terminal states** (stop polling): `SUCCEEDED`, `FAILED`, `TIMEOUT`

---

#### Response (Error)

**Status Codes:**

| Code | Meaning | Response Body |
|------|---------|---------------|
| `400` | Bad Request | `{ "error": "Missing or invalid id" }` |
| `404` | Not Found | `{ "error": "Unknown taskId (expired or never existed)" }` |
| `500` | Internal Server Error | `{ "error": "Provider error", "detail": "..." }` |

---

#### Implementation Notes

**Server-side logic:**
1. Check HTTP method is GET
2. Extract `id` from query parameters
3. Validate `id` is non-empty string
4. Check TTL: if job age > `JOB_TTL_SECONDS`, return `TIMEOUT` status
5. Query Tripo API for job status
6. Normalize provider response to standard schema
7. Return normalized JSON

**TTL enforcement:**
```typescript
// Pseudo-code for TTL check
const jobCreatedAt = getJobTimestamp(taskId); // Would need KV store
const ageSeconds = (Date.now() - jobCreatedAt) / 1000;

if (ageSeconds > JOB_TTL_SECONDS) {
  return {
    taskId,
    status: 'TIMEOUT',
    progress: 0,
    message: 'Job timed out',
    asset: null,
    error: 'Exceeded maximum wait time'
  };
}
```

**Note:** For fully stateless implementation without KV storage, TTL enforcement must be handled by Tripo API or omitted. The spec assumes jobs naturally time out on Tripo's side.

**Tripo API call:**
```typescript
const tripoResponse = await fetch(`${TRIPO_API_BASE}/jobs/${taskId}`, {
  headers: {
    'Authorization': `Bearer ${TRIPO_API_KEY}`
  }
});
```

**Status normalization:**
```typescript
function normalizeProviderStatus(tripoData: any): StatusResponse {
  const statusMap: Record<string, JobStatus> = {
    'queued': 'QUEUED',
    'running': 'RUNNING',
    'done': 'SUCCEEDED',
    'failed': 'FAILED'
  };
  
  const status = statusMap[tripoData.status] ?? 'RUNNING';
  
  return {
    taskId: tripoData.id,
    status,
    progress: tripoData.progress ?? (status === 'SUCCEEDED' ? 1.0 : 0.0),
    message: tripoData.message ?? defaultMessage(status),
    asset: tripoData.result?.url ? {
      url: tripoData.result.url,
      format: tripoData.result.format ?? 'glb',
      sizeBytes: tripoData.result.sizeBytes ?? null
    } : null,
    error: tripoData.error ?? null
  };
}
```

---

## State Machine

Jobs transition through states as follows:

```
QUEUED ──────→ RUNNING ──────→ SUCCEEDED
  │               │                 ↑
  │               ↓                 │
  └──────────→ FAILED ←─────────────┘
                  │
                  ↓
              TIMEOUT
```

**Transition Rules:**
- `QUEUED` → `RUNNING`: Tripo starts processing
- `RUNNING` → `SUCCEEDED`: Generation completes successfully
- `RUNNING` → `FAILED`: Generation encounters error
- Any state → `TIMEOUT`: Server enforces TTL (15 min default)

**Polling Strategy:**
- Client polls every 5 seconds initially
- After 60 seconds, increase to 8 seconds (backoff)
- Stop polling on terminal states

---

## Helper Functions

### CORS Enablement

```typescript
function enableCors(
  req: VercelRequest,
  res: VercelResponse,
  allowedOriginsCsv: string
) {
  const origin = req.headers.origin || '';
  const allowed = allowedOriginsCsv.split(',').map(s => s.trim());
  
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
  }
}
```

### Data URL Validation

```typescript
function isDataUrl(s: string): boolean {
  return /^data:image\/(png|jpe?g);base64,/.test(s);
}

function dataUrlSizeBytes(s: string): number {
  const base64Data = s.split(',')[1] || '';
  // Base64 encoding: 4 chars = 3 bytes
  return Math.floor((base64Data.length * 3) / 4);
}
```

### Rate Limiting (Optional)

```typescript
// Simple in-memory rate limiter (Vercel has stateless functions)
// Production: use Vercel KV or Upstash Redis
const requestCounts = new Map<string, number>();

async function rateLimit(req: VercelRequest): Promise<boolean> {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const key = `ratelimit:${ip}`;
  
  const count = requestCounts.get(key) || 0;
  if (count >= 10) { // 10 requests per window
    return true; // Rate limited
  }
  
  requestCounts.set(key, count + 1);
  
  // Reset after 60 seconds
  setTimeout(() => requestCounts.delete(key), 60000);
  
  return false;
}
```

### Safe JSON Parsing

```typescript
async function safeJson(req: VercelRequest): Promise<any> {
  try {
    return JSON.parse(req.body || '{}');
  } catch {
    return {};
  }
}

async function safeText(resp: Response): Promise<string> {
  try {
    return await resp.text();
  } catch {
    return 'Unknown error';
  }
}
```

---

## Error Handling Matrix

### Client Errors (4xx)

| Scenario | Status | Error Message | Client Action |
|----------|--------|---------------|---------------|
| Missing image field | 400 | "Missing or invalid image" | Show error, allow retry |
| Image too large | 400 | "Image too large" | Show size limit, allow resize |
| Invalid taskId | 400 | "Missing or invalid id" | Show error, restart flow |
| Unknown taskId | 404 | "Unknown taskId" | Treat as expired, allow retry |
| Rate limited | 429 | "Rate limited" | Show cooldown message |
| Credits exhausted | 402 | "Quota/credits exceeded" | Show upgrade message |

### Server Errors (5xx)

| Scenario | Status | Error Message | Client Action |
|----------|--------|---------------|---------------|
| Tripo API down | 500 | "Provider error" | Retry with backoff |
| Network timeout | 500 | "Request timeout" | Retry with backoff |
| Malformed response | 500 | "Invalid response" | Show generic error |

### Timeout Behavior

When a job exceeds `JOB_TTL_SECONDS`:
```json
{
  "taskId": "job_xyz",
  "status": "TIMEOUT",
  "progress": 0.0,
  "message": "Job timed out after 15 minutes",
  "asset": null,
  "error": "Exceeded maximum wait time"
}
```

Client should:
1. Stop polling
2. Display timeout message
3. Offer "Try Again" button
4. Point cloud remains usable

---

## Performance Considerations

### Response Time Targets

| Endpoint | Target | Notes |
|----------|--------|-------|
| POST `/api/create-mesh` | <1s | Proxy call to Tripo |
| GET `/api/status` | <500ms | Simple status check |

### Optimization Strategies

1. **Connection pooling:** Reuse HTTPS connections to Tripo API
2. **Compression:** Enable gzip for JSON responses
3. **Caching headers:** Cache-Control for status responses (short TTL)
4. **Timeout handling:** Set 30s timeout for Tripo API calls
5. **Parallel requests:** Client can poll status while user interacts with point cloud

---

## Security Best Practices

### Authentication

- API key (`TRIPO_API_KEY`) stored in Vercel environment variables only
- Never exposed to client
- Rotated periodically (quarterly recommended)

### Input Sanitization

- Validate all user inputs before forwarding
- Reject non-image data URLs
- Limit request body size (10MB max)
- Strip EXIF data if processing locally

### CORS Policy

- Whitelist specific origins only (no wildcards in production)
- Include `Vary: Origin` header for proper caching
- Handle preflight requests correctly

### Rate Limiting

- Implement IP-based rate limiting (10 req/min suggested)
- Consider user session-based limits if auth added
- Return `429` with `Retry-After` header

---

## Monitoring & Logging

### Recommended Logs

**Per Request:**
- Timestamp
- Request ID (generated UUID)
- Endpoint
- HTTP method and status
- Response time
- Error details (if any)

**Example Log Entry:**
```json
{
  "timestamp": "2025-09-30T14:23:45.123Z",
  "requestId": "req_abc123",
  "endpoint": "/api/create-mesh",
  "method": "POST",
  "status": 202,
  "responseTime": 847,
  "tripoTaskId": "job_8b3a2f1e"
}
```

### Alerts to Configure

- Error rate > 5% over 5 minutes
- Response time p95 > 3 seconds
- Tripo API returning 402 (credits exhausted)
- Unusual spike in 429 rate limits

---

## Testing Checklist

### Unit Tests

- [ ] CORS headers set correctly
- [ ] Data URL size calculation accurate
- [ ] Status normalization handles all Tripo response formats
- [ ] Error messages are user-friendly

### Integration Tests

- [ ] POST `/api/create-mesh` returns valid taskId
- [ ] GET `/api/status` returns correct status progression
- [ ] Invalid image rejected with 400
- [ ] Unknown taskId returns 404
- [ ] Rate limiting triggers on burst requests

### Manual Tests

- [ ] Upload and track a successful job end-to-end
- [ ] Test with oversized image (>3MB)
- [ ] Test with invalid image format (e.g., GIF)
- [ ] Test with malformed JSON body
- [ ] Test CORS from allowed origin
- [ ] Test CORS from disallowed origin (should block)
- [ ] Verify API key not exposed in Network tab

---

## Example Request/Response Flows

### Happy Path: Successful Generation

**1. Create Job:**
```http
POST /api/create-mesh HTTP/1.1
Host: your-app.vercel.app
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "options": { "target_format": "glb", "quality": "fast" }
}
```

**Response:**
```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "taskId": "job_abc123",
  "status": "QUEUED",
  "etaSeconds": 60
}
```

**2. Poll Status (Queued):**
```http
GET /api/status?id=job_abc123 HTTP/1.1
Host: your-app.vercel.app
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "taskId": "job_abc123",
  "status": "QUEUED",
  "progress": 0.0,
  "message": "Job in queue",
  "asset": null,
  "error": null
}
```

**3. Poll Status (Running):**
```http
GET /api/status?id=job_abc123 HTTP/1.1
Host: your-app.vercel.app
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "taskId": "job_abc123",
  "status": "RUNNING",
  "progress": 0.45,
  "message": "Generating mesh...",
  "asset": null,
  "error": null
}
```

**4. Poll Status (Succeeded):**
```http
GET /api/status?id=job_abc123 HTTP/1.1
Host: your-app.vercel.app
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "taskId": "job_abc123",
  "status": "SUCCEEDED",
  "progress": 1.0,
  "message": "Mesh generation complete",
  "asset": {
    "url": "https://cdn.tripo3d.ai/outputs/job_abc123/model.glb",
    "format": "glb",
    "sizeBytes": 1837421
  },
  "error": null
}
```

---

### Error Path: Image Too Large

**Request:**
```http
POST /api/create-mesh HTTP/1.1
Host: your-app.vercel.app
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,... (5MB encoded)",
  "options": {}
}
```

**Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Image too large",
  "detail": "Maximum size is 3MB"
}
```

---

### Error Path: Job Failed

**Request:**
```http
GET /api/status?id=job_xyz789 HTTP/1.1
Host: your-app.vercel.app
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "taskId": "job_xyz789",
  "status": "FAILED",
  "progress": 0.6,
  "message": "Generation failed",
  "asset": null,
  "error": "Unable to extract 3D structure from image"
}
```

---

## Deployment Verification

After deploying, verify:

1. **Environment variables set:**
   ```bash
   vercel env ls
   ```

2. **Endpoints accessible:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/create-mesh \
     -H "Content-Type: application/json" \
     -d '{"image":"data:image/jpeg;base64,..."}'
   ```

3. **CORS working:**
   - Open browser console on your app
   - Check Network tab shows CORS headers
   - Verify no CORS errors

4. **API key protected:**
   - View source in browser
   - Search for "TRIPO_API_KEY" (should not appear)
   - Check Network tab request headers (should not contain key)

---

## Maintenance & Updates

### When to Update This API

- Tripo changes request/response format
- Add new generation options (e.g., texture quality)
- Implement job persistence (KV storage)
- Add authentication/user accounts
- Support additional providers (Meshy, InstantMesh)

### Versioning Strategy

If breaking changes needed:
- Create `/api/v2/create-mesh` and `/api/v2/status`
- Maintain v1 for 30 days
- Update client to use v2
- Deprecate and remove v1

---

**Document Status:** Implementation ready  
**Estimated Implementation Time:** 2-3 hours for both endpoints  
**Dependencies:** Vercel account, Tripo API key, CORS configuration