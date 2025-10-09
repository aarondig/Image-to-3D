import { Suspense, useEffect, useState } from 'react';
import '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Linkedin, ArrowUpRight, X } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { Header } from '@/components/layout/Header';
import { ConversionLoadingCard } from '@/components/ConversionLoadingCard';
import { safeHref } from '@/lib/safeUrl';

type ExportFormat = 'glb' | 'usdz';

interface MeshViewerScreenProps {
  modelUrl: string;
  onUploadAnother: () => void;
}

function Model({ url }: { url: string }) {
  // Guard: Don't even try to load if URL is invalid
  if (!url || typeof url !== 'string' || url.trim() === '') {
    console.error('Model: Invalid URL provided', url);
    return <Loader />;
  }

  const proxyUrl = `/api/proxy-model?url=${encodeURIComponent(url)}`;
  console.log('Model: Loading from proxyUrl', proxyUrl);

  let gltf;
  try {
    gltf = useGLTF(proxyUrl);
    console.log('Model: GLTF loaded', { hasGltf: !!gltf, hasScene: !!gltf?.scene, scene: gltf?.scene });
  } catch (error) {
    console.error('Model: useGLTF threw error', error);
    throw error; // Re-throw to be caught by ErrorBoundary
  }

  if (!gltf || !gltf.scene) {
    console.error('GLTF scene is undefined', { gltf, hasGltf: !!gltf });
    return <Loader />;
  }

  // Extra safety: Clone the scene to avoid reference issues
  const scene = gltf.scene.clone();

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

// Preload the model to avoid issues
function PreloadModel({ url }: { url: string }) {
  const proxyUrl = `/api/proxy-model?url=${encodeURIComponent(url)}`;

  useEffect(() => {
    useGLTF.preload(proxyUrl);
  }, [proxyUrl]);

  return null;
}

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hsl(var(--primary))" wireframe />
    </mesh>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
        <p className="text-sm text-destructive">Failed to load 3D model</p>
        <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
      </div>
    </div>
  );
}

