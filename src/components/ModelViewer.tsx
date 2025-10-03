import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { RotateCw, Download } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { safeHref } from '@/lib/safeUrl';

interface ModelViewerProps {
  modelUrl: string;
}

function Model({ url }: { url: string }) {
  // Proxy the URL through our server to bypass CORS
  const proxyUrl = `/api/proxy-model?url=${encodeURIComponent(url)}`;
  const gltf = useGLTF(proxyUrl);

  if (!gltf || !gltf.scene) {
    console.error('GLTF scene is undefined');
    return <Loader />;
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
      <meshStandardMaterial color="#4a9eff" wireframe />
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

// Preload the model to avoid issues
function PreloadModel({ url }: { url: string }) {
  const proxyUrl = `/api/proxy-model?url=${encodeURIComponent(url)}`;

  useEffect(() => {
    useGLTF.preload(proxyUrl);
  }, [proxyUrl]);

  return null;
}

export function ModelViewer({ modelUrl }: ModelViewerProps) {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="w-full space-y-4">
      {/* Preload model */}
      <PreloadModel url={modelUrl} />

      {/* 3D Canvas */}
      <div className="w-full aspect-square bg-secondary rounded-lg overflow-hidden border">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <Suspense fallback={<Loader />}>
              <Model url={modelUrl} />
            </Suspense>
            <Environment preset="city" />
            <OrbitControls
              autoRotate={autoRotate}
              autoRotateSpeed={2}
              enableDamping
              dampingFactor={0.05}
              minDistance={2}
              maxDistance={10}
            />
          </Canvas>
        </ErrorBoundary>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <Button
          variant={autoRotate ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAutoRotate(!autoRotate)}
        >
          <RotateCw className="mr-2 h-4 w-4" />
          {autoRotate ? 'Stop Rotation' : 'Auto Rotate'}
        </Button>
        {safeHref(modelUrl) && (
          <Button asChild size="sm">
            <a href={safeHref(modelUrl)} download>
              <Download className="mr-2 h-4 w-4" />
              Download GLB
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
