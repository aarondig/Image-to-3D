import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

interface GlassmorphicNavProps {
  onDownload: () => void;
  onNewUpload: () => void;
}

export function GlassmorphicNav({
  onDownload,
  onNewUpload,
}: GlassmorphicNavProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="backdrop-blur-lg bg-[rgba(48,48,48,0.6)] border border-[rgba(112,112,112,0.2)] rounded-2xl shrink-0 w-full"
      style={{ backdropFilter: 'blur(16px)' }}
    >
      <div className="flex items-center justify-between px-6 py-3">
        {/* Download Button */}
        <motion.button
          onClick={onDownload}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="border border-[rgba(144,144,144,0.4)] flex items-center justify-center p-2 rounded-full shrink-0 size-9 hover:bg-[rgba(144,144,144,0.2)] transition-colors"
        >
          <ArrowDown className="w-[22px] h-[22px] text-white" />
        </motion.button>

        {/* Spacer */}
        <div className="w-[114px]" />

        {/* New Upload Button */}
        <motion.button
          onClick={onNewUpload}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-[rgba(144,144,144,0.2)] border border-[rgba(144,144,144,0.2)] flex items-center justify-center px-4 py-3 rounded-full shrink-0 hover:bg-[rgba(144,144,144,0.3)] transition-colors"
        >
          <p className="text-sm font-medium text-white whitespace-nowrap">
            New Upload
          </p>
        </motion.button>
      </div>
    </motion.div>
  );
}
