import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, ArrowDown } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { Header } from '@/components/layout/Header';
import { safeHref } from '@/lib/safeUrl';

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
  const [autoRotate] = useState(true);

  // Guard: Don't render if modelUrl is invalid
  if (!modelUrl || typeof modelUrl !== 'string' || modelUrl.trim() === '') {
    console.error('MeshViewerScreen: Invalid modelUrl', modelUrl);
    return (
      <div className="flex h-svh w-full items-center justify-center">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">Invalid model URL</p>
          <Button onClick={onUploadAnother} className="mt-4">Upload Another</Button>
        </div>
      </div>
    );
  }

  console.log('MeshViewerScreen: Rendering with modelUrl', modelUrl);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative min-h-screen flex flex-col bg-background"
    >
      <Header />

      {/* Preload model */}
      <PreloadModel url={modelUrl} />

      {/* Controls Overlay */}
      <div className="absolute top-[84px] left-0 right-0 z-20 pointer-events-none">
        <div className="container px-6 py-4">
          <div className="max-w-md mx-auto flex items-center justify-between pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/40"
              onClick={onUploadAnother}
            >
              <ArrowDown className="h-5 w-5" />
            </Button>

            <Button
              variant="default"
              size="default"
              className="h-9 px-4 rounded-full bg-background/80 backdrop-blur-sm border border-border/40 hover:bg-accent"
              onClick={onUploadAnother}
            >
              New Upload
            </Button>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
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
                autoRotate={autoRotate}
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
    </motion.div>
  );
}
