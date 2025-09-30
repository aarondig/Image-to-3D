# tasks.md

## Project Overview
Single-photo to point cloud & full 3D mesh web app. Phased development with quick wins prioritized.

**Tech Stack:** React + TypeScript + Vite + Three.js (@react-three/fiber) + Vercel (hosting + serverless functions)

**API Limitations (Tripo Basic):**
- 300 credits/month
- 1 concurrent task
- 1-day history
- Limited export formats
- Limited queue priority

---

## Phase 1: Core Upload & Backend Integration (Day 1: 2-3 hours)
**Goal:** Upload image → API processing → download link

### Task 1.1: Project Reset & Structure
- [x] 1.1.1: Delete `src/App.tsx`, `src/App.css`, `src/assets/`
- [x] 1.1.2: Create directory structure:
  ```
  src/
    components/
      ImageUpload.tsx
      StatusDisplay.tsx
    hooks/
      useMeshJob.ts
    utils/
      imageProcessing.ts
    types/
      api.ts
    App.tsx
  api/
    create-mesh.ts
    status.ts
  docs/
    CLAUDE.md (move from root)
  ```
- [x] 1.1.3: Remove `public/assets/` folder
- [x] 1.1.4: Update `.gitignore` to include `.env.local`
- [x] **COMMIT:** "Reset project structure and organize directories"

### Task 1.2: Install Dependencies
- [x] 1.2.1: Run `npm install @react-three/fiber @react-three/drei three`
- [x] 1.2.2: Run `npm install -D @types/three`
- [x] 1.2.3: Verify `package.json` has TypeScript, React 18+, Vite 5+
- [x] **COMMIT:** "Add Three.js and R3F dependencies"

### Task 1.3: Environment Configuration
- [x] 1.3.1: Create `.env.local` with:
  ```
  VITE_API_BASE_URL=http://localhost:5173
  TRIPO_API_KEY=your_key_here
  TRIPO_API_BASE=https://api.tripo3d.ai/v2/openapi
  ```
- [x] 1.3.2: Create `src/config.ts`:
  ```typescript
  export const config = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    maxImageBytes: 2 * 1024 * 1024, // 2MB
    maxImageDimension: 768,
    pollIntervalMs: 5000,
  };
  ```
- [x] 1.3.3: Add `.env.local` to `.gitignore`
- [x] **COMMIT:** "Add environment configuration"

### Task 1.4: TypeScript Types
- [x] 1.4.1: Create `src/types/api.ts`:
  ```typescript
  export type JobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMEOUT';

  export interface CreateMeshRequest {
    image: string;
    options?: {
      target_format?: 'glb' | 'obj';
      quality?: 'fast' | 'high';
      subject_type?: 'object' | 'character';
    };
  }

  export interface CreateMeshResponse {
    taskId: string;
    status: JobStatus;
    etaSeconds?: number;
  }

  export interface StatusResponse {
    taskId: string;
    status: JobStatus;
    progress: number;
    message?: string;
    asset?: {
      url: string;
      format: string;
      sizeBytes: number;
    };
    error?: string;
  }
  ```
- [x] **COMMIT:** "Add TypeScript API types"

### Task 1.5: Image Processing Utilities
- [x] 1.5.1: Create `src/utils/imageProcessing.ts`:
  ```typescript
  export async function resizeImage(file: File, maxDimension: number): Promise<string> {
    // Canvas-based resize logic
    // Return base64 data URL
  }

  export function validateImage(file: File, maxBytes: number): string | null {
    // Return error message or null if valid
  }
  ```
- [x] 1.5.2: Implement canvas resize to maintain aspect ratio
- [x] 1.5.3: Implement JPEG/PNG validation and size check
- [x] **COMMIT:** "Add image processing utilities"

### Task 1.6: ImageUpload Component
- [x] 1.6.1: Create `src/components/ImageUpload.tsx` with:
  - Drag-and-drop zone
  - File input fallback
  - Image preview
  - Loading state during resize
- [x] 1.6.2: Call `validateImage()` on file selection
- [x] 1.6.3: Call `resizeImage()` and display preview
- [x] 1.6.4: Emit `onImageReady(dataUrl: string)` callback
- [x] 1.6.5: Add basic Tailwind/CSS styling (clean, centered)
- [x] **COMMIT:** "Add ImageUpload component with preview"

### Task 1.7: StatusDisplay Component
- [x] 1.7.1: Create `src/components/StatusDisplay.tsx`:
  ```typescript
  interface Props {
    status: JobStatus;
    progress: number;
    message?: string;
    assetUrl?: string;
    error?: string;
  }
  ```
