Screens:
1. Upload
   - Large centered drag-and-drop upload area with “Upload Photo” button.
   - After file selection, show accurate percentage-based Upload Progress Bar.
   - Do not display photo preview until upload completes.

2. Depth Processing / Point Cloud Loading
   - Show uploaded photo preview in a header.
   - Main area: dark 3D canvas placeholder with spinner and shimmer skeleton.
   - Progress bar labeled “Estimating depth…” with percentage if available, else animated indeterminate bar.
   - Disable all controls until processing is finished.

3. Point Cloud Viewer
   - Top: status pill saying “Full 3D: generating…”.
   - Center: 3D viewer canvas with OrbitControls (limited rotation).
   - Side or bottom controls: 
     - Slider: Point Size
     - Slider: Depth Strength
     - Toggle: Color Mode (RGB / Depth / Heatmap)
     - Reset View button
     - Upload Another button
   - Clean, modern card style with rounded corners and soft shadows.

4. Full 3D Ready
   - Status pill transforms into a button “View Full 3D (beta)”.
   - User clicks to switch.

5. Full 3D Mesh Viewer
   - Same layout as point cloud viewer.
   - 3D canvas shows imported GLB mesh, OrbitControls unlocked for full 360°.
   - Add “Back to Point Cloud” button.
   - Error fallback: message “Full 3D failed — still enjoy the point cloud ✨”.

6. Error Screens
   - Upload error: “Upload failed. Try again.”
   - Depth processing error: “Retry Generate Point Cloud” button.
   - Full 3D error: friendly message + retry option.

Style:
- Minimalist, dark background, clean typography. Sans Serif fonts.
- Focus on clarity, progress visibility, and interactive feel.
- Rounded corners, modern demo-style design.