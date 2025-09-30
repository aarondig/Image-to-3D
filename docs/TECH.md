# Technical Documentation

## Single-Photo → Point Cloud & Full 3D Web App

**Version:** 1.0  
**Last Updated:** September 30, 2025  
**Architecture:** React + TypeScript + Vite + Three.js + Vercel

---

## 1. Technology Stack

### Frontend

- **Framework:** React 18+ (latest stable)
- **Language:** TypeScript 5+ (strict mode)
- **Build Tool:** Vite 5+
- **3D Rendering:** `@react-three/fiber` (React wrapper for Three.js)
- **3D Utilities:** `@react-three/drei` (OrbitControls, loaders, helpers)
- **Model Inference (client):** ONNX Runtime Web or TensorFlow.js for MiDaS depth estimation
- **UI State Management:** React hooks (useState, useEffect, useCallback)
- **Image Handling:** HTML5 Canvas API for resizing and pixel access
- **HTTP Client:** Native Fetch API

### Backend

- **Hosting/Serverless Platform:** Vercel
- **Runtime:** Node.js 18+ (Vercel serverless functions)
- **API Endpoints:**
  - `/api/create-mesh` - Initiates TripoSR job
  - `/api/status` - Polls TripoSR job status
- **Provider Integration:** Tripo API (https://api.tripo3d.ai/v2/openapi)
- **Environment Variables:**
  - `TRIPO_API_KEY` - API authentication (server-side only)
  - `TRIPO_API_BASE` - API base URL
  - `VITE_API_BASE_URL` - Frontend API endpoint

### Deployment

- **Platform:** Vercel (static hosting + serverless functions)
- **Build Command:** `npm run build`
- **Output Directory:** `dist/`
- **Node Version:** 18.x
- **Delivery:** HTTPS with automatic SSL

---

## 2. Core Functional Flow

### 2.1 Upload & Preprocessing

1. **User uploads image** (JPG/PNG via drag-drop or file picker)
2. **Client-side validation:**
   - File type check (MIME type validation)
   - File size check (max 2MB)
   - Return error if invalid
3. **Canvas-based resize:**
   - Load image into canvas
   - Calculate dimensions to fit within 768px (maintain aspect ratio)
   - Draw resized image
   - Export as base64 data URL (JPEG quality: 0.9)
4. **Preview display** to user

### 2.2 Instant Mode (Point Cloud Path)

1. **Load MiDaS model** (first time only, cached after)
   - ONNX model: ~5-10MB download
   - Show loading indicator during download
2. **Run depth estimation:**
   - Convert base64 to ImageData
   - Run inference (2-8 seconds depending on device)
   - Output: Float32Array of normalized depth values (0-1)
3. **Generate point cloud:**
   - Iterate through image pixels (with step size for density control)
   - For each pixel: `(x, y, depth) → (3D_x, 3D_y, 3D_z)`
   - Extract RGB color from original image
   - Build Float32Arrays for positions and colors
   - Cap total points at 200k
4. **Render in Three.js:**
   - Create BufferGeometry with position and color attributes
   - Use PointsMaterial with vertex colors
   - Add to scene with OrbitControls (limited vertical rotation)

### 2.3 Background Mode (Full 3D Mesh Path)

1. **Parallel API request** (does not block point cloud)
2. **POST `/api/create-mesh`:**
   - Send base64 image data
   - Include options: `{ target_format: 'glb', quality: 'fast' }`
3. **Backend proxies to Tripo API:**
   - Forward request with server-side API key
   - Receive taskId from Tripo
   - Return taskId to frontend
4. **Frontend starts polling loop:**
   - GET `/api/status?id={taskId}` every 5 seconds
   - Display status: QUEUED → RUNNING → SUCCEEDED/FAILED
   - Show progress bar (0-100%)
   - After 60s, increase interval to 8s (backoff)
5. **When SUCCEEDED:**
   - Extract asset.url (GLB file on Tripo CDN)
   - Display "View Mesh" banner
   - Load GLB using `useGLTF` from drei
   - Allow mode switch to mesh viewer

### 2.4 User Experience Flow

```
Upload → [Instant: Point Cloud] → [Background: Poll Status] → [Switch to Mesh]
   ↓            ↓                         ↓                          ↓
Preview → Depth Estimation → Display Status Updates → Load GLB → Full 3D View
```

**Timeline:**
- Preview: Instant
- Point cloud: 3-10 seconds
- Mesh generation: 30-90 seconds
- Total to full experience: <2 minutes

---

## 3. API Contracts

### 3.1 POST `/api/create-mesh`

Start TripoSR mesh generation job.

**Request:**
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

**Response (202 Accepted):**
```json
{
  "taskId": "job_8b3a2...",
  "status": "QUEUED",
  "etaSeconds": 60
}
```

**Error Responses:**
- `400` - Invalid input or image too large
- `402` - Quota/credits exceeded
- `429` - Rate limited
- `500` - Provider error

---

### 3.2 GET `/api/status?id=<taskId>`

Poll job progress or retrieve final asset.

**Query Parameters:**
- `id` (required) - The taskId from create-mesh response

**Response (200 OK):**
```json
{
  "taskId": "job_8b3a2...",
  "status": "QUEUED|RUNNING|SUCCEEDED|FAILED|TIMEOUT",
  "progress": 0.75,
  "message": "Generating mesh...",
  "asset": {
    "url": "https://cdn.tripo3d.ai/outputs/job_8b3a2/model.glb",
    "format": "glb",
    "sizeBytes": 1837421
  },
  "error": null
}
```

**Status States:**
- `QUEUED` - Job accepted, waiting to start
- `RUNNING` - Currently processing (progress 0.0-1.0)
- `SUCCEEDED` - Complete, asset.url available
- `FAILED` - Generation failed, error message provided
- `TIMEOUT` - Exceeded server TTL (15 minutes)

**Error Responses:**
- `400` - Missing or invalid id parameter
- `404` - Unknown taskId (expired or never existed)
- `500` - Provider error

---

## 4. Backend Architecture

### 4.1 State Machine

```
QUEUED → RUNNING → SUCCEEDED
  ↓         ↓          ↑
  ↓         ↓          |
  +----→ FAILED ←------+
           ↓
        TIMEOUT
```

**TTL Management:**
- Each job has hard TTL of 15 minutes (JOB_TTL_SECONDS)
- Server converts stuck jobs to TIMEOUT after TTL expires
- No persistent storage (stateless polling)

**Polling Strategy:**
- Client polls every 5 seconds initially
- After 60 seconds, backoff to 8 seconds
- Stop polling on terminal states: SUCCEEDED, FAILED, TIMEOUT

---

### 4.2 Environment Variables

**Server-side (Vercel):**
```bash
TRIPO_API_BASE=https://api.tripo3d.ai/v2/openapi
TRIPO_API_KEY=<secret_key>
ALLOWED_ORIGINS=https://your-app.vercel.app
MAX_IMAGE_BYTES=3000000
JOB_TTL_SECONDS=900
```

**Client-side:**
```bash
VITE_API_BASE_URL=https://your-app.vercel.app
```

---

### 4.3 Backend Pseudocode

**`/api/create-mesh`:**
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  enableCors(req, res, process.env.ALLOWED_ORIGINS);
  
  // Validate POST method
  if (req.method !== 'POST') return res.status(405).end();
  
  // Parse and validate request
  const { image, options } = await safeJson(req);
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid image' });
  }
  
  // Validate image size
  if (isDataUrl(image) && dataUrlSizeBytes(image) > MAX_IMAGE_BYTES) {
    return res.status(400).json({ error: 'Image too large' });
  }
  
  // Rate limiting (optional)
  const limited = await rateLimit(req);
  if (limited) return res.status(429).json({ error: 'Rate limited' });
  
  // Build provider payload
  const payload = {
    image,
    params: {
      target_format: options?.target_format ?? 'glb',
      quality: options?.quality ?? 'fast',
      subject_type: options?.subject_type ?? 'object'
    }
  };
  
  // Call Tripo API
  const resp = await fetch(`${process.env.TRIPO_API_BASE}/jobs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.TRIPO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (!resp.ok) {
    const err = await safeText(resp);
    const code = resp.status === 402 ? 402 : 500;
    return res.status(code).json({ error: 'Provider error', detail: err });
  }
  
  const data = await resp.json();
  
  // Return taskId and status
  return res.status(202).json({
    taskId: data.id,
    status: 'QUEUED',
    etaSeconds: data.etaSeconds ?? 60
  });
}
```

**`/api/status`:**
```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  enableCors(req, res, process.env.ALLOWED_ORIGINS);
  
  // Validate GET method
  if (req.method !== 'GET') return res.status(405).end();
  
  // Extract taskId
  const taskId = String(req.query.id || '');
  if (!taskId) return res.status(400).json({ error: 'Missing id' });
  
  // Query Tripo API
  const resp = await fetch(`${process.env.TRIPO_API_BASE}/jobs/${taskId}`, {
    headers: { 'Authorization': `Bearer ${process.env.TRIPO_API_KEY}` }
  });
  
  if (!resp.ok) {
    const err = await safeText(resp);
    return res.status(500).json({ taskId, status: 'UNKNOWN', error: err });
  }
  
  const data = await resp.json();
  
  // Normalize provider response
  const normalized = normalizeProviderStatus(data);
  
  return res.status(200).json({
    taskId,
    status: normalized.status,
    progress: normalized.progress,
    message: normalized.message,
    asset: normalized.asset ?? null,
    error: normalized.error ?? null
  });
}
```

---

## 5. Frontend Architecture

### 5.1 Component Structure

```
src/
├── components/
│   ├── ImageUpload.tsx         # Drag-drop upload + preview
│   ├── StatusDisplay.tsx       # Job status with progress bar
│   ├── PointCloudViewer.tsx    # R3F point cloud renderer
│   ├── MeshViewer.tsx          # R3F mesh (GLB) renderer
│   └── ControlsPanel.tsx       # Sliders and buttons
├── hooks/
│   ├── useMeshJob.ts           # Polling hook for job status
│   └── useDepthEstimation.ts   # MiDaS inference hook
├── utils/
│   ├── imageProcessing.ts      # Resize and validation
│   ├── depthEstimation.ts      # MiDaS model loading and inference
│   └── pointCloudGenerator.ts  # Depth map to 3D points
├── types/
│   └── api.ts                  # TypeScript interfaces
└── App.tsx                     # Main application component
```

---

### 5.2 Key Utilities

**`imageProcessing.ts`:**
```typescript
export async function resizeImage(
  file: File,
  maxDimension: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // Calculate dimensions
      let { width, height } = img;
      if (width > height && width > maxDimension) {
        height = (height / width) * maxDimension;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width / height) * maxDimension;
        height = maxDimension;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function validateImage(file: File, maxBytes: number): string | null {
  const validTypes = ['image/jpeg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return 'Please upload a JPG or PNG image';
  }
  if (file.size > maxBytes) {
    return `Image must be smaller than ${(maxBytes / 1024 / 1024).toFixed(1)}MB`;
  }
  return null;
}
```

**`pointCloudGenerator.ts`:**
```typescript
export function generatePointCloud(
  depthMap: Float32Array,
  imageDataUrl: string,
  width: number,
  height: number,
  options: { step: number; depthScale: number }
): { positions: Float32Array; colors: Float32Array } {
  const { step, depthScale } = options;
  const positions: number[] = [];
  const colors: number[] = [];
  
  // Get image pixel data
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = new Image();
  img.src = imageDataUrl;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  
  // Generate points
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = y * width + x;
      const depth = depthMap[i];
      
      // Convert to 3D coordinates (centered)
      const x3d = (x / width - 0.5) * 2;
      const y3d = -(y / height - 0.5) * 2;
      const z3d = depth * depthScale;
      
      positions.push(x3d, y3d, z3d);
      
      // Extract color
      const pixelIndex = i * 4;
      const r = imageData.data[pixelIndex] / 255;
      const g = imageData.data[pixelIndex + 1] / 255;
      const b = imageData.data[pixelIndex + 2] / 255;
      
      colors.push(r, g, b);
    }
  }
  
  // Cap at 200k points
  const maxPoints = 200000;
  if (positions.length / 3 > maxPoints) {
    const ratio = maxPoints / (positions.length / 3);
    // Subsample (implementation details omitted)
  }
  
  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors)
  };
}
```

---

### 5.3 Custom Hooks

**`useMeshJob.ts`:**
```typescript
export function useMeshJob(taskId: string | null) {
  const [state, setState] = useState({
    status: 'IDLE' as JobStatus,
    progress: 0,
    asset: null as { url: string; format: string; sizeBytes: number } | null,
    error: null as string | null,
    isLoading: false
  });
  
  useEffect(() => {
    if (!taskId) return;
    
    let stopped = false;
    let interval = 5000;
    
    async function poll() {
      if (stopped) return;
      
      setState(s => ({ ...s, isLoading: true }));
      
      try {
        const resp = await fetch(`/api/status?id=${encodeURIComponent(taskId)}`);
        const data = await resp.json();
        
        setState({
          status: data.status,
          progress: data.progress ?? 0,
          asset: data.asset,
          error: data.error,
          isLoading: false
        });
        
        // Terminal states
        if (['SUCCEEDED', 'FAILED', 'TIMEOUT'].includes(data.status)) {
          return;
        }
      } catch (error) {
        // Continue polling on network errors
        setState(s => ({ ...s, isLoading: false }));
      }
      
      setTimeout(poll, interval);
      
      // Backoff after 60 seconds
      setTimeout(() => { interval = 8000; }, 60000);
    }
    
    poll();
    
    return () => { stopped = true; };
  }, [taskId]);
  
  return state;
}
```

---

## 6. Three.js Viewer Implementation

### 6.1 Point Cloud Viewer

```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

interface PointCloudViewerProps {
  positions: Float32Array;
  colors: Float32Array;
  pointSize: number;
}

export function PointCloudViewer({ positions, colors, pointSize }: PointCloudViewerProps) {
  return (
    <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 2]} intensity={0.8} />
      
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={pointSize} vertexColors />
      </points>
      
      <OrbitControls
        enablePan
        enableZoom
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(3 * Math.PI) / 4}
      />
      
      <fog attach="fog" args={['#000', 1, 5]} />
    </Canvas>
  );
}
```

### 6.2 Mesh Viewer

```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

interface MeshViewerProps {
  url: string;
}

function MeshModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export function MeshViewer({ url }: MeshViewerProps) {
  return (
    <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 2]} intensity={0.8} />
      
      <MeshModel url={url} />
      
      <OrbitControls enablePan enableZoom />
    </Canvas>
  );
}
```

---

## 7. Constraints & Assumptions

### Technical Constraints

- **Input:** Images ≤2 MB, auto-resized to ≤768px
- **Point Cloud:** Max ~200k points for performance
- **Browser Requirements:** WebGL 2.0, modern JavaScript support
- **Mesh Generation:** 30-90 seconds depending on queue
- **No Backend Persistence:** Stateless polling only (no KV storage)

### API Constraints (Tripo Basic Tier)

- **Monthly Limit:** 300 credits
- **Concurrency:** 1 task at a time
- **History:** 1-day retention
- **Export Formats:** Limited to GLB primarily
- **Queue Priority:** Lower than paid tiers

### Performance Targets

- **Point Cloud Render:** 30+ FPS on laptops
- **Depth Estimation:** <10 seconds
- **Initial Load:** <3 seconds (excluding model download)
- **Bundle Size:** <500KB (pre-gzip, excluding 3D models)

---

## 8. Security Considerations

### API Key Protection

- **Never expose** `TRIPO_API_KEY` in client code
- All API calls proxied through `/api/*` endpoints
- Server-side environment variables only
- No API keys in git history or client bundles

### CORS Configuration

```typescript
function enableCors(req: VercelRequest, res: VercelResponse, allowedOrigins: string) {
  const origin = req.headers.origin || '';
  const allowed = allowedOrigins.split(',').map(s => s.trim());
  
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).end();
  }
}
```

### Input Validation

- File type whitelist (JPEG, PNG only)
- File size limits enforced
- Base64 validation before API calls
- Sanitize all user inputs

---

## 9. Performance Optimization Strategies

### Phase 1 (MVP)
- Lazy load Three.js (code splitting)
- Compress images before upload
- Debounce slider inputs

### Phase 2 (Point Cloud)
- Cache MiDaS model after first load
- Adaptive point density based on device
- Use Web Workers for depth processing (optional)

### Phase 3 (Production)
- Service worker for model caching
- Preload critical assets
- Bundle size analysis and optimization
- Image format optimization (WebP with JPEG fallback)

---

## 10. Error Handling Strategy

### Client-Side Errors

- **Network failures:** Retry with exponential backoff (max 3 attempts)
- **Invalid files:** Clear error messages with upload restrictions
- **WebGL not supported:** Feature detection with fallback message
- **Model load failures:** Graceful degradation to text status

### Server-Side Errors

- **Tripo API errors:** Map to user-friendly messages
- **Rate limits:** Display remaining credits if available
- **Timeout errors:** Convert to TIMEOUT status after 15 minutes
- **Malformed requests:** Return 400 with specific error details

### User Experience

- All errors shown in toast/banner format
- "Try Again" button for recoverable errors
- Point cloud remains usable if mesh generation fails
- Clear loading states prevent confusion

---

## 11. Testing Strategy

### Unit Tests (Optional for MVP)

- Image processing utilities
- Point cloud generation algorithm
- API response normalization

### Integration Tests

- End-to-end upload flow
- API endpoint responses
- Polling mechanism

### Manual Testing Checklist

- [ ] Upload various image types (portrait, landscape, object)
- [ ] Test with oversized images (>2MB)
- [ ] Test with invalid file types
- [ ] Verify depth estimation works
- [ ] Check point cloud renders smoothly
- [ ] Test mesh generation completes
- [ ] Verify mode switching works
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on mobile devices
- [ ] Throttle network to 3G and verify UX

---

## 12. Deployment Configuration

### Vercel Configuration

**`vercel.json`:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "TRIPO_API_BASE": "@tripo-api-base",
    "TRIPO_API_KEY": "@tripo-api-key",
    "ALLOWED_ORIGINS": "@allowed-origins",
    "MAX_IMAGE_BYTES": "3000000",
    "JOB_TTL_SECONDS": "900"
  }
}
```

### Build Steps

1. `npm install` - Install dependencies
2. `npm run build` - Build for production
3. Verify `dist/` directory created
4. Deploy with `vercel --prod`

### Environment Variables Setup

In Vercel dashboard:
- Add `TRIPO_API_KEY` (secret)
- Add `TRIPO_API_BASE` = `https://api.tripo3d.ai/v2/openapi`
- Add `ALLOWED_ORIGINS` = `https://your-app.vercel.app`

