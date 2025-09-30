# Product Requirements Document (PRD)

## Single-Photo → Point Cloud & Full 3D Model Web App

**Version:** 1.0  
**Last Updated:** September 30, 2025  
**Project Timeline:** Phased development with quick wins

---

## 1. Product Vision

Create a web app that turns a single uploaded photo into two types of interactive 3D experiences:

- **Instant 2.5D Mode (default):** Generate a point cloud using MiDaS depth estimation, rendered immediately in the browser.
- **Full 3D Mode (beta):** Trigger TripoSR in the background to infer a complete 360° mesh. When ready, surface the downloadable/interactive mesh in the same viewer.

The result should feel immediate, visually striking, and easy to share through free hosting.

---

## 2. Key User Stories

- **Upload:** I can upload a JPG/PNG photo.
- **Generate (instant):** I see a point cloud visualization of my photo within a few seconds.
- **Generate (background):** The system simultaneously starts building a full 3D mesh in the background.
- **Switch:** Once the mesh is ready, I can view it in the same 3D viewer.
- **Interact:** I can orbit, pan, and zoom smoothly.
- **Retry:** I can upload another photo without refreshing.
- **Share:** A deployed link is accessible to anyone.

---

## 3. Technical Architecture

### Frontend

- React with `@react-three/fiber` and `@react-three/drei`
- Image uploader + preview
- Point cloud generator:
  - Runs MiDaS in-browser (via ONNX Runtime Web or equivalent)
  - Converts depth + color pixels into point geometry
- Viewer:
  - OrbitControls (with constraints in 2.5D mode, full rotation in mesh mode)
  - Sliders: point size, depth scale, color mode
  - Fog, vignette, reset view button

### Backend (serverless API)

- `/api/create-mesh`: Forwards uploaded image to a hosted TripoSR endpoint
- `/api/status?id=...`: Polls for job completion, returns mesh URL (GLB/OBJ)
- Keys hidden; CORS handled by proxy
- **Stateless polling** (no KV storage for MVP)

### Hosting

- Vercel (static hosting + serverless functions)
- Free tier with environment variables for API keys

---

## 4. User Journey

1. Upload photo
2. **Instant point cloud:** MiDaS depth runs immediately → viewer updates in seconds
3. **Background full 3D:** In parallel, request is sent to TripoSR endpoint
4. **Status check:** Frontend polls until asset ready
5. **Switch mode:** Once available, toggle viewer from point cloud to full mesh
6. Continue exploring: User can orbit fully, adjust controls, or upload a new photo

---

## 5. Features

### Core (MVP - Phase 1)

- File upload with drag-and-drop
- Depth map inference (MiDaS)
- Point cloud rendering (R3F)
- Basic orbit/pan/zoom
- Controls: reset, point size, depth scale
- Backend API integration with Tripo
- Polling mechanism with status updates

### Full 3D (Phase 2)

- Background mesh generation via TripoSR API
- Polling mechanism + status updates ("Generating mesh...")
- Viewer switch to mesh mode (GLTF/OBJ loader)
- Mode toggle between point cloud and mesh

### Optional Polish (Phase 3)

- Depth cleanup (blur/smoothing)
- Lighting/shading for normals
- Export point cloud to .PLY
- Auto-orbit flythrough animation
- Comprehensive error handling
- Mobile optimization
- Analytics and monitoring

---

## 6. Constraints

### Technical Constraints

- Image input capped at 2 MB, auto-resized to ≤768 px for performance
- Point cloud capped at ~200k points for smooth rendering
- Mesh generation may take 30–90 seconds
- Generative output is plausible, not exact

### API Limitations (Tripo Basic Tier)

- **300 credits/month** - Must be conservative with requests
- **1 concurrent task** - Queue management not needed but could cause delays
- **1-day history** - No job persistence beyond 24 hours
- **Limited export formats** - GLB primary format
- **Limited queue priority** - May experience longer wait times

### Browser Compatibility

- Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- WebGL 2.0 required
- Minimum 4GB RAM recommended for smooth point cloud rendering

---

## 7. Success Criteria

### Phase 1 (Day 1)
- First visualization appears <10s after upload
- Backend successfully proxies Tripo API calls
- Deployed to Vercel with working HTTPS endpoint
- No API keys exposed in client code

### Phase 2 (Day 2-3)
- Point cloud renders with <200k points at 30+ FPS
- Mesh loads and displays correctly when ready
- Mode switching works smoothly
- Full 3D mesh returns successfully for 80%+ of test images

### Phase 3 (Week 1)
- Smooth performance on laptops (60 FPS point cloud, 30 FPS mesh)
- Graceful error handling for all failure modes
- Mobile responsive (adaptive point density)
- Comprehensive documentation

---

## 8. Phased Development Strategy

### Phase 1: Core Upload & Backend Integration (2-3 hours)
**Goal:** Get something working and deployed fast

**Scope:**
- Image upload with validation and resize
- Backend API routes (even if initially stubbed)
- Basic status polling
- Deploy to Vercel

