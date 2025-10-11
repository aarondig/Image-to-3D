import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ProgressStageProps {
  label: string;
  sublabel?: string;
  status: 'pending' | 'active' | 'complete';
  showConnector?: boolean;
  engineBadge?: string;
  countdown?: string;
  queuePosition?: string;
}

export function ProgressStage({
  label,
  sublabel,
  status,
  showConnector = true,
  engineBadge,
  countdown,
  queuePosition,
}: ProgressStageProps) {
  return (
    <div className="relative flex gap-3 w-full">
      {/* Left side: Indicator + Connector */}
      <div className="flex flex-col items-center">
        {/* Indicator Circle */}
        <div className="relative flex items-center justify-center shrink-0">
          {status === 'complete' ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="size-[20px] rounded-full bg-white flex items-center justify-center"
            >
              <Check className="size-[12px] text-neutral-900" strokeWidth={3} />
            </motion.div>
          ) : status === 'active' ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
              className="size-[20px] rounded-full border-2 border-white bg-white/20"
            />
          ) : (
            <div className="size-[20px] rounded-full border-2 border-neutral-700 bg-transparent" />
          )}
        </div>

        {/* Vertical Connector Line */}
        {showConnector && (
          <div
            className={`w-[2px] flex-1 min-h-[24px] ${
              status === 'complete' ? 'bg-neutral-600' : 'bg-neutral-800'
            }`}
          />
        )}
      </div>

      {/* Right side: Text Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          {/* Label */}
          <div className="flex flex-col gap-0.5">
            <p
              className={`font-medium text-[14px] leading-[20px] ${
                status === 'active' ? 'text-white' : status === 'complete' ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              {label}
            </p>
            {sublabel && (
              <p className="font-normal text-[12px] leading-[16px] text-neutral-500">
                {sublabel}
                {engineBadge && (
                  <span className="ml-1.5 text-neutral-400">
                    ↳ {engineBadge}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Right side info */}
          <div className="flex flex-col items-end gap-0.5">
            {countdown && status === 'active' && (
              <p className="font-medium text-[14px] leading-[20px] text-white tabular-nums">
                {countdown}
              </p>
            )}
            {queuePosition && status === 'active' && (
              <p className="font-normal text-[12px] leading-[16px] text-neutral-500">
                {queuePosition}
              </p>
            )}
            {status === 'complete' && (
              <p className="font-normal text-[12px] leading-[16px] text-neutral-500">
                Complete
              </p>
            )}
            {status === 'pending' && (
              <p className="font-normal text-[12px] leading-[16px] text-neutral-600">
                Pending
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