---

## 13. Monitoring & Observability

### Metrics to Track (Phase 3)

- API response times (p50, p95, p99)
- Depth estimation duration
- Point cloud generation time
- Mesh job success/failure rates
- Client-side error rates
- Browser/device distribution

### Logging Strategy

- Server-side: Log all API errors with context
- Client-side: Console errors for debugging
- Optional: Send errors to service like Sentry (Phase 3)

---

## 14. Future Technical Enhancements

### Phase 4+ (Beyond MVP)

- **Multi-threaded processing:** Web Workers for depth estimation
- **Progressive mesh loading:** Stream large meshes incrementally
- **Texture refinement:** AI-powered texture enhancement
- **Real-time preview:** Show depth map during processing
- **Model caching:** IndexedDB for offline model storage
- **Advanced controls:** Custom camera paths, lighting presets
- **Export options:** Multiple formats (OBJ, STL, PLY)

---

## 15. Known Technical Limitations

- **Depth estimation quality:** MiDaS produces plausible, not accurate depth
- **Browser-only inference:** Limited by client device performance
- **No GPU acceleration:** ONNX Runtime may not use GPU in all browsers
- **Single viewpoint:** Cannot infer occluded surfaces
- **Memory constraints:** Large images may cause OOM on low-end devices
- **Mesh topology:** TripoSR output may have non-manifold geometry

---

## 16. Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

### Git Workflow

- Feature branches for each phase
- Commit after each task completion
- Descriptive commit messages per template
- No direct commits to main

### Code Review Checklist

- [ ] TypeScript types for all functions
- [ ] Error handling for async operations
- [ ] No console.log statements (use proper logging)
- [ ] No hardcoded values (use config)
- [ ] Comments for non-obvious logic
- [ ] Component file size <200 lines

---

## 17. Dependencies

### Production Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.88.0",
  "three": "^0.158.0",
  "onnxruntime-web": "^1.16.0"
}
```

### Development Dependencies

```json
{
  "typescript": "^5.2.2",
  "vite": "^5.0.0",
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "@types/three": "^0.158.0",
  "@vitejs/plugin-react": "^4.2.0"
}
```

---

**Document Status:** Implementation ready  
**Next Steps:** Follow tasks.md for systematic development