- [x] 1.7.2: Show spinner for QUEUED/RUNNING
- [x] 1.7.3: Show progress bar (0-100%)
- [x] 1.7.4: Show download link when SUCCEEDED
- [x] 1.7.5: Show error message when FAILED/TIMEOUT
- [x] **COMMIT:** "Add StatusDisplay component"

### Task 1.8: Backend API - create-mesh
- [x] 1.8.1: Create `api/create-mesh.ts` (Vercel serverless function):
  ```typescript
  import type { VercelRequest, VercelResponse } from '@vercel/node';

  export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    // Validate method (POST only)
    // Parse JSON body
    // Validate image field
    // Call Tripo API
    // Return taskId + status
  }
  ```
- [x] 1.8.2: Add CORS headers for localhost:5173
- [x] 1.8.3: Implement Tripo API fetch with error handling
- [x] 1.8.4: Return 400/500 error codes appropriately
- [x] **COMMIT:** "Add create-mesh API endpoint"

### Task 1.9: Backend API - status
- [x] 1.9.1: Create `api/status.ts`:
  ```typescript
  export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    // Validate method (GET only)
    // Extract ?id= query param
    // Call Tripo status API
    // Return normalized response
  }
  ```
- [x] 1.9.2: Implement stateless polling (no KV storage)
- [x] 1.9.3: Map Tripo status codes to JobStatus enum
- [x] 1.9.4: Return asset URL when job succeeds
- [x] **COMMIT:** "Add status polling API endpoint"

### Task 1.10: Polling Hook
- [ ] 1.10.1: Create `src/hooks/useMeshJob.ts`:
  ```typescript
  export function useMeshJob(taskId: string | null) {
    // useState for status, progress, asset, error
    // useEffect for polling loop
    // 5s interval, stop when SUCCEEDED/FAILED/TIMEOUT
    // Return { status, progress, asset, error, isLoading }
  }
  ```
- [ ] 1.10.2: Implement exponential backoff after 60s (5s → 8s)
- [ ] 1.10.3: Handle fetch errors gracefully (continue polling)
- [ ] **COMMIT:** "Add polling hook for job status"

### Task 1.11: Main App Integration
- [ ] 1.11.1: Update `src/App.tsx`:
  ```typescript
  function App() {
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const jobStatus = useMeshJob(taskId);

    async function handleImageReady(dataUrl: string) {
      setImageDataUrl(dataUrl);
      // POST to /api/create-mesh
      // Set taskId from response
    }

    return (
      <div className="app">
        <h1>Photo to 3D Mesh</h1>
        {!imageDataUrl && <ImageUpload onImageReady={handleImageReady} />}
        {imageDataUrl && <StatusDisplay {...jobStatus} />}
        {imageDataUrl && <button onClick={reset}>Upload Another</button>}
      </div>
    );
  }
  ```
- [ ] 1.11.2: Implement `handleImageReady` API call
- [ ] 1.11.3: Add reset functionality to clear state
- [ ] 1.11.4: Add basic layout styling
- [ ] **COMMIT:** "Integrate upload flow in main App"

### Task 1.12: Local Testing
- [ ] 1.12.1: Run `npm run dev` and test upload flow
- [ ] 1.12.2: Verify image resizes correctly
- [ ] 1.12.3: Verify API calls reach localhost (stub responses if needed)
- [ ] 1.12.4: Test error states (oversized file, invalid format)
- [ ] **COMMIT:** "Fix bugs found in local testing"

### Task 1.13: Vercel Deployment
- [ ] 1.13.1: Run `npm install -g vercel` (if not installed)
- [ ] 1.13.2: Run `vercel login`
- [ ] 1.13.3: Run `vercel` to create project
- [ ] 1.13.4: Add environment variables in Vercel dashboard:
  - `TRIPO_API_KEY`
  - `TRIPO_API_BASE`
- [ ] 1.13.5: Run `vercel --prod`
- [ ] 1.13.6: Test deployed URL end-to-end
- [ ] **COMMIT:** "Deploy Phase 1 to Vercel"

---

## Phase 2: Point Cloud Visualization (Day 2-3: 6-8 hours)
**Goal:** Instant MiDaS point cloud viewer with controls

### Task 2.1: Research MiDaS Browser Implementation
- [ ] 2.1.1: Evaluate ONNX Runtime Web + MiDaS ONNX model
- [ ] 2.1.2: Test Depth-Anything-ONNX as alternative
- [ ] 2.1.3: Document model size, load time, inference speed
- [ ] 2.1.4: Choose approach and document decision in docs/
- [ ] **COMMIT:** "Document depth estimation approach"

### Task 2.2: Depth Estimation Integration
- [ ] 2.2.1: Install ONNX Runtime Web or TensorFlow.js
- [ ] 2.2.2: Create `src/utils/depthEstimation.ts`:
  ```typescript
  export async function estimateDepth(imageDataUrl: string): Promise<Float32Array> {
    // Load model
    // Run inference
    // Return normalized depth map
  }
  ```
