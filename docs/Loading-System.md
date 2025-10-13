# Feature Addendum: Transparent Loading System (v4.0)

## Context
This feature defines a **multi-stage, transparent loading experience** for users uploading photos for 3D generation using Tripo3D.
It ensures that users understand each stage of processing (e.g., uploading, queueing, depth estimation, texturing) through clear visual feedback.

It directly connects to the APIs implemented in `/api/create-mesh.ts` and `/api/status.ts` and is rendered through the React frontend (`ProcessingScreen.tsx` + `useMeshJob.ts`).

---

## 1. Feature Overview

**Feature Name:** Transparent Multi-Stage Loading System
**Goal:** Increase user trust and perceived speed by exposing detailed generation stages and progress segments.
**Primary Interaction:** Display stage-by-stage progress UI from upload → ready state.

This system simulates sub-stage progress (depth estimation, reconstruction, etc.) based on API feedback and interpolated timing windows to provide clear feedback during the generation process.

---

## 2. Problem Statement

The current MVP presents a generic "Generating Mesh" loader with minimal transparency, causing users to:

- Misinterpret delays as failure.
- Leave before generation completes.
- Lack understanding of backend process complexity.

**Goal:** Introduce a visible, educational progress experience that makes the generation process transparent without increasing perceived wait time.

---

## 3. Technical Summary

| Layer | Implementation | Description |
|-------|----------------|--------------|
| **Frontend** | React + TypeScript (`ProcessingScreen.tsx`, `useMeshJob.ts`) | State machine-driven progress UI showing generation stages. |
| **Backend** | Vercel Node Functions (`/api/create-mesh.ts`, `/api/status.ts`) | Orchestrates Tripo3D jobs, normalizes job states, and reports progress. |
| **External APIs** | Tripo3D API | Used for mesh creation and status polling. |
| **Config** | `src/config.ts` | Centralized simulated phase durations and polling intervals. |

---

## 4. API Endpoints Involved

### 4.1 `/api/create-mesh`

**Purpose:** Create a new mesh generation job using Tripo3D.
**Flow:**
- Accepts base64-encoded image (≤ 50 MB).
- Submits job to **Tripo3D**.
- Returns a job identifier and initial metadata.

**Request:**
```json
POST /api/create-mesh
{
  "image": "<base64 string>",
  "options": {
    "quality": "high" | "preview"
  }
}
```

**Response:**
```json
{
  "taskId": "abc123",
  "status": "QUEUED",
  "etaSeconds": 60
}
```

---

### 4.2 `/api/status`

**Purpose:** Polls Tripo job status, normalizing returned progress.
**Flow:**
- Returns normalized job object with status and progress (0–1).
- Provides asset URL when generation is complete.

**Request:**
```http
GET /api/status?id=abc123
```

**Response:**
```json
{
  "taskId": "abc123",
  "status": "RUNNING",
  "progress": 0.42,
  "message": "Generating mesh... 42%",
  "asset": null,
  "error": null
}
```

**When complete:**
```json
{
  "taskId": "abc123",
  "status": "SUCCEEDED",
  "progress": 1.0,
  "message": "Mesh generation complete",
  "asset": {
    "url": "https://tripo-data.rg1.data.tripo3d.com/...",
    "format": "glb",
    "sizeBytes": 0
  },
  "error": null
}
```

---

## 5. Frontend System Architecture

### Key Components

| Component | Path | Role |
|------------|------|------|
| `useMeshJob.ts` | `src/hooks/useMeshJob.ts` | Central state hook for managing job lifecycle, polling `/api/status`, and exposing progress data to UI. |
| `ProcessingScreen.tsx` | `src/screens/ProcessingScreen.tsx` | Visual representation of job states, progress bar, countdown timer, and engine indicator. |
| `config.ts` | `src/config.ts` | Holds constants for fallback timing and phase durations. |

### Hook Structure
```ts
export type Phase =
  | 'uploading'
  | 'queued'
  | 'preprocessing'
  | 'depth'
  | 'reconstruction'
  | 'texturing'
  | 'compiling'
  | 'finalizing'
  | 'ready'
  | 'error';
```

### Hook Behavior
- Begins polling on job start.
- Initializes `Queued` phase immediately after `/api/create-mesh`.
- Smoothly transitions phases for realism (using `phaseDurationsMs`).
- Provides progress updates based on API responses.

