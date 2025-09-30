import { useState, useCallback } from 'react';
import { resizeImage, validateImage } from '../utils/imageProcessing';
import { config } from '../config';

interface ImageUploadProps {
  onImageReady: (dataUrl: string) => void;
}

export function ImageUpload({ onImageReady }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    // Validate image
    const validationError = validateImage(file, config.maxImageBytes);
    if (validationError) {
      setError(validationError);
      setIsProcessing(false);
      return;
    }

    try {
      // Resize image
      const dataUrl = await resizeImage(file, config.maxImageDimension);
      setPreview(dataUrl);
      setIsProcessing(false);
      onImageReady(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setIsProcessing(false);
    }
  }, [onImageReady]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${isDragging ? '#4a9eff' : '#333'}`,
          borderRadius: '8px',
          padding: '40px 20px',
          background: isDragging ? '#1a1a2e' : '#0f0f0f',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
              borderRadius: '4px',
            }}
          />
        ) : (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
            <p style={{ color: '#aaa', marginBottom: '8px' }}>
              {isDragging ? 'Drop image here' : 'Drag & drop an image'}
            </p>
            <p style={{ color: '#666', fontSize: '14px' }}>
              or click to browse
            </p>
            <p style={{ color: '#555', fontSize: '12px', marginTop: '8px' }}>
              JPG or PNG • Max 2MB
            </p>
          </>
        )}
      </div>

      <input
        id="file-input"
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {isProcessing && (
        <p style={{ color: '#4a9eff', marginTop: '16px' }}>
          Processing image...
        </p>
      )}

      {error && (
        <p style={{ color: '#ff4a4a', marginTop: '16px' }}>
          {error}
        </p>
      )}
    </div>
  );
}