export function MeshViewerScreen({
  modelUrl,
  onUploadAnother,
}: MeshViewerScreenProps) {
  // Guard: Don't render if modelUrl is invalid
  if (!modelUrl || typeof modelUrl !== 'string' || modelUrl.trim() === '') {
    console.error('MeshViewerScreen: Invalid modelUrl', modelUrl);
    return (
      <div className="flex h-svh w-full items-center justify-center">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">Invalid model URL</p>
          <button onClick={onUploadAnother} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-full">
            Upload Another
          </button>
        </div>
      </div>
    );
  }

  console.log('MeshViewerScreen: Rendering with modelUrl', modelUrl);

  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);

  const handleDownload = async (format: ExportFormat) => {
    if (format === 'glb') {
      // GLB - direct download
      const downloadUrl = `/api/proxy-model?url=${encodeURIComponent(modelUrl)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'model.glb';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowFormatSelector(false);
      return;
    }

    // USDZ - need to convert first
    setIsConverting(true);
    setShowFormatSelector(false);
    setConversionProgress(10);

    try {
      // Extract the original taskId from the GLB URL
      // URL format: https://tmp.tripo3d.ai/..../[taskId].glb
      const taskId = new URL(modelUrl).pathname.split('/').pop()?.replace('.glb', '');

      if (!taskId) {
        throw new Error('Could not extract task ID from model URL');
      }

      console.log('[USDZ-DOWNLOAD] Starting conversion for task:', taskId);
      setConversionProgress(20);

      // Step 1: Request USDZ conversion from Tripo
      const conversionResponse = await fetch('/api/convert-to-usdz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      if (!conversionResponse.ok) {
        const errorData = await conversionResponse.json();
        throw new Error(errorData.error || 'Conversion request failed');
      }

      const { taskId: conversionTaskId } = await conversionResponse.json();
      console.log('[USDZ-DOWNLOAD] Conversion task created:', conversionTaskId);
      setConversionProgress(40);

      // Step 2: Poll status endpoint until conversion is complete
      let usdzUrl: string | null = null;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max (1 second intervals)

      while (!usdzUrl && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;

        const statusResponse = await fetch(`/api/status?taskId=${conversionTaskId}`);

        if (!statusResponse.ok) {
          throw new Error('Failed to check conversion status');
        }

        const statusData = await statusResponse.json();
        console.log('[USDZ-DOWNLOAD] Status check:', statusData.status);

        // Update progress based on status
        if (statusData.status === 'running') {
          setConversionProgress(Math.min(40 + attempts * 1.5, 85));
        }

        if (statusData.status === 'success' && statusData.modelUrl) {
          usdzUrl = statusData.modelUrl;
          setConversionProgress(95);
          break;
        }

        if (statusData.status === 'failed') {
          throw new Error('Conversion failed on Tripo servers');
        }
      }

      if (!usdzUrl) {
        throw new Error('Conversion timeout - please try again');
      }

      console.log('[USDZ-DOWNLOAD] Conversion complete, downloading:', usdzUrl);
      setConversionProgress(100);

      // Step 3: Download the USDZ file
      const downloadUrl = `/api/proxy-model?url=${encodeURIComponent(usdzUrl)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'model.usdz';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Close the loading card after a brief delay
      setTimeout(() => {
        setIsConverting(false);
        setConversionProgress(0);
      }, 500);
    } catch (error) {
      console.error('[USDZ-DOWNLOAD] Error:', error);
      alert(error instanceof Error ? error.message : 'Conversion failed');
      setIsConverting(false);
      setConversionProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative min-h-screen flex flex-col bg-[#141414]"
    >
      {/* Header */}
      <Header />

      {/* Preload model */}
      <PreloadModel url={modelUrl} />

      {/* Canvas Section */}
      <div className="bg-neutral-900 flex flex-col gap-10 pb-10 pt-6 px-6 relative flex-1">
        {/* Card with Controls */}
        <div className="bg-[#1e1e1e] flex flex-col gap-6 py-3 relative rounded-2xl border border-neutral-800 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between px-6">
            {/* Download Button */}
            <button
              onClick={() => setShowFormatSelector(!showFormatSelector)}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-neutral-700 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] p-2 hover:bg-neutral-800 transition-colors"
            >
              <ArrowDown className="w-[22px] h-[22px] text-neutral-50" />
            </button>

            {/* New Upload Button */}
            <button
              onClick={onUploadAnother}
              className="bg-neutral-800 border border-neutral-700 rounded-full px-4 py-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:bg-neutral-700 transition-colors"
            >
              <p className="text-sm font-medium text-neutral-50">New Upload</p>
            </button>
          </div>

          {/* Format Selector Modal */}
          <AnimatePresence>
            {showFormatSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-neutral-800 overflow-hidden"
              >
                <div className="px-6 py-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white">Choose Format</p>
                    <button
                      onClick={() => setShowFormatSelector(false)}
                      className="text-neutral-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* GLB Option */}
                  <button
                    onClick={() => handleDownload('glb')}
                    className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 hover:bg-neutral-700 transition-colors text-left"
                  >
                    <p className="text-sm font-semibold text-white mb-1">GLB</p>
                    <p className="text-xs text-neutral-400">Universal format for web, AR, and 3D software</p>
                  </button>

                  {/* USDZ Option */}
                  <button
                    onClick={() => handleDownload('usdz')}
                    className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 hover:bg-neutral-700 transition-colors text-left"
                  >
                    <p className="text-sm font-semibold text-white mb-1">USDZ</p>
                    <p className="text-xs text-neutral-400">Optimized for iPhone, iPad, and iMessage sharing</p>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 relative min-h-[400px]">
          <div className="absolute inset-0">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                style={{ touchAction: 'none' }}
                gl={{ alpha: true }}
              >
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <directionalLight position={[-10, -10, -5]} intensity={0.3} />
                <Suspense fallback={<Loader />}>
                  <Model url={modelUrl} />
                </Suspense>
                <Environment preset="city" />
                <OrbitControls
                  makeDefault
                  autoRotate={true}
                  autoRotateSpeed={2}
                  enableDamping
                  dampingFactor={0.05}
                  minDistance={2}
                  maxDistance={10}
                  enabled={true}
                />
              </Canvas>
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1e1e1e] border-t border-neutral-800">
        <div className="flex flex-col gap-16 p-8">
          {/* Title and Social Links */}
          <div className="flex items-center justify-between min-w-[240px]">
            <p className="text-2xl font-semibold text-white">aarondig</p>
            <div className="flex gap-2">
              <a
                href={safeHref("https://linkedin.com/in/aarondiggdon")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full border-[1.125px] border-neutral-700 hover:bg-neutral-800 transition-colors"
              >
                <Linkedin className="w-[22px] h-[22px] text-neutral-50" />
              </a>
              <a
                href={safeHref("https://aarondig.com")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full border-[1.125px] border-neutral-700 hover:bg-neutral-800 transition-colors"
              >
                <ArrowUpRight className="w-[22px] h-[22px] text-neutral-50" />
              </a>
            </div>
          </div>

          {/* Contact Links */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="pb-1">
                <p className="text-base font-bold text-white">Contact</p>
              </div>
              <a
                href={safeHref("mailto:aarondiggdon@gmail.com")}
                className="text-base font-normal text-white leading-[1.4] hover:text-neutral-300 transition-colors"
              >
                aarondiggdon@gmail.com
              </a>
              <a
                href={safeHref("https://linkedin.com/in/aarondiggdon")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-normal text-white leading-[1.4] hover:text-neutral-300 transition-colors"
              >
                linkedin.com/in/aarondiggdon
              </a>
              <a
                href={safeHref("https://aarondig.com")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-normal text-white leading-[1.4] hover:text-neutral-300 transition-colors"
              >
                aarondig.com
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Conversion Loading Overlay */}
      <AnimatePresence>
        {isConverting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <ConversionLoadingCard progress={conversionProgress} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
