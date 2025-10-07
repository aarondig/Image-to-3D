/**
 * Image resizing utility for optimizing uploads
 * Downscales large images client-side before sending to API
 */

/**
 * Convert a Blob to base64 data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Resize an image file to a maximum dimension
 *
 * @param file - The image file to resize
 * @param maxDim - Maximum dimension (width or height) in pixels
 * @param mime - Output MIME type (default: 'image/jpeg')
 * @param quality - JPEG/WebP quality 0-1 (default: 0.85)
 * @returns Base64 data URL of the resized image
 */
export async function toDataUrlAndResize(
  file: File,
  maxDim: number = 512,
  mime: string = 'image/jpeg',
  quality: number = 0.85
): Promise<string> {
  // Limit file size to 50MB before processing
  const maxBytes = 50 * 1024 * 1024;
  const blob = file.size > maxBytes ? file.slice(0, maxBytes) : file;

  try {
    // Create bitmap from image file
    const bitmap = await createImageBitmap(blob);

    // Calculate scale factor
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));

    // If no scaling needed (image is already 768px or smaller), return original
    // This avoids unnecessary compression for already-small images
    if (scale === 1) {
      console.log(`Image already ≤${maxDim}px (${bitmap.width}x${bitmap.height}), using original`);
      return blobToDataURL(file);
    }

    console.log(`Resizing image from ${bitmap.width}x${bitmap.height} to ${Math.floor(bitmap.width * scale)}x${Math.floor(bitmap.height * scale)}`);

    // Create offscreen canvas with scaled dimensions
    const canvas = new OffscreenCanvas(
      Math.floor(bitmap.width * scale),
      Math.floor(bitmap.height * scale)
    );

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw scaled image
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    const resizedBlob = await canvas.convertToBlob({
      type: mime,
      quality,
    });

    // Convert blob to data URL
    return blobToDataURL(resizedBlob);
  } catch (error) {
    console.error('Error resizing image:', error);
    // Fallback: return original file as data URL
    return blobToDataURL(file);
  }
}

/**
 * Get the recommended max dimension based on quality mode
 */
export function getMaxDimensionForQuality(quality: 'fast' | 'high'): number {
  return quality === 'high' ? 768 : 512;
}
