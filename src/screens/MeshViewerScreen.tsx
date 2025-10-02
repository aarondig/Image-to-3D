import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Upload, Pause, Play } from 'lucide-react';

interface MeshViewerScreenProps {
  modelUrl: string;
  onUploadAnother: () => void;
}

function Model({ url }: { url: string }) {
  const proxyUrl = `/api/proxy-model?url=${encodeURIComponent(url)}`;
  const { scene } = useGLTF(proxyUrl);
  return (
    <Center>
      <primitive object={scene} />
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

export function MeshViewerScreen({
  modelUrl,
  onUploadAnother,
}: MeshViewerScreenProps) {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="relative h-svh w-full"
    >
      {/* Full-screen 3D Canvas Background */}
      <div className="fixed inset-0 -z-10">
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

      {/* Content Overlay - Top aligned, horizontally centered */}
      <div className="flex min-h-full w-full flex-col items-center px-4 pt-6 md:px-6">
        <Card className="w-full max-w-2xl bg-background/80 backdrop-blur-md">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-green-500">
                <div className="h-full w-full animate-ping rounded-full bg-green-400" />
              </div>
              <span className="text-sm font-medium">3D Model Ready</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAutoRotate(!autoRotate)}
                className="h-9 w-9"
              >
                {autoRotate ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {autoRotate ? 'Pause rotation' : 'Play rotation'}
                </span>
              </Button>
              <Button asChild variant="default" size="sm">
                <a href={modelUrl} download>
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                  <span className="sm:hidden">Save</span>
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={onUploadAnother}>
                <Upload className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Upload</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
