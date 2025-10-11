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
| **Ready** | 3D preview available · tap to view |

### Visual Design Notes
- **9-segment progress bar:** Each stage corresponds to one segment. Filled segments = completed stages; active stage pulses subtly.
- **Top header:** Current stage title.
- **Footer:** Cancel / Retry buttons.
- **Status message:** Shows current progress percentage and stage description.

---

## 7. Configurations

In `src/config.ts`:
```ts
export const pollIntervalMs = 5000;

export const phaseDurationsMs = {
  preprocessing: 3000,
  depth: 5000,
  reconstruction: 6000,
  texturing: 5000,
  compiling: 3000,
  finalizing: 2000,
};
```

---

## 8. Technical Flow Summary

```
[User Uploads Photo]
        ↓
Local Resize (imageResize.ts)
        ↓
POST /api/create-mesh → Tripo3D job created
        ↓
Frontend enters `Queued` state
        ↓
Polling /api/status every 5s
        ↓
Frontend cycles through phase states
        ↓
GET /api/status → {status: 'SUCCEEDED', asset: {...}}
        ↓
Viewer opens → Download/Share options
```

---

## 9. Dependencies & Integrations

| Dependency | Purpose |
|-------------|----------|
| **@react-three/fiber / drei** | 3D model rendering after generation |
| **Framer Motion** | Progress bar animation + fade transitions |
| **Custom polling (useMeshJob)** | Fetch job status updates from `/api/status` |
| **Tripo3D API** | Core generation engine |
| **Vercel KV (Future)** | For storing job metadata + asset history |
| **Web Share API (Future)** | For sharing generated USDZ assets |

---

## 10. Success Metrics

| Metric | Target |
|---------|--------|
| Time-to-feedback | < 3 seconds |
| Visible progress transparency | 100% jobs show clear stage progression |
| Job completion success | ≥ 95% |
| User retry rate (error state) | < 3% |
| Average generation time | 30-90 seconds |

---

## 11. Implementation Checklist

✅ Extend `useMeshJob.ts` with phase machine
✅ Update `ProcessingScreen.tsx` UI with 9-segment progress bar and stage labels
✅ Simplify `/api/create-mesh.ts` to use Tripo3D only
✅ Simplify `/api/status.ts` to remove fallback logic
✅ Add constants to `config.ts`
✅ Write error copy + retry flows
✅ Validate progress logic with Tripo3D API
