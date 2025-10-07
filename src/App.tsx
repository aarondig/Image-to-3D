import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { HomeScreen } from './screens/HomeScreen';
import { UploadScreen } from './screens/UploadScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { MeshViewerScreen } from './screens/MeshViewerScreen';
import { ErrorScreen } from './screens/ErrorScreen';
import { useMeshJob } from './hooks/useMeshJob';
import { config } from './config';
import type { CreateMeshResponse } from './types/api';
import type { Screen } from './types/screens';

function App() {
  const [screen, setScreen] = useState<Screen>('HOME');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  // Poll job status when taskId is available
  const jobStatus = useMeshJob(taskId);

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
    // Guard: Validate dataUrl before processing
    if (!dataUrl || typeof dataUrl !== 'string' || dataUrl.trim() === '') {
      console.error('App: Invalid image data URL');
      setScreen('ERROR');
      return;
    }

    setImageDataUrl(dataUrl);
    setScreen('PROCESSING');

    try {
      const apiBaseUrl = config.apiBaseUrl || '';
      const response = await fetch(`${apiBaseUrl}/api/create-mesh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: dataUrl,
          options: {
            target_format: 'glb',
            quality: 'fast',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
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
