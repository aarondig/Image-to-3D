import "@react-three/fiber"
import { Object3D, Mesh } from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      primitive: {
        ref?: React.RefObject<Mesh>;
        object: Object3D;
        scale?: number;
        position?: [number, number, number];
      };
      ambientLight: {
        intensity?: number;
      };
      directionalLight: {
        position?: [number, number, number];
        intensity?: number;
      };
    }
  }
}