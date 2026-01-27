import { useState, useCallback, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { GalleryVerticalEnd } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DesktopLayout } from '@/components/desktop/DesktopLayout';
import { LoadingCube } from '@/components/desktop/LoadingCube';
import { toDataUrlAndResize, getMaxDimensionForQuality } from '@/utils/imageResize';
import { safeHref } from '@/lib/safeUrl';

// Preview Model Component (same as /model.glb used in PreviewModel.tsx)
function PreviewModel() {
  const { scene } = useGLTF('/model.glb');

  return (
    <Center>
      <primitive object={scene} scale={1.5} metalness={.2} roughness={.7}/>
    </Center>
  );
}

interface DesktopHomeUploadProps {
  onImageSelected: (imageData: string) => void;
  onLogoClick?: () => void;
  cooldownSeconds?: number;
}

export function DesktopHomeUpload({
  onImageSelected,
  onLogoClick,
  cooldownSeconds = 0,
}: DesktopHomeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOnCooldown = cooldownSeconds > 0;
  const quality = 'high';

  const handleFile = useCallback(async (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|heic|heif|webp)$/i)) {
      alert('Please upload a valid image file (JPG, PNG, HEIC, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!preview) return;

    setIsProcessing(true);
    try {
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        onImageSelected(preview);
        return;
      }

      const maxDim = getMaxDimensionForQuality(quality);
      const resizedDataUrl = await toDataUrlAndResize(file, maxDim, 'image/jpeg', 0.85);
      onImageSelected(resizedDataUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      onImageSelected(preview);
    } finally {
      setIsProcessing(false);
    }
  }, [preview, quality, onImageSelected]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  console.log(isSidebarOpen)
  return (
    <DesktopLayout
      sidebar={
        /* PANEL 1: Left Sidebar - Animated 416px ↔ 84px */
        <motion.div
          className="flex flex-col h-full border-r border-neutral-800 shrink-0 overflow-hidden cursor-pointer"
          onClick={() => !isSidebarOpen && setIsSidebarOpen(true)}
          animate={{
            width: isSidebarOpen ? 416 : 84,
          }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 60,
            mass: 1,
          }}
        >
          {/* Header with Logo and Sidebar Toggle */}
          <motion.div
            className="h-[84px] border-b border-neutral-800 flex items-center shrink-0"
            animate={{
              justifyContent: isSidebarOpen ? 'space-between' : 'center',
              paddingLeft: isSidebarOpen ? 24 : 24,
              paddingRight: isSidebarOpen ? 24 : 24,
            }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 60,
            }}
          >
            <motion.button
              layoutId="sidebar-logo"
              onClick={onLogoClick}
              className="cursor-pointer overflow-clip relative shrink-0 size-9"
              animate={{
                x: isSidebarOpen ? 0 : 0,
              }}
            >
              <div className="absolute left-[1.83px] size-[32.344px] top-[1.83px]">
                <img src="/icons/logo.svg" alt="Logo" className="w-full h-full" />
              </div>
            </motion.button>

            {/* Sidebar toggle icon - only visible when open */}
           
            {isSidebarOpen && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setIsSidebarOpen(false)}
                className="w-5 h-5 flex items-center justify-center"
                transition={{ duration: 0.2 }}
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </motion.button>
            )}
           
          </motion.div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col justify-between p-6 overflow-hidden">
            {/* Upload Card - 368px width */}
            <div>
            <AnimatePresence mode="sync">
              {isSidebarOpen && (
                <motion.div
                  key="upload-card"
                  layoutId="main-card"
                  className="bg-[#1e1e1e] flex flex-col gap-6 p-6 rounded-3xl border border-neutral-800 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] w-[368px]"
                  initial={{ opacity: 1, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 60,
                    mass: 0.8,
                  }}
                >
              {/* Header */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <h1 className="text-4xl font-semibold text-white leading-[40px]">
                    Photo 3D
                  </h1>
                  <p className="text-base font-normal text-neutral-400 leading-6">
                    Transform any photo (under 10mb) into an interactive 3D model.
                  </p>
                </div>
              </div>

              {/* Upload Area */}
              <div
                className={cn(
                  'bg-[#2c2c2c] h-[200px] rounded-2xl border border-neutral-700 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] cursor-pointer transition-colors overflow-hidden',
                  isDragging && 'border-neutral-500 bg-[#333333]'
                )}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  <motion.img
                    layoutId="uploadImage"
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col gap-3 h-[200px] items-center justify-center px-3 py-1">
                    <GalleryVerticalEnd className="h-8 w-8 text-white" strokeWidth={1.5} />
                    <p className="text-sm font-normal text-[#767676] text-center">
                      JPG, PNG, HEIC, WebP
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <motion.button
                  onClick={handleGenerate}
                  disabled={!preview || isOnCooldown || isProcessing}
                  whileHover={!preview || isOnCooldown || isProcessing ? {} : { scale: 1.02 }}
                  whileTap={!preview || isOnCooldown || isProcessing ? {} : { scale: 0.98 }}
                  className="bg-neutral-50 flex items-center justify-center px-4 py-2 rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="text-sm font-medium text-neutral-900 whitespace-nowrap">
                    {isProcessing ? 'Optimizing...' : isOnCooldown ? `Wait ${cooldownSeconds}s` : 'Generate'}
                  </p>
                </motion.button>
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center px-4 py-2 rounded-full hover:bg-neutral-800/50 transition-colors"
                >
                  <p className="text-sm font-medium text-neutral-50 whitespace-nowrap">
                    Upload New Image
                  </p>
                </motion.button>
              </div>
                </motion.div>
              )}
            </AnimatePresence>
</div>
            {/* Footer */}
            <motion.div
              className="flex flex-col items-left justify-end"
              animate={{
                // paddingBottom: isSidebarOpen ? 0 : 40,
              }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 60,
              }}
            >
              {/* Name - only visible when open */}
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.p
                className="text-2xl items-right font-semibold text-white px-6 mb-6"
                 animate={{
                opacity: isSidebarOpen ? 1 : 0,
                scale: isSidebarOpen ? 1 : 0.95,
              }}
              transition={{
                duration: 0.3,
                delay: isSidebarOpen ? 0.1 : 0,
              }}
              >
                aarondig
              </motion.p>
                )}
              </AnimatePresence>

              {/* Social Icons - transition from horizontal to vertical */}
              <motion.div
                layoutId="social-icons"
                className="flex gap-2"
                animate={{
                  flexDirection: isSidebarOpen ? 'row' : 'column',
                  paddingLeft: isSidebarOpen ? 24 : 0,
                  paddingRight: isSidebarOpen ? 24 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 60,
                }}
              >
                <motion.a
                  layoutId="linkedin-icon"
                  href={safeHref("https://linkedin.com/in/aarondiggdon")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-full border-[1.125px] border-neutral-700 hover:bg-neutral-800 transition-colors group"
                >
                  <img
                    src="/icons/linkedin.svg"
                    alt="LinkedIn"
                    className="h-[22px] w-[22px] transition-all group-hover:brightness-75"
                  />
                </motion.a>
                <motion.a
                  layoutId="portfolio-icon"
                  href={safeHref("https://aarondig.com")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 rounded-full border-[1.125px] border-neutral-700 hover:bg-neutral-800 transition-colors group"
                >
                  <img
                    src="/icons/uparrow.svg"
                    alt="External link"
                    className="h-[22px] w-[22px] transition-all group-hover:brightness-75"
                  />
                </motion.a>
              </motion.div>
            </motion.div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </motion.div>
      }
      content={
        /* PANEL 2: Canvas Area - Flexible, fills remaining space */
        <div className="flex flex-col h-full flex-1 min-w-0">
          {/* Breadcrumb Header */}
          <div className="h-[84px] border-b border-neutral-800 flex items-center justify-end px-6 shrink-0">
            <div className="flex gap-1.5 items-center">
              <p className="text-sm font-medium text-neutral-50">Upload</p>
              <span className="text-sm text-neutral-400">/</span>
              <p className="text-sm font-normal text-neutral-400">Generate</p>
              <span className="text-sm text-neutral-400">/</span>
              <p className="text-sm font-normal text-neutral-400">View</p>
            </div>
          </div>

          {/* Canvas - Fills available space */}
          <div className="flex-1 p-6 min-h-0">
            <div className="w-full h-full bg-[#1e1e1e] border border-neutral-800 rounded-[32px] overflow-hidden">
              <Canvas camera={{ position: [0, 6, 24], fov: 25 }} style={{ touchAction: 'none' }}>
                <ambientLight intensity={0.2} />

                <Suspense fallback={<LoadingCube />}>
                  <PreviewModel />
                </Suspense>
                <Environment preset="city" />
                <OrbitControls
                  enableDamping
                  dampingFactor={0.05}
                  minDistance={1.5}
                  maxDistance={10}
                  autoRotate
                  autoRotateSpeed={0.5}
                />
              </Canvas>
            </div>
          </div>
        </div>
      }
    />
  );
}