**Deliverable:** A working prototype where users can upload and see processing status

**Why this first:** Validates the hardest unknowns (API integration, deployment) early

---

### Phase 2: Point Cloud Visualization (6-8 hours)
**Goal:** Add the instant visual feedback that makes the app compelling

**Scope:**
- MiDaS depth estimation (client-side)
- Point cloud generation from depth map
- Three.js viewer with OrbitControls
- Basic controls (point size, depth scale, reset)
- Mode switching when mesh ready

**Deliverable:** Full dual-mode experience (instant point cloud + background mesh)

**Why second:** Once backend works, this adds the "wow factor" that differentiates the product

---

### Phase 3: Polish & Edge Cases (10-15 hours)
**Goal:** Make it production-ready

**Scope:**
- Comprehensive error handling
- UX polish (loading states, transitions, mobile)
- Optional features (PLY export, auto-orbit, depth cleanup)
- Performance optimization
- Cross-browser testing
- Documentation

**Deliverable:** Production-ready application with professional UX

**Why last:** Polish doesn't matter if core functionality doesn't work

---

## 9. Risk Assessment & Mitigation

### High Risk: MiDaS Browser Performance
**Risk:** Depth estimation too slow or memory-intensive for browser  
**Mitigation:** 
- Use ONNX Runtime Web (lighter than TensorFlow.js)
- Consider Depth-Anything model (faster, smaller)
- Fallback: Skip point cloud, only do mesh generation
- Test early in Phase 2 and pivot if necessary

### Medium Risk: Tripo API Credit Limits
**Risk:** 300 credits/month exhausted during development/testing  
**Mitigation:**
- Use stubbed responses during development
- Test with real API only for critical path validation
- Implement request tracking to monitor credit usage
- Add user-facing message when approaching limit

### Medium Risk: Mesh Generation Time
**Risk:** 30-90 second wait frustrates users  
**Mitigation:**
- Point cloud provides instant gratification
- Clear progress indicators and ETA
- Non-blocking UI (can still interact with point cloud)
- Option to continue exploring while mesh generates

### Low Risk: Browser Compatibility
**Risk:** Older browsers don't support WebGL 2.0  
**Mitigation:**
- Feature detection with graceful degradation message
- Target modern browsers explicitly in docs
- Minimal testing on legacy browsers (not worth time)

---

## 10. Out of Scope (Future Versions)

- Multi-image input (photo sequences)
- Video to 3D
- Texture refinement or editing tools
- User accounts or saved history
- Batch processing
- Custom model training
- Commercial/paid tiers
- Social sharing beyond URL
- Advanced mesh editing (retopology, UV unwrapping)

---

## 11. Acceptance Criteria

Before considering Phase 1 complete:
- [ ] User can upload an image via drag-drop or file picker
- [ ] Image is validated (type, size) with clear error messages
- [ ] Image is resized to 768px automatically
- [ ] Backend API accepts image and returns taskId
- [ ] Status polling works and updates UI
- [ ] Deployed URL works end-to-end
- [ ] No console errors in browser
- [ ] No exposed API keys in client code

Before considering Phase 2 complete:
- [ ] Depth estimation runs in <10s for typical images
- [ ] Point cloud renders at 30+ FPS
- [ ] OrbitControls work smoothly
- [ ] Sliders adjust point size and depth scale
- [ ] Mesh loads when ready and displays correctly
- [ ] Mode toggle switches between point cloud and mesh
- [ ] "View Mesh" banner appears when ready

Before considering Phase 3 complete:
- [ ] All error states have user-friendly messages
- [ ] Works on Chrome, Firefox, Safari, Edge (latest versions)
- [ ] Responsive on tablets (minimum)
- [ ] README has setup and deployment instructions
- [ ] Code has JSDoc comments for complex functions
- [ ] No TypeScript errors
- [ ] Performance profiled and optimized

---

## 12. Metrics to Track (Post-Launch)

- Upload success rate
- Average depth estimation time
- Mesh generation success rate
- Average mesh generation time
- Point cloud FPS (median, p95)
- Browser/device distribution
- Error types and frequency
- API credit consumption rate

---

## 13. Known Limitations

- **Depth estimation is approximate:** MiDaS produces plausible depth, not accurate measurements
- **Single viewpoint:** Point cloud only shows the visible surface from the photo
- **Mesh quality varies:** TripoSR works best with clear objects on simple backgrounds
- **No real-time processing:** Mesh generation requires 30-90s wait
- **Free tier constraints:** Limited to 300 Tripo API calls per month
- **Modern browsers only:** No support for IE11 or older mobile browsers

---

## 14. Questions for Future Consideration

- Should we add a gallery of example results?
- Would users pay for faster processing or higher quality?
- Is there value in allowing users to save/share their 3D models?
- Should we support other 3D generation providers (Meshy, InstantMesh)?
- Would a mobile app version be worthwhile?

---

**Document Status:** Ready for implementation  
**Next Steps:** Begin Phase 1 development per tasks.md