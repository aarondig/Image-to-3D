import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ConversionLoadingCardProps {
  progress: number; // 0-100
}

export function ConversionLoadingCard({ progress }: ConversionLoadingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#1e1e1e] rounded-2xl p-6 border border-neutral-800 shadow-lg max-w-sm w-full"
    >
      {/* Header with spinner */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold text-base mb-1">Converting to USDZ</h3>
          <p className="text-neutral-400 text-sm">This usually takes 3 seconds.</p>
        </div>
        <Loader2 className="w-6 h-6 text-white animate-spin flex-shrink-0" />
      </div>

      {/* Progress Section */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-neutral-400 text-sm">Processing...</p>
          <p className="text-white font-medium text-sm">{Math.round(progress)}%</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
