import { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { resizeImage, validateImage } from '../utils/imageProcessing';
import { config } from '../config';
import { cn } from '@/lib/utils';

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
    <div className="w-full max-w-lg mx-auto">
      <Card
        className={cn(
          'border-2 border-dashed cursor-pointer transition-all',
          isDragging ? 'border-primary bg-accent' : 'border-muted-foreground/25',
          'hover:border-primary/50'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-10">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-[300px] rounded-md"
            />
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {isDragging ? 'Drop image here' : 'Drag & drop an image'}
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                JPG, PNG, HEIC, WebP • Max 10MB
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <input
        id="file-input"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp"
        onChange={handleFileInput}
        className="hidden"
      />

      {isProcessing && (
        <p className="text-center text-primary mt-4 text-sm">
          Processing image...
        </p>
      )}

      {error && (
        <p className="text-center text-destructive mt-4 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
