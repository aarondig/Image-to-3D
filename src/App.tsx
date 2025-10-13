import { useState, useEffect, lazy, Suspense } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { UploadScreen } from './screens/UploadScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { ErrorScreen } from './screens/ErrorScreen';
import { useMeshJob } from './hooks/useMeshJob';
import { hashImageData, getCachedResult, cacheResult } from './utils/imageCache';
import type { CreateMeshResponse } from './types/api';
import type { Screen } from './types/screens';

// Lazy load heavy 3D viewer component
const MeshViewerScreen = lazy(() => import('./screens/MeshViewerScreen').then(m => ({ default: m.MeshViewerScreen })));

function App() {
  const [screen, setScreen] = useState<Screen>('HOME');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [cachedModelUrl, setCachedModelUrl] = useState<string | null>(null);
  const [nextAllowedAt, setNextAllowedAt] = useState<number>(0);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Poll job status when taskId is available
  // For cached results, useMeshJob will simulate loading but won't make API calls
  const jobStatus = useMeshJob(taskId, cachedModelUrl);

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
    const status = jobStatus.status;
    const assetUrl = jobStatus.asset?.url || cachedModelUrl;

    if (status === 'RUNNING' || status === 'QUEUED') {
      if (screen !== 'PROCESSING') {
        setScreen('PROCESSING');
      }
    } else if ((status === 'SUCCEEDED' && assetUrl) || (jobStatus.currentPhase === 'ready' && cachedModelUrl)) {
      // Only transition if we're still on PROCESSING screen
      // This prevents re-triggering when already on MESH_VIEWER
      // Also transition when we reach 'ready' phase with cached model
      if (screen === 'PROCESSING') {
        setScreen('MESH_VIEWER');
      }
    } else if (status === 'FAILED' || status === 'TIMEOUT') {
      if (screen !== 'ERROR') {
        setScreen('ERROR');
      }
    }
  }, [jobStatus.status, jobStatus.asset?.url, jobStatus.currentPhase, cachedModelUrl, screen]);

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

      if (cachedResult && cachedResult.status === 'SUCCEEDED' && cachedResult.modelUrl) {
        console.log('⚡ [APP] Using cached result! Saved API call.');
        // Still set taskId to trigger the 8-second loading animation
        // The useMeshJob hook will simulate progress and then show the cached result
        setTaskId(cachedResult.taskId);
        setCachedModelUrl(cachedResult.modelUrl);

        // The loading animation will run in ProcessingScreen via useMeshJob
        // After 8 seconds, the useEffect below will transition to MESH_VIEWER
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
    <>
      {screen === 'HOME' && (
        <HomeScreen onGetStarted={handleGetStarted} />
      )}

      {screen === 'UPLOAD' && (
        <UploadScreen
          onImageSelected={handleImageSelected}
          onBack={handleBackFromUpload}
          cooldownSeconds={cooldownSeconds}
        />
      )}

      {screen === 'PROCESSING' && imageDataUrl && (
        <ProcessingScreen
          image={imageDataUrl}
          progress={jobStatus.progress}
          currentPhase={jobStatus.currentPhase}
          phaseHistory={jobStatus.phaseHistory}
          phaseStartTime={jobStatus.phaseStartTime}
          queuePosition={jobStatus.queuePosition}
          engineName={jobStatus.engineName}
          isComplete={jobStatus.status === 'SUCCEEDED'}
          onBack={handleBackFromProcessing}
        />
      )}

      {screen === 'MESH_VIEWER' && (cachedModelUrl || jobStatus.asset?.url) ? (
        <Suspense fallback={<ProcessingScreen image={imageDataUrl || ''} progress={1} currentPhase="ready" phaseHistory={[]} phaseStartTime={Date.now()} />}>
          <MeshViewerScreen
            modelUrl={cachedModelUrl || jobStatus.asset!.url}
            onUploadAnother={handleReset}
          />
        </Suspense>
      ) : screen === 'MESH_VIEWER' ? (
        /* If we're on MESH_VIEWER screen but no URL, show error */
        <ErrorScreen
          error="No model URL available"
          onRetry={handleErrorRetry}
        />
      ) : null}

      {screen === 'ERROR' && (
        <ErrorScreen
          error={jobStatus.error || 'Failed to generate 3D model'}
          onRetry={handleErrorRetry}
        />
      )}
    </>
  );
}

export default App;
