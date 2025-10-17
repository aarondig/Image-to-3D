import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

export function LoadingCube() {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.0005;
      meshRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color="hsl(var(--primary))" wireframe />
    </mesh>
  );
}
