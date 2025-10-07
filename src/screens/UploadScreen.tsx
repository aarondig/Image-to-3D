import { GalleryVerticalEnd } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { toDataUrlAndResize, getMaxDimensionForQuality } from '@/utils/imageResize';

interface UploadScreenProps {
  onImageSelected: (imageData: string) => void;
  onBack?: () => void;
  cooldownSeconds?: number;
}

export function UploadScreen({ onImageSelected, onBack, cooldownSeconds = 0 }: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOnCooldown = cooldownSeconds > 0;
  // Always use high quality (768px) for all uploads
  const quality = 'high';

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

  const handleGenerate = useCallback(async () => {
    if (!preview) return;

    setIsProcessing(true);
    try {
      // Get original file from file input
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        // Fallback: use preview data URL if file not available
        onImageSelected(preview);
        return;
      }

      // Resize image to 768px (high quality)
      const maxDim = getMaxDimensionForQuality(quality);
      const resizedDataUrl = await toDataUrlAndResize(file, maxDim, 'image/jpeg', 0.85);

      onImageSelected(resizedDataUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      // Fallback: use preview if resize fails
      onImageSelected(preview);
    } finally {
      setIsProcessing(false);
    }
  }, [preview, quality, onImageSelected]);

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col"
    >
      <Header />

      <Breadcrumb items={['Upload', 'Generate', 'View']} activeIndex={0} showBack onBack={onBack} />

      {/* Canvas / Main Content */}
      <div className="bg-neutral-900 box-border flex flex-col gap-[40px] items-center pb-[40px] pt-[24px] px-[24px] relative shrink-0 w-full">
        <div className="w-full max-w-md mx-auto">
          {/* Card */}
          <div className="bg-[#1e1e1e] box-border flex flex-col gap-[24px] items-start px-0 py-[24px] relative rounded-[24px] shrink-0 w-full border border-neutral-800 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
            {/* Header */}
            <div className="box-border flex gap-[6px] items-start justify-end px-[24px] py-0 relative shrink-0 w-full">
              <div className="flex flex-col gap-[6px] items-start relative shrink-0 w-full">
                <div className="flex gap-[10px] items-center relative shrink-0 w-full">
                  <p className="font-semibold text-[14px] leading-[20px] text-white w-full">
                    Upload Image
                  </p>
                </div>
                <div className="flex gap-[10px] items-center relative shrink-0 w-full">
                  <p className="font-normal text-[14px] leading-[20px] text-neutral-400 w-full">
                    Drag and drop an image or click to browse
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div className="box-border flex flex-col gap-[16px] items-start px-[24px] py-0 relative shrink-0 w-full">
              <div
                className={cn(
                  'bg-[#2c2c2c] h-[200px] relative rounded-[16px] shrink-0 w-full border border-neutral-700 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] cursor-pointer transition-colors overflow-hidden',
                  isDragging && 'border-neutral-500 bg-[#333333]'
                )}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  /* Image Preview */
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* Empty State */
                  <div className="box-border flex flex-col gap-[12px] h-[200px] items-center justify-center overflow-clip px-[12px] py-[4px] relative w-full">
                    <GalleryVerticalEnd className="h-[32px] w-[32px] text-white" strokeWidth={1.5} />
                    <div className="flex gap-[10px] items-center justify-center relative shrink-0 w-full">
                      <p className="font-normal text-[14px] leading-[20px] text-[#767676] text-center w-full">
                        JPG, PNG, HEIC, WebP
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="box-border flex flex-col gap-[8px] items-start px-[24px] py-0 relative shrink-0 w-full">
              <button
                onClick={handleGenerate}
                disabled={!preview || isOnCooldown || isProcessing}
                className="bg-neutral-50 box-border flex flex-col gap-[10px] items-center justify-center px-[16px] py-[12px] relative rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-full hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex gap-[10px] items-center justify-center relative shrink-0">
                  <p className="font-medium text-[14px] leading-[20px] text-neutral-900 whitespace-pre">
                    {isProcessing ? 'Optimizing...' : isOnCooldown ? `Wait ${cooldownSeconds}s` : 'Generate'}
                  </p>
                </div>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="box-border flex flex-col gap-[10px] items-center justify-center px-[16px] py-[12px] relative rounded-[9999px] shrink-0 w-full hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex gap-[10px] items-center justify-center relative shrink-0">
                  <p className="font-medium text-[14px] leading-[20px] text-neutral-50 whitespace-pre">
                    Upload New Image
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp"
          className="hidden"
          onChange={onChange}
        />
      </div>

      <Footer />
    </motion.div>
  );
}
