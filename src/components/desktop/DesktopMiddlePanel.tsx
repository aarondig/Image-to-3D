import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

interface DesktopMiddlePanelProps {
  children: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export function DesktopMiddlePanel({
  children,
  showBack,
  onBack,
}: DesktopMiddlePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="hidden lg:flex flex-col h-full border-r border-neutral-800 w-[368px] shrink-0"
    >
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 h-[84px] shrink-0 w-full">
        <div className="flex items-center justify-between p-6 h-full">
          {showBack ? (
            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border border-neutral-700 flex items-center justify-center p-2 rounded-full shrink-0 size-9 hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft className="w-[22px] h-[22px] text-white" />
            </motion.button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-6 pb-10 pt-6 px-6 overflow-y-auto">
        {children}
      </div>
    </motion.div>
  );
}
