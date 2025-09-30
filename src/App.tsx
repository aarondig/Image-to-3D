import { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { ImageUpload } from './components/ImageUpload';
import { StatusDisplay } from './components/StatusDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Photo to 3D Mesh
          </h1>
          <p className="text-muted-foreground">
            Upload a photo to generate a 3D model
          </p>
        </div>

        {/* Upload Section */}
        {!imageDataUrl && <ImageUpload onImageReady={handleImageReady} />}

        {/* Submitting State */}
        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm">Submitting to mesh generator...</p>
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <Card className="border-destructive">
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-destructive text-center">
                {submitError}
              </p>
              <div className="flex justify-center">
                <Button onClick={handleReset} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Display */}
        {imageDataUrl && taskId && !submitError && (
          <div className="space-y-6">
            <StatusDisplay
              status={jobStatus.status === 'IDLE' ? 'QUEUED' : jobStatus.status}
              progress={jobStatus.progress}
              message={jobStatus.message}
              assetUrl={jobStatus.asset?.url}
              error={jobStatus.error || undefined}
            />

            <div className="flex justify-center">
              <Button onClick={handleReset} variant="secondary">
                <RotateCcw className="mr-2 h-4 w-4" />
                Upload Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
