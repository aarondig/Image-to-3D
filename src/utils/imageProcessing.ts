import heic2any from 'heic2any';

/**
 * Convert HEIC/HEIF images to JPEG
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });

    // heic2any can return Blob or Blob[], handle both cases
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

    return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
      type: 'image/jpeg',
    });
  } catch (error) {
    throw new Error('Failed to convert HEIC image. Please try a different image.');
  }
}

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
  // Convert HEIC to JPEG if needed
  let processedFile = file;
  if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
    processedFile = await convertHeicToJpeg(file);
  }

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

    img.src = URL.createObjectURL(processedFile);
  });
}

/**
 * Validates an image file against type and size constraints
 * @param file - The file to validate
 * @param maxBytes - Maximum allowed file size in bytes
 * @returns Error message string if invalid, null if valid
 */
export function validateImage(file: File, maxBytes: number): string | null {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif',
    'image/webp',
  ];

  // Check file extension for HEIC files (sometimes browser doesn't set correct MIME type)
  const fileName = file.name.toLowerCase();
  const hasValidExtension = fileName.endsWith('.jpg') ||
                           fileName.endsWith('.jpeg') ||
                           fileName.endsWith('.png') ||
                           fileName.endsWith('.heic') ||
                           fileName.endsWith('.heif') ||
                           fileName.endsWith('.webp');

  if (!validTypes.includes(file.type) && !hasValidExtension) {
    return 'Please upload a JPG, PNG, HEIC, or WebP image';
  }

  if (file.size > maxBytes) {
    const maxMB = (maxBytes / 1024 / 1024).toFixed(1);
    return `Image must be smaller than ${maxMB}MB`;
  }

  return null;
}
