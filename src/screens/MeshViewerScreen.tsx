import { Suspense, useState } from 'react';
import '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUpRight, X, Loader2, Check } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { useSpring, animated } from '@react-spring/web';
import { Header } from '@/components/layout/Header';
import { safeHref } from '@/lib/safeUrl';
import { cardVariants } from '@/utils/transitions';
import { exportToUSDZ, downloadUSDZ } from '@/utils/usdzExporter';

type ExportFormat = 'glb' | 'usdz';
type DownloadState = 'idle' | 'selecting' | 'downloading' | 'success';

interface DownloadingState {
  format: ExportFormat;
  label: string;
  description: string;
}

interface MeshViewerScreenProps {
  modelUrl: string;
  onUploadAnother: () => void;
}

function Model({ url }: { url: string }) {
  if (!url?.trim()) {
    throw new Error('Invalid model URL provided');
  }

  const proxyUrl = `/api/proxy-model?url=${encodeURIComponent(url)}`;
  const gltf = useGLTF(proxyUrl, true, true);

  if (!gltf?.scene) {
    throw new Error('Model scene is undefined');
  }

  return (
    <Center>
      <primitive object={gltf.scene} />
    </Center>
  );
}


function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hsl(var(--primary))" wireframe />
    </mesh>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary?: () => void }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="rounded-2xl border border-red-800 bg-red-950/20 p-6 text-center max-w-md">
        <p className="text-base font-semibold text-red-400 mb-2">Failed to load 3D model</p>
        <p className="text-sm text-neutral-400 mb-4">{error.message || 'An unknown error occurred'}</p>
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="bg-neutral-800 border border-neutral-700 rounded-full px-4 py-2 hover:bg-neutral-700 transition-colors"
          >
            <p className="text-sm font-medium text-neutral-50">Try Again</p>
          </button>
        )}
      </div>
    </div>
  );
}

