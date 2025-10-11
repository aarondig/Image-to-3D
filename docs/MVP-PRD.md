# Photo-to-3D Web App — Product Requirements Document (v3, updated to main)

## 1. Product Vision
A web app that converts a single uploaded photo into a fully downloadable, shareable 3D model.

Prioritizes:
- **Speed** – near-instant upload + clear generation feedback
- **Simplicity** – one-click creation & sharing
- **Quality** – Tripo3D for high-quality mesh generation
- **Expandability** – future gallery & animation support

## 2. Key User Stories
- I can upload a photo (JPG/PNG/HEIC/WebP ≤ 50 MB).
- My photo is resized automatically for faster processing.
- I see real-time progress as my 3D mesh generates.
- Once complete, I can preview the model, then download it.
- If something fails, I receive a clear error message and can retry without refreshing.

> Note: Current main branch implements **create + status polling + viewing + download**. Rigging/animation and share URLs are future.

## 3. Technical Architecture

### Frontend (Vite + React + TS)
- **Stack:** React + TypeScript + `@react-three/fiber` + `@react-three/drei` + Framer Motion
- **Entrypoint:** `src/App.tsx`
- **Screens / Flow:**
  - **Home:** `src/screens/HomeScreen.tsx`
  - **Uploader:** `src/screens/UploadScreen.tsx` (drag-and-drop or file picker + client-side resize via `src/utils/imageResize.ts`)
  - **Progress Screen:** `src/screens/ProcessingScreen.tsx` (animated loader + % + status)
  - **Viewer:** `src/screens/MeshViewerScreen.tsx` (renders GLTF via R3F; includes download/open actions; wrapped with `react-error-boundary`)
  - **Error:** `src/screens/ErrorScreen.tsx`
- **Layout:** `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/Breadcrumb.tsx`
- **Hook:** `src/hooks/useMeshJob.ts` (polls status, normalizes progress, exposes `asset.url`)
- **Lib/Utils:**  
  - `src/utils/imageResize.ts` (client resize & dataURL)  
  - `src/lib/safeUrl.ts`, `src/lib/utils.ts`  
  - Types: `src/types/api.ts`, `src/types/screens.ts`
- **Config:** `src/config.ts` (`apiBaseUrl`, `maxImageBytes`, `maxImageDimension`, `pollIntervalMs`)

### Backend (Vercel Functions, Node)
- **Hosting:** Vercel **Node functions** (using `@vercel/node`), not Next.js App Router.
- **API routes (root `/api/*`):**
  - `api/create-mesh.ts` → **POST**: accepts base64 image; creates TripoSR job; enforces usage limits; returns `{ taskId, status, etaSeconds? }`
  - `api/status.ts` → **GET**: polls job; normalizes Tripo response; returns `{ status, progress, message?, asset? }`
  - `api/proxy-model.ts` → **GET**: proxy fetch to Tripo CDN (CORS bypass); optional `format` param placeholder for future conversions
  - Shared utils: `api/_shared.ts` (CORS, usage tracking, session ids, fallback coordination, job metadata)
- **(Not in main yet)**: `/api/rigging`, `/api/animate`, `/api/convert`, `/api/error`, `/api/link/:assetId`, `/api/recent`

### Image Handling
- Client: image → **`toDataUrlAndResize`** in `src/utils/imageResize.ts` → base64 data URL  
- Send to **`POST /api/create-mesh`**  
- Poll with **`GET /api/status?taskId=...`** (interval from `config.pollIntervalMs`)  
- Viewer loads model from returned `asset.url` (optionally via **`/api/proxy-model?url=...`** to avoid CORS)

## 4. User Journey
1. **Home** → CTA “Transform any photo into 3D” (HomeScreen)
2. **Upload** → drag/drop or browse (UploadScreen) → client-side resize
3. **Loading** → “Generating Mesh” with progress & phases (ProcessingScreen, driven by `useMeshJob`)
4. **Viewer** → interactive 3D preview + actions (MeshViewerScreen)
   - **Download** (current)
   - **Open/Copy Link** (via proxy URL; full share flow future)
5. **Error State** → clear retry (ErrorScreen)

## 5. Features

### Core (MVP, implemented in main)
- Upload ≤ 50 MB → **client auto-resize** (`imageResize.ts`)
- **Tripo3D** job creation via `POST /api/create-mesh`
- **Real-time polling** via `GET /api/status`
- **3D preview** in `MeshViewerScreen.tsx`
- **Download / open model** from `asset.url` (with `api/proxy-model.ts` for CORS)

### Near-Term (Share)
- Web Share API / iOS AR Quick Look (requires USDZ and conversion path – **not yet implemented**)
- Fallback to download for non-iOS

### Future (Phase 3 – Database & Gallery)
- Minimal KV (e.g., Vercel KV) `{ id, url, thumb, createdAt }`
- Unique URLs per model `/m/:id`
- Home carousel + Gallery page
- `/api/recent` & `/api/link/:assetId`
- Webhook on job completion updates KV index

### Future (Rigging & Animation)
- `/api/rigging`, `/api/animate` endpoints (not present in main)
- Conditional “Animate” action in `MeshViewerScreen.tsx`

## 6. Constraints (aligned to main)
- **Upload limit:** ≤ 50 MB (client-side safety trim in `imageResize.ts`)
- **Client resize target:** default max dimension (see `config.maxImageDimension`, currently 1024; utility has defaults like 512/quality 0.85)
- **Polling cadence:** `config.pollIntervalMs` (default 5000 ms)
- **Output:** GLB (current export path); USDZ conversion **not implemented** in main
- **CORS:** model fetching via `api/proxy-model.ts`
- **Keys:** never exposed; all Tripo calls occur server-side

## 7. Success Criteria
- **Upload-to-feedback** < 3 s (show ProcessingScreen quickly after submit)
- **3D generation success** ≥ 95 %
- **Median generation time** 30–90 s (TripoSR variability)
- **Download success** ≥ 95 %
- **Zero API keys exposed**; smooth perf on mobile & desktop
- **Error visibility**: actionable messages + retry from ErrorScreen

---

## Appendix: File & Route References (from main)

**Frontend**
- `src/App.tsx`
- `src/screens/{HomeScreen,UploadScreen,ProcessingScreen,MeshViewerScreen,ErrorScreen}.tsx`
- `src/components/layout/{Header,Footer,Breadcrumb}.tsx`
- `src/hooks/useMeshJob.ts`
- `src/utils/imageResize.ts`
- `src/lib/{safeUrl,utils}.ts`
- `src/types/{api.ts,screens.ts,three.d.ts}`
- `src/config.ts`

**Backend (Vercel Node Functions)**
- `api/_shared.ts`
- `api/create-mesh.ts`  → `POST /api/create-mesh`
- `api/status.ts`       → `GET /api/status?taskId=...`
- `api/proxy-model.ts`  → `GET /api/proxy-model?url=...&format=...` (format optional; conversion not yet implemented)
