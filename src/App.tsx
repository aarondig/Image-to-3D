import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { HomeScreen } from './screens/HomeScreen';
import { UploadScreen } from './screens/UploadScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { MeshViewerScreen } from './screens/MeshViewerScreen';
import { ErrorScreen } from './screens/ErrorScreen';
import { useMeshJob } from './hooks/useMeshJob';
import type { CreateMeshResponse } from './types/api';
import type { Screen } from './types/screens';

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

  // Auto-transition screens based on job status (using useEffect to avoid render-time state updates)
  useEffect(() => {
    const status = jobStatus.status;
    const assetUrl = jobStatus.asset?.url;

    console.log('App: Job status changed', { status, assetUrl, currentScreen: screen });

    if (status === 'RUNNING' || status === 'QUEUED') {
      if (screen !== 'PROCESSING') {
        console.log('App: Transitioning to PROCESSING');
        setScreen('PROCESSING');
      }
    } else if (status === 'SUCCEEDED' && assetUrl) {
      if (screen !== 'MESH_VIEWER') {
        console.log('App: Transitioning to MESH_VIEWER with URL', assetUrl);
        setScreen('MESH_VIEWER');
      }
    } else if (status === 'FAILED' || status === 'TIMEOUT') {
      if (screen !== 'ERROR') {
        console.log('App: Transitioning to ERROR');
        setScreen('ERROR');
      }
    }
  }, [jobStatus.status, jobStatus.asset?.url, screen]);

  async function handleImageSelected(dataUrl: string) {
    // Guard: Check cooldown
    const now = Date.now();
    if (now < nextAllowedAt) {
      console.log('App: Cooldown active, ignoring request');
      return;
    }

    // Guard: Validate dataUrl before processing
    if (!dataUrl || typeof dataUrl !== 'string' || dataUrl.trim() === '') {
      console.error('App: Invalid image data URL');
      setScreen('ERROR');
      return;
    }

    // Set cooldown (30 seconds)
    setNextAllowedAt(now + 30000);

    setImageDataUrl(dataUrl);
    setScreen('PROCESSING');

    try {
      const response = await fetch('/api/create-mesh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: send cookies for credit tracking
        body: JSON.stringify({
          image: dataUrl,
          options: {
            target_format: 'glb',
            quality: 'high', // Always use high quality (768px)
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Handle credit limit exceeded
        if (response.status === 402) {
          throw new Error(error.detail || 'Daily generation limit reached. Try again tomorrow.');
        }

        throw new Error(error.error || 'Failed to create mesh job');
      }

      const data: CreateMeshResponse = await response.json();
      setTaskId(data.taskId);
    } catch (error) {
      console.error('Error submitting image:', error);
      setScreen('ERROR');
    }
  }

  function handleReset() {
    setScreen('HOME');
    setImageDataUrl(null);
    setTaskId(null);
  }

  function handleGetStarted() {
    setScreen('UPLOAD');
  }

  function handleBackFromUpload() {
    setScreen('HOME');
  }

  function handleBackFromProcessing() {
    setScreen('UPLOAD');
  }

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
        <MeshViewerScreen
          key="mesh-viewer"
          modelUrl={jobStatus.asset.url}
          usdzUrl={jobStatus.asset.usdzUrl}
          onUploadAnother={handleReset}
        />
      ) : screen === 'MESH_VIEWER' ? (
        /* If we're on MESH_VIEWER screen but no URL, show error */
        <ErrorScreen
          key="error-no-url"
          error="No model URL available"
          onRetry={handleReset}
        />
      ) : null}

      {screen === 'ERROR' && (
        <ErrorScreen
          key="error"
          error={jobStatus.error || 'Failed to generate 3D model'}
          onRetry={handleReset}
        />
      )}
    </AnimatePresence>
  );
}

export default App;
