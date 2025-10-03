import { Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { safeHref } from '@/lib/safeUrl';

interface UploadScreenProps {
  onImageSelected: (imageData: string) => void;
}

export function UploadScreen({ onImageSelected }: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|heic|heif|webp)$/i)) {
        alert('Please upload a valid image file (JPG, PNG, HEIC, WebP)');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleGenerate = useCallback(() => {
    if (preview) {
      onImageSelected(preview);
    }
  }, [preview, onImageSelected]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-svh w-full flex-col items-center px-4 pt-20"
    >
      <div className="flex w-full max-w-md flex-col justify-center gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Photo to 3D
          </h1>
          <p className="text-sm text-muted-foreground">
            Transform any photo into an interactive 3D model
          </p>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>
              Drag and drop an image or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            {preview ? (
              /* Preview State */
              <div className="grid gap-4">
                <div className="overflow-hidden rounded-md border bg-muted">
                  {safeHref(preview) && (
                    <img
                      src={safeHref(preview)}
                      alt="Preview"
                      className="aspect-square w-full object-cover"
                    />
                  )}
                </div>
                <div className="grid gap-2">
                  <Button
                    size="default"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerate();
                    }}
                  >
                    Generate 3D Model
                  </Button>
                  <Button
                    size="default"
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    Choose Different Image
                  </Button>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div
                className={cn(
                  'grid gap-4 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer'
                )}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, HEIC, WebP (max 10MB)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp"
          className="hidden"
          onChange={onChange}
        />
      </div>
    </motion.div>
  );
}
