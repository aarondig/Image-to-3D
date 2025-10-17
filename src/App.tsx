import { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HomeScreen } from './screens/HomeScreen';
import { UploadScreen } from './screens/UploadScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { ErrorScreen } from './screens/ErrorScreen';
import { useMeshJob } from './hooks/useMeshJob';
import { hashImageData, getCachedResult, cacheResult } from './utils/imageCache';
import { ResponsiveScreen } from './components/ResponsiveScreen';
import type { CreateMeshResponse } from './types/api';
import type { Screen } from './types/screens';

// Lazy load heavy 3D viewer component
const MeshViewerScreen = lazy(() => import('./screens/MeshViewerScreen').then(m => ({ default: m.MeshViewerScreen })));

// Lazy load desktop screens
const DesktopHomeUpload = lazy(() => import('./screens/desktop/DesktopHomeUpload').then(m => ({ default: m.DesktopHomeUpload })));
const DesktopProcessing = lazy(() => import('./screens/desktop/DesktopProcessing').then(m => ({ default: m.DesktopProcessing })));
const DesktopViewer = lazy(() => import('./screens/desktop/DesktopViewer').then(m => ({ default: m.DesktopViewer })));

function App() {
  const [screen, setScreen] = useState<Screen>('HOME');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [cachedModelUrl, setCachedModelUrl] = useState<string | null>(null);
  const [nextAllowedAt, setNextAllowedAt] = useState<number>(0);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // One-time migration: Clear old cache entries with expired signed URLs
  useEffect(() => {
    const migrationKey = 'cache_migration_v2_completed';
    if (!localStorage.getItem(migrationKey)) {
      console.log('🔄 [APP] Running cache migration - clearing old entries with expired URLs');
      const keys = Object.keys(localStorage);
      let cleared = 0;
      for (const key of keys) {
        if (key.startsWith('image3d_cache_')) {
          localStorage.removeItem(key);
          cleared++;
        }
      }
      localStorage.setItem(migrationKey, 'true');
      console.log(`✅ [APP] Migration complete - cleared ${cleared} old cache entries`);
    }
  }, []);

  // Poll job status when taskId is available
  // Pass isCached flag to determine which loading mode to use
  const isCached = !!cachedModelUrl;
  const jobStatus = useMeshJob(taskId, isCached, cachedModelUrl);

  // Cooldown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, nextAllowedAt - Date.now());
      setCooldownSeconds(Math.ceil(remaining / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [nextAllowedAt]);

  // Auto-transition screens based on job status
  useEffect(() => {
    // Don't auto-transition if taskId is null (user cancelled/went back)
    if (!taskId) {
      return;
    }

    const status = jobStatus.status;
    const assetUrl = jobStatus.asset?.url;

    if (status === 'RUNNING' || status === 'QUEUED') {
      if (screen !== 'PROCESSING') {
        setScreen('PROCESSING');
      }
    } else if (status === 'SUCCEEDED' && assetUrl) {
      // Transition to viewer when job completes (both cached and real API)
      // Add a small delay to ensure user sees 100% completion
      if (screen === 'PROCESSING') {
        console.log('✅ [APP] Job completed, transitioning to viewer in 800ms');
        const timer = setTimeout(() => {
          setScreen('MESH_VIEWER');
        }, 800);
        // Cleanup timer if component unmounts or effect re-runs
        return () => clearTimeout(timer);
      }
    } else if (status === 'FAILED' || status === 'TIMEOUT') {
      if (screen !== 'ERROR') {
        setScreen('ERROR');
      }
    }
  }, [jobStatus.status, jobStatus.asset?.url, screen, taskId]);

  // Cache successful results
  useEffect(() => {
    async function cacheSuccessfulResult() {
      if (jobStatus.status === 'SUCCEEDED' && jobStatus.asset?.url && imageDataUrl && taskId) {
        try {
          const imageHash = await hashImageData(imageDataUrl);
          cacheResult(imageHash, {
            taskId,
            modelUrl: jobStatus.asset.url,
            status: 'SUCCEEDED',
          });
          console.log('💾 [APP] Cached successful result for future use');
        } catch (error) {
          console.warn('Failed to cache result:', error);
        }
      }
    }

    cacheSuccessfulResult();
  }, [jobStatus.status, jobStatus.asset?.url, imageDataUrl, taskId]);

  async function handleImageSelected(dataUrl: string) {
    const now = Date.now();
    if (now < nextAllowedAt) return;

    if (!dataUrl?.trim()) {
      setScreen('ERROR');
      return;
    }

    setNextAllowedAt(now + 30000);
    setImageDataUrl(dataUrl);
    setScreen('PROCESSING');

    try {
      // Check cache first to avoid duplicate API calls
      console.log('🔍 [APP] Checking cache for uploaded image...');
      const imageHash = await hashImageData(dataUrl);
      const cachedResult = getCachedResult(imageHash);

      if (cachedResult && cachedResult.status === 'SUCCEEDED' && cachedResult.taskId) {
        console.log('⚡ [APP] Found cached taskId! Fetching fresh status with valid signed URL...');
        // Use the cached taskId but fetch fresh status to get a valid signed URL
        // Signed URLs expire, so we can't use the cached modelUrl directly
        setTaskId(cachedResult.taskId);
        setCachedModelUrl(null); // Don't use cached URL - let useMeshJob fetch fresh one

        // useMeshJob will poll the status API and get a fresh signed URL
        return;
      }

      console.log('📡 [APP] No cache found, calling API...');
      const response = await fetch('/api/create-mesh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          image: dataUrl,
          options: {
            target_format: 'glb',
            quality: 'high',
          },
          imageHash, // Send hash to server for server-side caching
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 402) {
          throw new Error(error.detail || 'Daily generation limit reached. Try again tomorrow.');
        }
        throw new Error(error.error || 'Failed to create mesh job');
      }

      const data: CreateMeshResponse = await response.json();
      setTaskId(data.taskId);
    } catch (error) {
      setScreen('ERROR');
    }
  }


  // Navigation handlers
  const handleReset = () => {
    setScreen('UPLOAD');
    setImageDataUrl(null);
    setTaskId(null);
    setCachedModelUrl(null);
  };

  const handleGetStarted = () => setScreen('UPLOAD');

  const handleBackFromUpload = () => {
    setScreen('HOME');
    setImageDataUrl(null);
    setTaskId(null);
    setCachedModelUrl(null);
  };

  const handleBackFromProcessing = () => {
    setScreen('UPLOAD');
    setImageDataUrl(null);
    setTaskId(null);
    setCachedModelUrl(null);
  };

  const handleErrorRetry = () => {
    setScreen('UPLOAD');
    setImageDataUrl(null);
    setTaskId(null);
    setCachedModelUrl(null);
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {(screen === 'HOME' || screen === 'UPLOAD') && (
        <ResponsiveScreen
          mobile={
            <motion.div
              key="mobile-home-upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {screen === 'HOME' ? (
                <HomeScreen onGetStarted={handleGetStarted} />
              ) : (
                <UploadScreen
                  onImageSelected={handleImageSelected}
                  onBack={handleBackFromUpload}
                  cooldownSeconds={cooldownSeconds}
                />
              )}
            </motion.div>
          }
          desktop={
            <Suspense fallback={
              <div className="bg-neutral-900 min-h-screen flex items-center justify-center">
                <div className="text-white text-sm">Loading...</div>
              </div>
            }>
              <DesktopHomeUpload
                onImageSelected={handleImageSelected}
                onLogoClick={handleBackFromUpload}
                cooldownSeconds={cooldownSeconds}
              />
            </Suspense>
          }
        />
      )}

      {screen === 'PROCESSING' && imageDataUrl && (
        <ResponsiveScreen
          mobile={
            <motion.div
              key="mobile-processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProcessingScreen
                image={imageDataUrl}
                progress={jobStatus.progress}
                currentPhase={jobStatus.currentPhase}
                phaseHistory={jobStatus.phaseHistory}
                queuePosition={jobStatus.queuePosition}
                engineName={jobStatus.engineName}
                isComplete={jobStatus.status === 'SUCCEEDED'}
                onBack={handleBackFromProcessing}
              />
            </motion.div>
          }
          desktop={
            <Suspense fallback={
              <div className="bg-neutral-900 min-h-screen flex items-center justify-center">
                <div className="text-white text-sm">Loading...</div>
              </div>
            }>
              <DesktopProcessing
                image={imageDataUrl}
                progress={jobStatus.progress}
                currentPhase={jobStatus.currentPhase}
                phaseHistory={jobStatus.phaseHistory}
                queuePosition={jobStatus.queuePosition}
                engineName={jobStatus.engineName}
                isComplete={jobStatus.status === 'SUCCEEDED'}
                onBack={handleBackFromProcessing}
                onLogoClick={handleReset}
              />
            </Suspense>
          }
        />
      )}

      {screen === 'MESH_VIEWER' && jobStatus.asset?.url ? (
        <ResponsiveScreen
          mobile={
            <motion.div
              key="mobile-mesh-viewer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Suspense fallback={
                <div className="bg-[#141414] min-h-screen flex items-center justify-center">
                  <div className="text-white text-sm">Loading 3D viewer...</div>
                </div>
              }>
                <MeshViewerScreen
                  modelUrl={jobStatus.asset.url}
                  onUploadAnother={handleReset}
                />
              </Suspense>
            </motion.div>
          }
          desktop={
            <Suspense fallback={
              <div className="bg-neutral-900 min-h-screen flex items-center justify-center">
                <div className="text-white text-sm">Loading 3D viewer...</div>
              </div>
            }>
              <DesktopViewer
                modelUrl={jobStatus.asset.url}
                onUploadAnother={handleReset}
              />
            </Suspense>
          }
        />
      ) : screen === 'MESH_VIEWER' ? (
        /* If we're on MESH_VIEWER screen but no URL, show error */
        <motion.div
          key="mesh-viewer-error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ErrorScreen
            error="No model URL available"
            onRetry={handleErrorRetry}
          />
        </motion.div>
      ) : null}

      {screen === 'ERROR' && (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ErrorScreen
            error={jobStatus.error || 'Failed to generate 3D model'}
            onRetry={handleErrorRetry}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
