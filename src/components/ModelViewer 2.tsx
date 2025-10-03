import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { RotateCw, Download } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';

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

export function ModelViewer({ modelUrl }: ModelViewerProps) {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="w-full space-y-4">
      {/* 3D Canvas */}
      <div className="w-full aspect-square bg-secondary rounded-lg overflow-hidden border">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Suspense fallback={<Loader />}>
            <Model url={modelUrl} />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={10}
          />
        </Canvas>
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
        <Button asChild size="sm">
          <a href={modelUrl} download>
            <Download className="mr-2 h-4 w-4" />
            Download GLB
          </a>
        </Button>
      </div>
    </div>
  );
}
