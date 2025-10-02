import { Upload, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-screen w-full px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Photo to 3D
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Transform any photo into an interactive 3D model
          </p>
        </div>

        {/* Upload Card */}
        <Card
          className={cn(
            'border-2 transition-all duration-200',
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : preview
              ? 'border-border'
              : 'border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer',
          )}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !preview && fileInputRef.current?.click()}
        >
          <CardContent className="p-8 sm:p-12">
            {preview ? (
              /* Preview State */
              <div className="space-y-6">
                <div className="relative rounded-lg overflow-hidden bg-muted">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerate();
                    }}
                  >
                    Generate 3D Model
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
                  <div className="relative bg-primary/10 p-6 rounded-full">
                    <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-base sm:text-lg font-medium">
                    Drop your photo here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Choose File
                </Button>

                <p className="text-xs text-muted-foreground pt-2">
                  Supports JPG, PNG, HEIC, WebP • Max 10MB
                </p>
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