export function MeshViewerScreen({
  modelUrl,
  onUploadAnother,
}: MeshViewerScreenProps) {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentFormat, setCurrentFormat] = useState<DownloadingState | null>(null);

  // Animated progress for smooth transitions
  const progressSpring = useSpring({
    width: `${downloadProgress}%`,
    config: { tension: 200, friction: 50, mass: 1 },
  });

  if (!modelUrl?.trim()) {
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

  const handleFormatSelect = async (format: ExportFormat) => {
    const formatInfo: DownloadingState = format === 'glb'
      ? { format: 'glb', label: 'GLB', description: 'Universal file format for web, AR, and 3D software' }
      : { format: 'usdz', label: 'USDZ', description: 'Optimized for iPhone, iPad, and iMessage sharing' };

    // Set the current format FIRST (so layoutId can start working)
    setCurrentFormat(formatInfo);

    // Small delay to let layoutId card start morphing
    await new Promise(resolve => setTimeout(resolve, 50));

    // Now transition to downloading state
    setDownloadState('downloading');
    setDownloadProgress(0);

    // Wait for all animations to settle
    await new Promise(resolve => setTimeout(resolve, 700));

    try {
      const proxyUrl = `/api/proxy-model?url=${encodeURIComponent(modelUrl)}`;
      const startTime = Date.now();
      const minWaitTime = 6000; // 6 seconds minimum for smoother feel

      // Smooth progress animation that runs independently
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / minWaitTime) * 100);
        setDownloadProgress(progress);
      }, 50); // Update every 50ms

      let blob: Blob;

      if (format === 'glb') {
        // GLB - fetch the file
        const response = await fetch(proxyUrl);
        blob = await response.blob();
      } else {
        // USDZ - export in background
        blob = await exportToUSDZ(proxyUrl);
      }

      // Calculate remaining wait time
      const elapsed = Date.now() - startTime;
      const remainingWait = Math.max(0, minWaitTime - elapsed);

      // Wait for remaining time if needed
      if (remainingWait > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingWait));
      }

      // Stop progress animation and set to 100%
      clearInterval(progressInterval);
      setDownloadProgress(100);

      // STEP 1: Wait to show 100% completion with spinner still showing
      await new Promise(resolve => setTimeout(resolve, 500));

      // STEP 2: Transition to success (spinner → checkmark, text changes)
      setDownloadState('success');

      // STEP 3: Wait to show success state (checkmark visible)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // STEP 4: Download the file
      if (format === 'glb') {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'model.glb';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        downloadUSDZ(blob, 'model.usdz');
      }

      // STEP 5: Wait a bit more, then unmount everything
      await new Promise(resolve => setTimeout(resolve, 500));

      // STEP 6: Reset to idle (unmount)
      setDownloadState('idle');
      setDownloadProgress(0);
      setCurrentFormat(null);
    } catch (error) {
      console.error(`${format.toUpperCase()} export failed:`, error);
      setDownloadState('idle');
      setDownloadProgress(0);
      setCurrentFormat(null);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#141414]">
      {/* Header */}
      <Header onLogoClick={onUploadAnother} />

        {/* Canvas Section */}
        <div className="bg-neutral-900 flex flex-col gap-10 pb-10 pt-6 px-6 relative flex-1">
          {/* Card with Controls */}
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            layout
            className="bg-[#1e1e1e] flex flex-col relative rounded-2xl border border-neutral-800 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] overflow-hidden"
          >
          {/* Button Bar - Only visible in idle/selecting states */}
          <AnimatePresence>
            {(downloadState === 'idle' || downloadState === 'selecting') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="flex items-center justify-between px-6 py-3"
              >
                {/* Download Button - Morphs between Arrow and X */}
                <motion.button
                  onClick={() => setDownloadState(downloadState === 'idle' ? 'selecting' : 'idle')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-neutral-700 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] p-2 hover:bg-neutral-800 transition-colors relative overflow-hidden"
                  layout
                >
                  <AnimatePresence mode="wait">
                    {downloadState === 'idle' ? (
                      <motion.div
                        key="arrow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowDown className="w-[22px] h-[22px] text-neutral-50" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="x"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="w-[22px] h-[22px] text-neutral-50" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* New Upload Button */}
                <motion.button
                  onClick={onUploadAnother}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-neutral-800 border border-neutral-700 rounded-full px-4 py-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:bg-neutral-700 transition-colors"
                >
                  <p className="text-sm font-medium text-neutral-50">New Upload</p>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Format Selector / Download Progress Modal */}
          <AnimatePresence>
            {downloadState !== 'idle' && (
              <>
                {/* Animated divider line */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  exit={{ scaleY: 0 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="h-px bg-neutral-800 w-full origin-top"
                />

                {/* Flex container - grows/shrinks based on content */}
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: { duration: 0.6, ease: [0.32, 0.72, 0, 1] },
                    opacity: { duration: 0.5, ease: [0.32, 0.72, 0, 1] }
                  }}
                  className="flex flex-col overflow-hidden"
                >
                  <div className="px-6 py-4 flex flex-col gap-4">
                  {/* Header with morphing content */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1.5">
                      {/* Title - morphs between states, no unmount */}
                      <motion.p
                        key="header-title"
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                        className="text-sm font-semibold text-white"
                      >
                        {downloadState === 'selecting' && 'Choose Format'}
                        {downloadState === 'downloading' && `Downloading ${currentFormat?.label || 'USDZ'}`}
                        {downloadState === 'success' && `Downloaded ${currentFormat?.label || 'USDZ'}`}
                      </motion.p>

                      {/* Subtitle - only for downloading */}
                      <AnimatePresence>
                        {downloadState === 'downloading' && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                            className="text-sm font-normal text-neutral-400"
                          >
                            This usually takes 6 seconds.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Morphing icon: Spinner → Check */}
                    <motion.div layout className="relative w-8 h-8 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {downloadState === 'downloading' && (
                          <motion.div
                            key="spinner"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                            className="absolute"
                          >
                            <Loader2 className="w-8 h-8 text-white animate-spin" strokeWidth={2} />
                          </motion.div>
                        )}
                        {downloadState === 'success' && (
                          <motion.div
                            key="check"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                            className="absolute"
                          >
                            <Check className="w-8 h-8 text-white" strokeWidth={2} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>

                  {/* Format Options (only in selecting state) */}
                  <AnimatePresence mode="popLayout">
                    {downloadState === 'selecting' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                        className="flex flex-col gap-3"
                      >
                        {/* GLB Option */}
                        <motion.div
                          layoutId="glb-card"
                          className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 cursor-pointer hover:bg-neutral-700 transition-colors text-left"
                          onClick={() => handleFormatSelect('glb')}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <p className="text-sm font-semibold text-white mb-1">GLB</p>
                          <p className="text-xs text-neutral-400">Universal file format for web, AR, and 3D software</p>
                        </motion.div>

                        {/* USDZ Option */}
                        <motion.div
                          layoutId="usdz-card"
                          className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 cursor-pointer hover:bg-neutral-700 transition-colors text-left"
                          onClick={() => handleFormatSelect('usdz')}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <p className="text-sm font-semibold text-white mb-1">USDZ</p>
                          <p className="text-xs text-neutral-400">Optimized for iPhone, iPad, and iMessage sharing</p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Selected Format Card (only in downloading state, fades out before success) */}
                  <AnimatePresence mode="popLayout">
                    {downloadState === 'downloading' && currentFormat && (
                      <motion.div
                        layoutId={`${currentFormat.format}-card`}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                        className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4"
                      >
                        <p className="text-sm font-semibold text-white mb-1">{currentFormat.label}</p>
                        <p className="text-xs text-neutral-400">{currentFormat.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Progress Bar (only in downloading state, fades out gracefully before success) */}
                  <AnimatePresence mode="popLayout">
                    {downloadState === 'downloading' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                        className="flex flex-col gap-3"
                      >
                        <div className="flex items-end justify-between">
                          <p className="text-sm font-normal text-neutral-400">Processing...</p>
                          <p className="text-sm font-medium text-white tabular-nums">{Math.round(downloadProgress)}%</p>
                        </div>
                        <div className="h-2 overflow-clip relative rounded-full w-full bg-neutral-800/50">
                          <animated.div
                            style={progressSpring}
                            className="absolute bg-white h-2 left-0 rounded-full top-0"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 3D Canvas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex-1 relative min-h-[400px]"
        >
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
                  minDistance={.5}
                  maxDistance={10}
                  enabled={true}
                />
              </Canvas>
            </ErrorBoundary>
          </div>
        </motion.div>
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
                className="flex items-center justify-center w-9 h-9 rounded-full border-[1.125px] border-neutral-700 hover:bg-neutral-800 transition-colors group"
              >
                <img src="/icons/linkedin.svg" alt="LinkedIn" className="h-[22px] w-[22px] transition-all group-hover:brightness-75" />
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
    </div>
  );
}
