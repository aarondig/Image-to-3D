// For production: Leave VITE_API_BASE_URL unset to use relative API paths
// For local dev: Set VITE_API_BASE_URL=http://localhost:5173 in .env.local

// Simulated loading configuration
// Edit this one number to adjust the total loading time for all phases
const TOTAL_LOADING_DURATION_MS = 8000;

// Calculate phase timings - evenly distributed across 8 phases
const PHASE_COUNT = 8;
const PHASE_DURATION = TOTAL_LOADING_DURATION_MS / PHASE_COUNT;

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  maxImageBytes: 10 * 1024 * 1024,
  maxImageDimension: 1024,
  pollIntervalMs: 5000,

  // Always show loading animation regardless of cache/API speed
  totalLoadingDurationMs: TOTAL_LOADING_DURATION_MS,

  // Phase timings (automatically calculated to be evenly distributed)
  // Each phase takes 1/8th of the total duration (1000ms each for 8000ms total)
  phaseTimings: {
    uploading: 0,                       // Starts immediately
    queued: PHASE_DURATION * 1,         // 1000ms
    preprocessing: PHASE_DURATION * 2,  // 2000ms
    depth: PHASE_DURATION * 3,          // 3000ms
    reconstruction: PHASE_DURATION * 4, // 4000ms
    texturing: PHASE_DURATION * 5,      // 5000ms
    compiling: PHASE_DURATION * 6,      // 6000ms
    finalizing: PHASE_DURATION * 7,     // 7000ms
  },
};
