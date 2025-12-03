import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Mesh, MeshStandardMaterial } from 'three';

function Model() {
  const { scene } = useGLTF('/model.glb');
  const meshRef = useRef<Mesh>(null);

  // Apply standard material without texture
  scene.traverse((node) => {
    if (node instanceof Mesh) {
      node.material = new MeshStandardMaterial({
        color: '#DBA54F',
        metalness: 0.2,
        roughness: 0.7
      });
    }
  });

  // Rotate the model
  const rotationSpeed = .00085;
  const animate = () => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed;
    }
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  return <primitive ref={meshRef} object={scene} scale={2.5} position={[0, 0, 0] }/>;
}

export function PreviewModel() {
  return (
    <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 2, 14], fov: 20 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 2, 8]} intensity={1.5} />
        <Model />
      </Canvas>
    </div>
  );
}