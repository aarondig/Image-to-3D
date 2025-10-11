import { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { HomeScreen } from './screens/HomeScreen';
import { UploadScreen } from './screens/UploadScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { ErrorScreen } from './screens/ErrorScreen';
import { useMeshJob } from './hooks/useMeshJob';
import type { CreateMeshResponse } from './types/api';
import type { Screen } from './types/screens';

// Lazy load heavy 3D viewer component
const MeshViewerScreen = lazy(() => import('./screens/MeshViewerScreen').then(m => ({ default: m.MeshViewerScreen })));

function App() {
  const [screen, setScreen] = useState<Screen>('HOME');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [nextAllowedAt, setNextAllowedAt] = useState<number>(0);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Poll job status when taskId is available
  const jobStatus = useMeshJob(taskId);

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
    const assetUrl = jobStatus.asset?.url;

    if (status === 'RUNNING' || status === 'QUEUED') {
      if (screen !== 'PROCESSING') {
        setScreen('PROCESSING');
      }
    } else if (status === 'SUCCEEDED' && assetUrl) {
      if (screen !== 'MESH_VIEWER') {
        setScreen('MESH_VIEWER');
      }
    } else if (status === 'FAILED' || status === 'TIMEOUT') {
      if (screen !== 'ERROR') {
        setScreen('ERROR');
      }
    }
  }, [jobStatus.status, jobStatus.asset?.url, screen]);

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
  };

  const handleGetStarted = () => setScreen('UPLOAD');

  const handleBackFromUpload = () => {
    setScreen('HOME');
    setImageDataUrl(null);
    setTaskId(null);
  };

  const handleBackFromProcessing = () => {
    setScreen('UPLOAD');
    setImageDataUrl(null);
    setTaskId(null);
  };

  const handleErrorRetry = () => {
    setScreen('UPLOAD');
    setImageDataUrl(null);
    setTaskId(null);
  };

  return (
    <AnimatePresence mode="wait">
      {screen === 'HOME' && (
        <HomeScreen key="home" onGetStarted={handleGetStarted} />
      )}

      {screen === 'UPLOAD' && (
        <UploadScreen
          key="upload"
          onImageSelected={handleImageSelected}
          onBack={handleBackFromUpload}
          cooldownSeconds={cooldownSeconds}
        />
      )}

      {screen === 'PROCESSING' && imageDataUrl && (
        <ProcessingScreen
          key="processing"
          image={imageDataUrl}
          progress={jobStatus.progress}
          status={jobStatus.message || 'Processing...'}
          isComplete={jobStatus.status === 'SUCCEEDED'}
          onBack={handleBackFromProcessing}
        />
      )}

      {screen === 'MESH_VIEWER' && jobStatus.asset?.url ? (
        <Suspense fallback={<ProcessingScreen key="loading" image={imageDataUrl || ''} progress={1} status="Loading 3D viewer..." />}>
          <MeshViewerScreen
            key="mesh-viewer"
            modelUrl={jobStatus.asset.url}
            onUploadAnother={handleReset}
          />
        </Suspense>
      ) : screen === 'MESH_VIEWER' ? (
        /* If we're on MESH_VIEWER screen but no URL, show error */
        <ErrorScreen
          key="error-no-url"
          error="No model URL available"
          onRetry={handleErrorRetry}
        />
      ) : null}

      {screen === 'ERROR' && (
        <ErrorScreen
          key="error"
          error={jobStatus.error || 'Failed to generate 3D model'}
          onRetry={handleErrorRetry}
        />
      )}
    </AnimatePresence>
  );
}

export default App;
