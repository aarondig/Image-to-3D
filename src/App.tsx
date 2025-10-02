import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { UploadScreen } from './screens/UploadScreen';
import { ProcessingScreen } from './screens/ProcessingScreen';
import { MeshViewerScreen } from './screens/MeshViewerScreen';
import { ErrorScreen } from './screens/ErrorScreen';
import { useMeshJob } from './hooks/useMeshJob';
import { config } from './config';
import type { CreateMeshResponse, JobStatus } from './types/api';
import type { Screen } from './types/screens';

function App() {
  const [screen, setScreen] = useState<Screen>('UPLOAD');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  // Poll job status when taskId is available
  const jobStatus = useMeshJob(taskId);

  // Auto-transition screens based on job status
  const handleStatusChange = (status: JobStatus, assetUrl?: string) => {
    if (status === 'RUNNING' || status === 'QUEUED') {
      setScreen('PROCESSING');
    } else if (status === 'SUCCEEDED' && assetUrl) {
      setScreen('MESH_VIEWER');
    } else if (status === 'FAILED' || status === 'TIMEOUT') {
      setScreen('ERROR');
    }
  };

  // Watch for job status changes
  if (jobStatus.status !== 'IDLE') {
    handleStatusChange(jobStatus.status, jobStatus.asset?.url);
  }

  async function handleImageSelected(dataUrl: string) {
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
    setScreen('UPLOAD');
    setImageDataUrl(null);
    setTaskId(null);
  }

  return (
    <AnimatePresence mode="wait">
      {screen === 'UPLOAD' && (
        <UploadScreen key="upload" onImageSelected={handleImageSelected} />
      )}

      {screen === 'PROCESSING' && imageDataUrl && (
        <ProcessingScreen
          key="processing"
          image={imageDataUrl}
          progress={jobStatus.progress}
          status={jobStatus.message || 'Processing...'}
        />
      )}

      {screen === 'MESH_VIEWER' && jobStatus.asset?.url && (
        <MeshViewerScreen
          key="mesh-viewer"
          modelUrl={jobStatus.asset.url}
          onUploadAnother={handleReset}
        />
      )}

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
