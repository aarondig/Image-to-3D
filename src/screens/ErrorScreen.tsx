import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface ErrorScreenProps {
  error: string;
  onRetry: () => void;
}

/**
 * Parse error message to extract a user-friendly title
 * Falls back to "Upload Failed" if no specific error
 */
function getErrorTitle(error: string): string {
  // Map common errors to user-friendly titles
  const errorMap: Record<string, string> = {
    'Daily generation limit reached': 'Daily Limit Reached',
    'Image too large': 'Image Too Large',
    'Missing or invalid image': 'Invalid Image',
    'Provider error': 'Service Error',
    'Quota/credits exceeded': 'Credits Exhausted',
    'Server configuration error': 'Server Error',
    'Failed to generate 3D model': 'Generation Failed',
  };

  // Check if error contains any mapped strings
  for (const [key, title] of Object.entries(errorMap)) {
    if (error.includes(key)) {
      return title;
    }
  }

  return 'Upload Failed';
}

export function ErrorScreen({ error, onRetry }: ErrorScreenProps) {
  const errorTitle = getErrorTitle(error);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLogoClick={onRetry} />

      {/* Secondary Header with Back Button */}
      <div className="bg-neutral-900 relative shrink-0 w-full border-b border-neutral-800 max-h-[60px]">
        <div className="box-border flex items-center justify-between overflow-clip p-[24px] relative w-full h-[60px]">
          <motion.button
            onClick={onRetry}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="box-border flex items-center justify-center p-[8px] relative rounded-full shrink-0 size-[36px] border border-neutral-700 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:bg-white transition-colors group"
          >
            <ChevronLeft className="h-[22px] w-[22px] text-white group-hover:text-black transition-colors" strokeWidth={2} />
          </motion.button>
        </div>
      </div>

      {/* Canvas / Main Content */}
      <div className="bg-neutral-900 box-border flex flex-col gap-[40px] items-start pb-[40px] pt-[24px] px-[24px] relative w-full min-h-[640px]">
        <div className="w-full max-w-md mx-auto flex flex-col gap-[40px]">
          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-[16px] items-start relative shrink-0 w-full"
          >
            <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
              <h1 className="font-semibold text-[24px] leading-[32px] text-white w-full">
                Something went wrong.
              </h1>
              <p className="font-normal text-[16px] leading-[24px] text-neutral-400 w-full">
                We couldn't generate your 3D Model.
              </p>
            </div>
          </motion.div>

          {/* Error Card */}
          <div className="bg-[#1e1e1e] box-border flex flex-col gap-[24px] items-start px-0 py-[24px] relative rounded-[24px] shrink-0 w-full border border-neutral-800 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
            {/* Card Header */}
            <div className="box-border flex flex-col gap-[6px] items-start px-[24px] py-0 relative shrink-0 w-full">
              <div className="flex gap-[10px] items-center relative shrink-0 w-full">
                <p className="font-semibold text-[14px] leading-[20px] text-white w-full">
                  {errorTitle}
                </p>
              </div>
              <div className="flex gap-[10px] items-center relative shrink-0 w-full">
                <p className="font-normal text-[14px] leading-[20px] text-neutral-400 w-full">
                  If the problem persists, try a different image.
                </p>
              </div>
            </div>

            {/* Try Again Button */}
            <div className="box-border flex flex-col gap-[8px] items-start px-[24px] py-0 relative shrink-0 w-full">
              <motion.button
                onClick={onRetry}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-neutral-50 box-border flex flex-col gap-[10px] items-center justify-center px-[16px] py-[12px] relative rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-full hover:bg-neutral-100 transition-colors"
              >
                <div className="flex gap-[10px] items-center justify-center relative shrink-0">
                  <p className="font-medium text-[14px] leading-[20px] text-neutral-900 whitespace-pre">
                    Try Again
                  </p>
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