- [ ] 2.2.3: Add loading state for model download
- [ ] 2.2.4: Cache model in memory after first load
- [ ] **COMMIT:** "Add depth estimation utility"

### Task 2.3: Point Cloud Generator
- [ ] 2.3.1: Create `src/utils/pointCloudGenerator.ts`:
  ```typescript
  export function generatePointCloud(
    depthMap: Float32Array,
    imageDataUrl: string,
    width: number,
    height: number,
    options: { step: number; depthScale: number }
  ): { positions: Float32Array; colors: Float32Array } {
    // Convert (x,y,depth) to 3D positions
    // Extract RGB colors from image
    // Subsample by step
    // Return geometry data
  }
  ```
- [ ] 2.3.2: Implement pixel → 3D coordinate mapping
- [ ] 2.3.3: Cap total points at 200k for performance
- [ ] **COMMIT:** "Add point cloud generator"

### Task 2.4: Three.js Viewer Component
- [ ] 2.4.1: Create `src/components/PointCloudViewer.tsx`:
  ```typescript
  import { Canvas } from '@react-three/fiber';
  import { OrbitControls } from '@react-three/drei';

  interface Props {
    positions: Float32Array;
    colors: Float32Array;
    pointSize: number;
  }
  ```
- [ ] 2.4.2: Render points using `<points>` geometry
- [ ] 2.4.3: Add `OrbitControls` with constraints (no full rotation yet)
- [ ] 2.4.4: Add ambient + directional lighting
- [ ] 2.4.5: Add fog effect for depth perception
- [ ] **COMMIT:** "Add point cloud viewer component"

### Task 2.5: Controls Panel
- [ ] 2.5.1: Create `src/components/ControlsPanel.tsx`:
  ```typescript
  interface Props {
    pointSize: number;
    onPointSizeChange: (size: number) => void;
    depthScale: number;
    onDepthScaleChange: (scale: number) => void;
    onReset: () => void;
  }
  ```
- [ ] 2.5.2: Add slider for point size (0.5 - 5.0)
- [ ] 2.5.3: Add slider for depth scale (0.3 - 1.0)
- [ ] 2.5.4: Add "Reset View" button
- [ ] 2.5.5: Style panel as overlay
- [ ] **COMMIT:** "Add viewer controls panel"

### Task 2.6: Update App Flow
- [ ] 2.6.1: Modify `App.tsx` to run MiDaS immediately after upload
- [ ] 2.6.2: Show "Estimating depth..." loading state
- [ ] 2.6.3: Generate point cloud after depth estimation
- [ ] 2.6.4: Display `PointCloudViewer` + `ControlsPanel`
- [ ] 2.6.5: Keep mesh job polling in background
- [ ] **COMMIT:** "Integrate point cloud into upload flow"

### Task 2.7: Mode Switching
- [ ] 2.7.1: Add state for `viewMode: 'pointcloud' | 'mesh'`
- [ ] 2.7.2: Show banner when mesh ready: "Full 3D Ready - View Mesh"
- [ ] 2.7.3: Add toggle button to switch between modes
- [ ] 2.7.4: Conditionally render viewer based on mode
- [ ] **COMMIT:** "Add point cloud / mesh mode switching"

### Task 2.8: Mesh Viewer Component
- [ ] 2.8.1: Create `src/components/MeshViewer.tsx`:
  ```typescript
  import { useGLTF } from '@react-three/drei';

  interface Props {
    url: string;
  }
  ```
- [ ] 2.8.2: Load GLB using `useGLTF` hook
- [ ] 2.8.3: Render with full `OrbitControls` (360° rotation)
- [ ] 2.8.4: Add better lighting for mesh (vs point cloud)
- [ ] 2.8.5: Handle loading/error states
- [ ] **COMMIT:** "Add mesh viewer component"

### Task 2.9: Testing & Optimization
- [ ] 2.9.1: Test with various image types (portraits, objects, landscapes)
- [ ] 2.9.2: Profile FPS and optimize point count if needed
- [ ] 2.9.3: Test mode switching works smoothly
- [ ] 2.9.4: Verify mesh downloads and displays correctly
- [ ] **COMMIT:** "Optimize viewer performance"

### Task 2.10: Deploy Phase 2
- [ ] 2.10.1: Update environment variables if needed
- [ ] 2.10.2: Run `vercel --prod`
- [ ] 2.10.3: Test deployed version end-to-end
- [ ] 2.10.4: Verify model loads correctly on CDN
- [ ] **COMMIT:** "Deploy Phase 2 with point cloud viewer"

---

## Phase 3: Polish & Edge Cases (Week 1: 10-15 hours)
**Goal:** Production-ready error handling, UX polish, optional features

