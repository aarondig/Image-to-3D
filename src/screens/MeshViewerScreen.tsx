import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
      transition={{ duration: 0.3 }}
      className="relative w-full h-screen overflow-hidden bg-background"
    >
      {/* Full-screen 3D Canvas */}
      <div className="absolute inset-0">
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

      {/* Mobile-first Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <Card className="backdrop-blur-xl bg-background/90 border-border shadow-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2" />
                    3D Model Ready
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAutoRotate(!autoRotate)}
                    className="h-8 px-3"
                  >
                    {autoRotate ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">
                      {autoRotate ? 'Pause' : 'Play'}
                    </span>
                  </Button>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    asChild
                    size="default"
                    className="w-full"
                  >
                    <a href={modelUrl} download>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={onUploadAnother}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    New Photo
                  </Button>
                </div>

                {/* Helper Text */}
                <p className="text-xs text-center text-muted-foreground pt-1">
                  Drag to rotate • Scroll to zoom
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
