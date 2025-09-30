import { useState } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { StatusDisplay } from './components/StatusDisplay';
import { useMeshJob } from './hooks/useMeshJob';
import { config } from './config';
import type { CreateMeshResponse } from './types/api';

function App() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Poll job status when taskId is available
  const jobStatus = useMeshJob(taskId);

  async function handleImageReady(dataUrl: string) {
    setImageDataUrl(dataUrl);
    setSubmitError(null);
    setIsSubmitting(true);

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
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit image'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setImageDataUrl(null);
    setTaskId(null);
    setIsSubmitting(false);
    setSubmitError(null);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px',
      }}
    >
      <h1
        style={{
          fontSize: '32px',
          marginBottom: '8px',
          textAlign: 'center',
        }}
      >
        Photo to 3D Mesh
      </h1>
      <p
        style={{
          color: '#aaa',
          marginBottom: '40px',
          textAlign: 'center',
        }}
      >
        Upload a photo to generate a 3D model
      </p>

      {!imageDataUrl && <ImageUpload onImageReady={handleImageReady} />}

      {isSubmitting && (
        <p style={{ color: '#4a9eff', marginTop: '20px' }}>
          Submitting to mesh generator...
        </p>
      )}

      {submitError && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            background: '#1a0a0a',
            border: '1px solid #ff4a4a',
            borderRadius: '8px',
            maxWidth: '500px',
          }}
        >
          <p style={{ color: '#ff4a4a', marginBottom: '12px' }}>
            {submitError}
          </p>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {imageDataUrl && taskId && !submitError && (
        <div style={{ marginTop: '20px', width: '100%' }}>
          <StatusDisplay
            status={jobStatus.status === 'IDLE' ? 'QUEUED' : jobStatus.status}
            progress={jobStatus.progress}
            message={jobStatus.message}
            assetUrl={jobStatus.asset?.url}
            error={jobStatus.error || undefined}
          />

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={handleReset}
              style={{
                padding: '12px 24px',
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#333';
              }}
            >
              Upload Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