### Task 3.1: Error Handling
- [ ] 3.1.1: Add retry logic for failed API calls (3 attempts)
- [ ] 3.1.2: Display user-friendly error messages
- [ ] 3.1.3: Add "Try Again" button for failed uploads
- [ ] 3.1.4: Handle Tripo rate limits (300 credits/month)
- [ ] 3.1.5: Show remaining credits if API provides it
- [ ] **COMMIT:** "Add comprehensive error handling"

### Task 3.2: UX Polish
- [ ] 3.2.1: Add loading skeletons for better perceived performance
- [ ] 3.2.2: Add smooth transitions between states
- [ ] 3.2.3: Improve mobile responsiveness
- [ ] 3.2.4: Add keyboard shortcuts (R = reset, Space = toggle mode)
- [ ] 3.2.5: Add tooltips for controls
- [ ] **COMMIT:** "Polish user experience"

### Task 3.3: Analytics & Monitoring
- [ ] 3.3.1: Add basic event tracking (uploads, successes, failures)
- [ ] 3.3.2: Log API response times
- [ ] 3.3.3: Track depth estimation performance
- [ ] 3.3.4: Add error boundary for React crashes
- [ ] **COMMIT:** "Add analytics and error boundaries"

### Task 3.4: Optional Feature - Export Point Cloud
- [ ] 3.4.1: Create `src/utils/exportPLY.ts`:
  ```typescript
  export function exportToPLY(positions: Float32Array, colors: Float32Array): Blob {
    // Generate PLY file format
    // Return as downloadable blob
  }
  ```
- [ ] 3.4.2: Add "Export .PLY" button to controls
- [ ] 3.4.3: Trigger browser download
- [ ] **COMMIT:** "Add PLY export functionality"

### Task 3.5: Optional Feature - Auto-Orbit
- [ ] 3.5.1: Add auto-rotate toggle to controls
- [ ] 3.5.2: Implement smooth camera rotation using `useFrame`
- [ ] 3.5.3: Pause on user interaction
- [ ] **COMMIT:** "Add auto-orbit animation"

### Task 3.6: Optional Feature - Depth Cleanup
- [ ] 3.6.1: Add Gaussian blur to depth map in `depthEstimation.ts`
- [ ] 3.6.2: Add slider for blur amount
- [ ] 3.6.3: Regenerate point cloud on slider change
- [ ] **COMMIT:** "Add depth map smoothing"

### Task 3.7: Documentation
- [ ] 3.7.1: Update README.md with:
  - Features overview
  - Tech stack
  - Local development setup
  - Deployment instructions
  - Known limitations
- [ ] 3.7.2: Add inline code comments for complex logic
- [ ] 3.7.3: Document Tripo API rate limits and costs
- [ ] **COMMIT:** "Add comprehensive documentation"

### Task 3.8: Final Testing
- [ ] 3.8.1: Test on Chrome, Firefox, Safari, Edge
- [ ] 3.8.2: Test on mobile devices
- [ ] 3.8.3: Test with slow network (throttle to 3G)
- [ ] 3.8.4: Verify all error paths work correctly
- [ ] 3.8.5: Load test with multiple concurrent uploads
- [ ] **COMMIT:** "Fix bugs from cross-browser testing"

### Task 3.9: Performance Optimization
- [ ] 3.9.1: Code-split depth estimation model loading
- [ ] 3.9.2: Lazy-load Three.js viewer components
- [ ] 3.9.3: Optimize bundle size (analyze with `vite-bundle-visualizer`)
- [ ] 3.9.4: Add service worker for model caching (optional)
- [ ] **COMMIT:** "Optimize bundle size and loading"

### Task 3.10: Final Deployment
- [ ] 3.10.1: Set up custom domain (optional)
- [ ] 3.10.2: Configure production environment variables
- [ ] 3.10.3: Enable gzip/brotli compression
- [ ] 3.10.4: Run final smoke tests
- [ ] 3.10.5: Tag release v1.0.0
- [ ] **COMMIT:** "Release v1.0.0 to production"

---

## Commit Message Template

```
<type>: <short description>

- Detailed change 1
- Detailed change 2

Closes #<issue_number> (if applicable)
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

---

## Notes for Claude Code

- **Auto-commit after each task completion** using the commit message provided
- **Test locally before committing** to ensure code runs without errors
- **Ask for clarification** if task requirements are ambiguous
- **Update this file** to check off completed subtasks
- **Phase 1 is priority** - get something deployed before moving to Phase 2
- **Tripo API limits:** 300 credits/month, 1 concurrent task - design with conservation in mind

---

## Current Phase: Phase 1 - Task 1.1
**Next action:** Delete existing files and create new directory structure