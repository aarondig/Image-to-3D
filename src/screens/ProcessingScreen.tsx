import { motion } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

interface ProcessingScreenProps {
  image: string;
  progress: number;
  status: string;
  isComplete?: boolean;
  onBack?: () => void;
}

export function ProcessingScreen({ image, progress, status, isComplete = false, onBack }: ProcessingScreenProps) {
  const progressPercent = Math.round(progress * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col"
    >
      <Header />

      <Breadcrumb items={['Upload', 'Generate', 'View']} activeIndex={isComplete ? 2 : 1} showBack onBack={onBack} />

      {/* Canvas / Main Content */}
      <div className="bg-neutral-900 box-border flex flex-col gap-[40px] items-center pb-[40px] pt-[24px] px-[24px] relative shrink-0 w-full">
        <div className="w-full max-w-md mx-auto">
          {/* Card */}
          <div className="bg-[#1e1e1e] box-border flex flex-col gap-[24px] items-start px-0 py-[24px] relative rounded-[24px] shrink-0 w-full border border-neutral-800 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
            {/* Header with Icon */}
            <div className="box-border flex items-center justify-between px-[24px] py-0 relative shrink-0 w-full">
              <div className="flex flex-col gap-[6px] items-start relative shrink-0 flex-1">
                <div className="flex gap-[10px] items-center relative shrink-0 w-full">
                  <p className="font-semibold text-[14px] leading-[20px] text-white flex-1">
                    Generating Mesh
                  </p>
                </div>
                <div className="flex gap-[10px] items-center relative shrink-0 w-full">
                  <p className="font-normal text-[14px] leading-[20px] text-neutral-400 flex-1">
                    This usually takes 30-90 seconds.
                  </p>
                </div>
              </div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="relative shrink-0 size-[32px]"
              >
                {isComplete ? (
                  <Check className="h-[32px] w-[32px] text-white" strokeWidth={2} />
                ) : (
                  <Loader2 className="h-[32px] w-[32px] text-white animate-spin" strokeWidth={2} />
                )}
              </motion.div>
            </div>

            {/* Progress Section (only show if not complete) */}
            {!isComplete && (
              <div className="box-border flex gap-[16px] items-center px-[24px] py-0 relative shrink-0 w-full">
                {/* Thumbnail */}
                <div className="bg-[#2c2c2c] relative rounded-[16px] shrink-0 size-[75px] border border-neutral-700 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] overflow-hidden">
                  <img
                    src={image}
                    alt="Processing"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Progress Details */}
                <div className="flex flex-col gap-[12px] items-center flex-1 relative shrink-0">
                  <div className="flex items-end justify-between relative shrink-0 w-full">
                    <div className="flex gap-[10px] h-[20px] items-center relative shrink-0">
                      <p className="font-normal text-[14px] leading-[20px] text-neutral-400 whitespace-pre">
                        {status}
                      </p>
                    </div>
                    <div className="flex gap-[10px] h-[20px] items-center relative shrink-0">
                      <p className="font-medium text-[18px] leading-[28px] text-white whitespace-pre">
                        {progressPercent}%
                      </p>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-[8px] overflow-clip relative rounded-[9999px] shrink-0 w-full">
                    <div className="absolute bg-neutral-900 h-[8px] left-0 opacity-20 rounded-full top-1/2 translate-y-[-50%] w-full" />
                    <div
                      className="absolute bg-neutral-900 h-[8px] left-0 rounded-full top-1/2 translate-y-[-50%] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </motion.div>
  );
}
