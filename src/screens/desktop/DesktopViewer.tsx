import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import { ErrorBoundary } from 'react-error-boundary';
import { motion } from 'framer-motion';
import { DesktopLayout } from '@/components/desktop/DesktopLayout';
import { GlassmorphicNav } from '@/components/desktop/GlassmorphicNav';
import { LoadingCube } from '@/components/desktop/LoadingCube';
import { safeHref } from '@/lib/safeUrl';

interface DesktopViewerProps {
  modelUrl: string;
  onUploadAnother: () => void;
  onLogoClick?: () => void;
}

function Model({ url }: { url: string }) {
  // Use proxy endpoint to avoid CORS issues
  const proxyUrl = `/api/proxy-model?url=${encodeURIComponent(url)}`;
  const { scene } = useGLTF(proxyUrl);

  return (
    <Center>
      <primitive object={scene} scale={1} />
    </Center>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-lg border border-red-500 bg-red-500/10 p-4 text-center max-w-md">
        <p className="text-sm text-red-500 mb-2">Failed to load 3D model</p>
        <p className="text-xs text-red-400">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export function DesktopViewer({ modelUrl, onUploadAnother, onLogoClick }: DesktopViewerProps) {
  const handleDownload = () => {
    const downloadUrl = `/api/proxy-model?url=${encodeURIComponent(modelUrl)}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'model.glb';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!modelUrl?.trim()) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-900">
        <div className="rounded-lg border border-red-500 bg-red-500/10 p-4 text-center">
          <p className="text-sm text-red-500">Invalid model URL</p>
          <button
            onClick={onUploadAnother}
            className="mt-4 px-4 py-2 bg-neutral-50 text-neutral-900 rounded-full"
          >
            Upload Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <DesktopLayout
      sidebar={
        /* PANEL 1: Collapsed Sidebar - 84px */
        <div className="flex flex-col h-full w-[84px] border-r border-neutral-800 shrink-0">
          {/* Header with Logo */}
          <div className="h-[84px] border-b border-neutral-800 flex items-center justify-center px-6">
            <motion.button
              layoutId="sidebar-logo"
              onClick={onLogoClick || onUploadAnother}
              className="cursor-pointer overflow-clip relative shrink-0 size-9"
            >
              <div className="absolute left-[1.83px] size-[32.344px] top-[1.83px]">
                <img src="/icons/logo.svg" alt="Logo" className="w-full h-full" />
              </div>
            </motion.button>
          </div>

          {/* Footer - Icons stacked vertically */}
          <div className="flex-1 flex flex-col justify-end items-center pb-10">
            <motion.div layoutId="social-icons" className="flex flex-col gap-2">
              <motion.a
                layoutId="linkedin-icon"
                href={safeHref("https://linkedin.com/in/aarondiggdon")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full border-[1.125px] border-neutral-700 hover:bg-neutral-800 transition-colors group"
              >
                <img
                  src="/icons/linkedin.svg"
                  alt="LinkedIn"
                  className="h-[22px] w-[22px] transition-all group-hover:brightness-75"
                />
              </motion.a>
              <motion.a
                layoutId="portfolio-icon"
                href={safeHref("https://aarondig.com")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full border-[1.125px] border-neutral-700 hover:bg-neutral-800 transition-colors group"
              >
                <img
                  src="/icons/uparrow.svg"
                  alt="External link"
                  className="h-[22px] w-[22px] transition-all group-hover:brightness-75"
                />
              </motion.a>
            </motion.div>
          </div>
        </div>
      }
      content={
        /* PANEL 2: Canvas Area - Flexible, fills remaining space */
        <div className="flex flex-col h-full flex-1 min-w-0">
          {/* Breadcrumb Header */}
          <div className="h-[84px] border-b border-neutral-800 flex items-center justify-end px-6 shrink-0">
            <div className="flex gap-1.5 items-center">
              <p className="text-sm font-normal text-neutral-400">Upload</p>
              <span className="text-sm text-neutral-400">/</span>
              <p className="text-sm font-normal text-neutral-400">Generate</p>
              <span className="text-sm text-neutral-400">/</span>
              <p className="text-sm font-medium text-neutral-50">View</p>
            </div>
          </div>

          {/* Canvas - Fills available space */}
          <div className="flex-1 p-6 min-h-0">
            <div className="relative w-full h-full bg-[#1e1e1e] border border-neutral-800 rounded-[24px] overflow-hidden">
              {/* Glassmorphic Nav Bar */}
              <div className="absolute top-6 left-6 right-6 z-10">
                <GlassmorphicNav
                  onDownload={handleDownload}
                  onNewUpload={onUploadAnother}
                />
              </div>

              {/* 3D Canvas */}
              <div className="absolute inset-0">
                <ErrorBoundary
                  FallbackComponent={ErrorFallback}
                  onReset={() => window.location.reload()}
                >
                  <Canvas
                    camera={{ position: [0, 0, 2], fov: 50 }}
                    style={{ touchAction: 'none' }}
                    gl={{ alpha: true }}
                  >
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} />
                    <directionalLight position={[-10, -10, -5]} intensity={0.3} />
                    <Suspense fallback={<LoadingCube />}>
                      <Model url={modelUrl} />
                    </Suspense>
                    <Environment preset="city" />
                    <OrbitControls
                      makeDefault
                      autoRotate={true}
                      autoRotateSpeed={2}
                      enableDamping
                      dampingFactor={0.05}
                      minDistance={1.5}
                      maxDistance={10}
                      enabled={true}
                    />
                  </Canvas>
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
