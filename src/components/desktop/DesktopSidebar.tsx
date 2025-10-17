import { motion } from 'framer-motion';
import { safeHref } from '@/lib/safeUrl';

interface DesktopSidebarProps {
  onLogoClick?: () => void;
}

export function DesktopSidebar({ onLogoClick }: DesktopSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="hidden lg:flex flex-col justify-between h-full border-r border-neutral-800 shrink-0"
    >
      {/* Header with Logo */}
      <div className="border-b border-neutral-800 h-[84px] flex items-center justify-center px-6">
        <button
          onClick={onLogoClick}
          className="cursor-pointer overflow-clip relative shrink-0 size-9"
        >
          <div className="absolute left-[1.83px] size-[32.344px] top-[1.83px]">
            <img src="/icons/logo.svg" alt="Logo" className="w-full h-full" />
          </div>
        </button>
      </div>

      {/* Footer - Social icons stacked vertically */}
      <div className="flex flex-col gap-4 items-left pb-10">
        <p className="text-2xl font-semibold text-white writing-mode-vertical-rl rotate-180">aarondig</p>
        <div className="flex flex-col gap-2">
          <a
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
          </a>
          <a
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
          </a>
        </div>
      </div>
    </motion.div>
  );
}