---

## 6. UI/UX Design Specification

### UI State Breakdown

| **State / UI Label** | **Supporting Line (5–8 words)** |
|-----------------------|--------------------------------|
| **Uploading** | Optimizing and encoding image data for processing |
| **Queued** | Awaiting processing slot in generation queue |
| **Preprocessing** | Normalizing color and lighting data |
| **Depth Estimation** | Generating surface map from single photo |
| **Mesh Reconstruction** | Converting depth map into 3D geometry |
| **Texturing** | Projecting image colors onto 3D surface |
| **Compiling** | Compressing and optimizing mesh for export |
| **Finalizing** | Validating file integrity and upload success |
| **Ready** | 3D preview available |

### Visual Design Notes
- **9-segment progress bar:** Each stage corresponds to one segment. Filled segments = completed stages; active stage pulses subtly.
- **Status message:** Shows current progress percentage and stage description until the status is completed, then lose the description.

---

## 7. Configurations

In `src/config.ts`:
```ts
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  maxImageBytes: 10 * 1024 * 1024,
  maxImageDimension: 1024,
  pollIntervalMs: 5000,

  // Simulated loading configuration
  // Always show 8-second loading animation regardless of cache/API speed
  totalLoadingDurationMs: 8000,

  // Phase timings (in milliseconds from start)
  // These define when each phase should appear during the 8-second window
  phaseTimings: {
    uploading: 0,        // 0s - 0.5s (6.25%)
    queued: 500,         // 0.5s - 1.5s (12.5%)
    preprocessing: 1500, // 1.5s - 2.5s (18.75%)
    depth: 2500,         // 2.5s - 4s (31.25%)
    reconstruction: 4000,// 4s - 5.5s (56.25%)
    texturing: 5500,     // 5.5s - 6.5s (75%)
    compiling: 6500,     // 6.5s - 7.5s (87.5%)
    finalizing: 7500,    // 7.5s - 8s (96.875%)
  },
};
```

### Key Configuration Notes:
- **Total Duration**: Fixed at 8 seconds for all uploads
- **Consistent Experience**: Both cached and new uploads show the same loading animation
- **Phase Distribution**: Phases are distributed evenly across the 8-second window
- **API Independence**: The loading animation runs independently of actual API response time

---

## 8. Technical Flow Summary

### Standard Flow (New Upload)
```
[User Uploads Photo]
        ↓
Local Resize (imageResize.ts)
        ↓
Check client-side cache (imageCache.ts)
        ↓
POST /api/create-mesh → Tripo3D job created
        ↓
Frontend starts 8-second simulated loading
        ↓
Polling /api/status every 5s in background
        ↓
Frontend cycles through phase states (0.5s - 1.5s per phase)
        ↓
Progress bar fills linearly over 8 seconds
        ↓
GET /api/status → {status: 'SUCCEEDED', asset: {...}}
        ↓
After 8 seconds complete, transition to viewer
        ↓
Viewer opens → Download/Share options
```

### Cached Flow (Previously Generated)
```
[User Uploads Same Photo]
        ↓
Local Resize (imageResize.ts)
        ↓
Check client-side cache → HIT!
        ↓
Frontend starts 8-second simulated loading (no API call)
        ↓
Frontend cycles through phase states (same timing as new upload)
        ↓
Progress bar fills linearly over 8 seconds
        ↓
After 8 seconds complete, transition to viewer with cached model
        ↓
Viewer opens → Download/Share options
```

### Key Implementation Details:
- **Simulated Progress**: The `useMeshJob` hook runs a 50ms interval timer that updates progress linearly from 0% to 100% over 8 seconds
- **Phase Transitions**: Phases change at predefined timestamps (0.5s, 1.5s, 2.5s, etc.) regardless of actual API state
- **API Polling**: Runs in parallel with the simulation, but results are only shown after the 8-second animation completes
- **Cached Results**: Skip API polling entirely but still show the full 8-second loading animation for consistency
- **Error Handling**: Errors (FAILED, TIMEOUT) bypass the simulation and display immediately
- **No Countdown**: The UI shows natural loading progression without displaying a countdown timer - users just see the phases progressing naturally

