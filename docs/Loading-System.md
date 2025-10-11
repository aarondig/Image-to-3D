# Feature Addendum: Transparent Loading System + API Fallback (v3.1)

## Context
This feature defines a **multi-stage, transparent loading experience** for users uploading photos for 3D generation.  
It ensures that users understand each stage of processing (e.g., uploading, queueing, depth estimation, texturing) and can **see fallback logic** in real time when the primary engine (TripoSR) experiences queue delays.

It directly connects to the APIs implemented in `/api/create-mesh.ts` and `/api/status.ts` and is rendered through the React frontend (`ProcessingScreen.tsx` + `useMeshJob.ts`).

---

## 1. Feature Overview

**Feature Name:** Transparent Multi-Stage Loading System with Engine Fallback  
**Goal:** Increase user trust and perceived speed by exposing detailed generation stages, progress segments, and live fallback timing.  
**Primary Interaction:** Display stage-by-stage progress UI from upload → ready state, including a visible **queue countdown** from TripoSR → Tripo3D backup.

This system simulates sub-stage progress (depth estimation, reconstruction, etc.) based on API feedback and interpolated timing windows, while preserving transparency about which engine and queue the job is currently using.

---

## 2. Problem Statement

The current MVP presents a generic “Generating Mesh” loader with minimal transparency, causing users to:

- Misinterpret delays as failure.
- Leave before fallback completes.
- Lack understanding of backend process complexity.

**Goal:** Introduce a visible, educational progress experience that makes latency and fallback behavior explicit without increasing perceived wait time.

---

## 3. Technical Summary

| Layer | Implementation | Description |
|-------|----------------|--------------|
| **Frontend** | React + TypeScript (`ProcessingScreen.tsx`, `useMeshJob.ts`) | State machine-driven progress UI with countdown timer and engine switching. |
| **Backend** | Vercel Node Functions (`/api/create-mesh.ts`, `/api/status.ts`) | Orchestrates TripoSR and Tripo3D jobs, normalizes job states, and reports queue ETA or fallback threshold. |
| **External APIs** | TripoSR API + Tripo3D API | Used for mesh creation, status polling, and engine fallback. |
| **Config** | `src/config.ts` | Centralized fallback thresholds, simulated phase durations, and polling intervals. |

---

## 4. API Endpoints Involved

### 4.1 `/api/create-mesh`

**Purpose:** Create a new mesh generation job.  
**Flow:**
- Accepts base64-encoded image (≤ 50 MB).
- Submits job to **TripoSR** by default.
- If job creation is delayed or queue exceeds threshold (e.g., > 16s), fallback to **Tripo3D**.
- Returns a job identifier and initial metadata.

**Request:**
```json
POST /api/create-mesh
{
  "image": "<base64 string>",
  "engine": "tripo-sr" | "tripo-3d"
}
```

**Response:**
```json
{
  "jobId": "abc123",
  "engine": "tripo-sr",
  "status": "queued",
  "etaSeconds": 16,
  "position": 5
}
```

**Notes:**
- Engine defaults to `tripo-sr`.
- The function internally stores engine metadata and fallback eligibility.
- If SR queue > fallback threshold, job switches to Tripo3D transparently and frontend is notified on the next poll.

---

### 4.2 `/api/status`

**Purpose:** Polls Tripo job status, normalizing returned progress and engine info.  
**Flow:**
- Returns normalized job object with engine, stage, and progress (0–1).
- Provides optional queue info (ETA, position, engine switch flag).

**Request:**
```http
GET /api/status?jobId=abc123
```

**Response:**
```json
{
  "jobId": "abc123",
  "engine": "tripo-sr",
  "status": "processing",
  "progress": 0.42,
  "phase": "texturing",
  "queue": {
    "etaSeconds": 12,
    "position": 3
  },
  "fallbackTriggered": false,
  "assetUrl": null
}
```

**If fallback triggered:**
```json
{
  "engine": "tripo-3d",
  "status": "processing",
  "progress": 0.46,
  "phase": "preprocessing",
  "fallbackTriggered": true
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
export type Engine = 'tripo-sr' | 'tripo-3d';
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
- Tracks `secondsUntilFallback` (16s default) during `Queued`.
- Auto-triggers fallback to Tripo3D when timer expires or API signals fallback.
- Smoothly transitions phases for realism (using `phaseDurationsMs`).

---

## 6. UI/UX Design Specification

### UI State Breakdown

| **State / UI Label** | **Supporting Line (5–8 words)** |
|-----------------------|--------------------------------|
| **Uploading** | Optimizing and encoding image data for processing |
| **Queued** | Awaiting processing slot · fallback in {MM:SS} |
| **Preprocessing** | Normalizing color and lighting data |
| **Depth Estimation** | Generating surface map from single photo |
| **Mesh Reconstruction** | Converting depth map into 3D geometry |
| **Texturing** | Projecting image colors onto 3D surface |
| **Compiling** | Compressing and optimizing mesh for export |
| **Finalizing** | Validating file integrity and upload success |
| **Ready** | 3D preview available · tap to view |

### Fallback Behavior
If TripoSR queue delay exceeds 16 seconds (configurable), the UI updates:
- Label: `Engine: Tripo3D (fallback)`
- Stage resets to “Preprocessing”
- Countdown disappears
- New progress sequence continues normally

### Visual Design Notes (match Figma)
- **9-segment progress bar:** Each stage corresponds to one segment. Filled segments = completed stages; active stage pulses subtly.
- **Queue indicator:** Displays countdown and queue position side by side.
- **Top header:** Current stage title.
- **Footer:** Cancel / Retry buttons.
- **Fallback alert:** Light toast “Switched to backup engine for faster processing.”

---

## 7. Configurations

In `src/config.ts`:
```ts
export const srQueueFallbackSeconds = 16;
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
POST /api/create-mesh → engine=tripo-sr
        ↓
Frontend enters `Queued` (16s countdown)
        ↓
[TripoSR Queue Response]
  ├── If <16s → Continue with SR
  └── If >16s → Fallback to Tripo3D
        ↓
Polling /api/status every 5s
        ↓
Frontend cycles through phase states
        ↓
GET /api/status → {status: 'completed', assetUrl}
        ↓
Viewer opens → Download/Share options
```

---

## 9. Dependencies & Integrations

| Dependency | Purpose |
|-------------|----------|
| **@react-three/fiber / drei** | 3D model rendering after generation |
| **Framer Motion** | Progress bar animation + fade transitions |
| **React Query or custom polling** | Fetch job status updates from `/api/status` |
| **TripoSR / Tripo3D APIs** | Core generation engines |
| **Vercel KV (Future)** | For storing job metadata + asset history |
| **Web Share API (Future)** | For sharing generated USDZ assets |

---

## 10. Success Metrics

| Metric | Target |
|---------|--------|
| Time-to-feedback | < 3 seconds |
| Visible queue transparency | 100% jobs show queue countdown |
| Fallback trigger accuracy | 100% of SR queues >16s trigger fallback |
| Job completion success | ≥ 95% |
| User retry rate (error state) | < 3% |

---

## 11. Implementation Checklist

✅ Extend `useMeshJob.ts` with phase machine + countdown  
✅ Update `ProcessingScreen.tsx` UI per Figma (9 segments, labels, countdown)  
✅ Modify `/api/create-mesh.ts` for engine param + fallback logic  
✅ Update `/api/status.ts` to include queue info + fallbackTriggered  
✅ Add constants to `config.ts`  
✅ Write error copy + retry flows  
✅ Validate progress + fallback logic across TripoSR and Tripo3D
