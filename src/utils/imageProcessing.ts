/**
 * Resizes an image file to fit within maxDimension while maintaining aspect ratio
 * @param file - The image file to resize
 * @param maxDimension - Maximum width or height in pixels
 * @returns Promise resolving to base64 data URL of resized image
 */
export async function resizeImage(
  file: File,
  maxDimension: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      let { width, height } = img;

      if (width > height && width > maxDimension) {
        height = (height / width) * maxDimension;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width / height) * maxDimension;
        height = maxDimension;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validates an image file against type and size constraints
 * @param file - The file to validate
 * @param maxBytes - Maximum allowed file size in bytes
 * @returns Error message string if invalid, null if valid
 */
export function validateImage(file: File, maxBytes: number): string | null {
  const validTypes = ['image/jpeg', 'image/png'];

  if (!validTypes.includes(file.type)) {
    return 'Please upload a JPG or PNG image';
  }

  if (file.size > maxBytes) {
    const maxMB = (maxBytes / 1024 / 1024).toFixed(1);
    return `Image must be smaller than ${maxMB}MB`;
  }

  return null;
}
