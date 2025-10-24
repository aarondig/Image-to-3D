import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';

/**
 * Exports a GLB model to USDZ format for iOS/iPadOS Quick Look
 * @param modelUrl - URL to the GLB model file
 * @returns Promise that resolves to a USDZ Blob
 */
export async function exportToUSDZ(modelUrl: string): Promise<Blob> {
  if (!modelUrl?.trim()) {
    throw new Error('Invalid model URL provided for USDZ export');
  }

  try {
    // Load the GLB model
    const loader = new GLTFLoader();

    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(
        modelUrl,
        (loadedGltf) => resolve(loadedGltf),
        undefined,
        (error) => reject(error)
      );
    });

    if (!gltf?.scene) {
      throw new Error('Failed to load model scene');
    }

    // Export to USDZ
    const exporter = new USDZExporter();
    const arraybuffer = await exporter.parse(gltf.scene);

    if (!arraybuffer || arraybuffer.byteLength === 0) {
      throw new Error('USDZ export produced empty file');
    }

    // Create blob
    const blob = new Blob([arraybuffer], { type: 'model/vnd.usdz+zip' });

    return blob;
  } catch (error) {
    console.error('[USDZ Export] Error:', error);
    throw new Error(
      error instanceof Error
        ? `USDZ export failed: ${error.message}`
        : 'USDZ export failed with unknown error'
    );
  }
}

/**
 * Triggers browser download of a USDZ blob
 * @param blob - The USDZ blob to download
 * @param filename - Desired filename (default: 'model.usdz')
 */
export function downloadUSDZ(blob: Blob, filename = 'model.usdz'): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
