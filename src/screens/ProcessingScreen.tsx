import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ProgressStage } from '@/components/ui/ProgressStage';

interface ProcessingScreenProps {
  image: string;
  progress: number;
  status: string;
  phase?: string;
  isComplete?: boolean;
  onBack?: () => void;
  engine?: string;
  queueInfo?: {
    position?: number;
    total?: number;
    etaSeconds?: number;
  };
}

export function ProcessingScreen({
  image,
  progress,
  status,
  phase,
  isComplete,
  onBack,
  engine,
  queueInfo,
}: ProcessingScreenProps) {
  const progressPercent = Math.round(progress * 100);

  // Updated stages based on Loading-System.md spec
  const stages = [
    {
      id: 'ready',
      label: 'Ready',
      sublabel: '3D preview available · tap to view',
    },
    {
      id: 'finalizing',
      label: 'Finalizing',
      sublabel: 'Validating file integrity and upload success',
    },
    {
      id: 'compiling',
      label: 'Compiling',
      sublabel: 'Compressing and optimizing mesh for export',
    },
    {
      id: 'texturing',
      label: 'Texturing',
      sublabel: 'Projecting image colors onto 3D surface',
    },
    {
      id: 'reconstruction',
      label: 'Mesh Reconstruction',
      sublabel: 'Converting depth map into 3D geometry',
    },
    {
      id: 'depth',
      label: 'Depth Estimation',
      sublabel: 'Generating surface map from single photo',
    },
    {
      id: 'preprocessing',
      label: 'Preprocessing',
      sublabel: 'Normalizing color and lighting data',
    },
    {
      id: 'queued',
      label: 'Queued',
      sublabel: 'Awaiting processing slot · fallback in {MM:SS}',
      engineBadge: engine,
    },
    {
      id: 'uploading',
      label: 'Uploading',
      sublabel: 'Optimizing and encoding image data for processing',
    },
  ];

  // Determine stage status based on progress (reversed order)
  const getStageStatus = (stageIndex: number): 'pending' | 'active' | 'complete' => {
    // Most recent stage is at the top (index 0)
    const reversedIndex = stages.length - 1 - stageIndex;
    const stageProgress = (reversedIndex + 1) / stages.length;
    if (progress >= stageProgress) return 'complete';
    if (progress >= reversedIndex / stages.length) return 'active';
    return 'pending';
  };

  // Format countdown timer
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#141414] min-h-screen flex flex-col"
    >
      <Header onLogoClick={onBack} />

      <Breadcrumb items={['Upload', 'Generate', 'View']} activeIndex={isComplete ? 2 : 1} showBack onBack={onBack} />

      {/* Canvas / Main Content */}
      <div className="bg-neutral-900 box-border flex flex-col gap-[40px] items-center pb-[40px] pt-[24px] px-[24px] relative w-full min-h-[640px]">
        <div className="w-full max-w-md mx-auto flex flex-col gap-[24px]">
          {/* Header Card */}
          <div className="bg-[#1e1e1e] box-border flex flex-col gap-[24px] items-start px-[24px] py-[24px] relative rounded-[24px] shrink-0 w-full border border-neutral-800 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
            {/* Header with Icon */}
            <div className="flex items-center justify-between relative shrink-0 w-full">
              <div className="flex flex-col gap-[6px] items-start relative shrink-0 flex-1">
                <p className="font-semibold text-[14px] leading-[20px] text-white">
                  Generating Mesh
                </p>
                <p className="font-normal text-[14px] leading-[20px] text-neutral-400">
                  This usually takes 30-90 seconds.
                </p>
              </div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="relative shrink-0 size-[32px]"
              >
                <Loader2 className="h-[32px] w-[32px] text-white animate-spin" strokeWidth={2} />
              </motion.div>
            </div>

            {/* Progress Section with Image and Percentage */}
            <div className="flex gap-[16px] items-center relative shrink-0 w-full">
              {/* Thumbnail */}
              <div className="bg-[#2c2c2c] relative rounded-[16px] shrink-0 size-[75px] border border-neutral-700 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] overflow-hidden">
                <img src={image} alt="Processing" className="w-full h-full object-cover" />
              </div>

              {/* Progress Details */}
              <div className="flex flex-col gap-[12px] items-center flex-1 relative shrink-0">
                <div className="flex items-end justify-between relative shrink-0 w-full">
                  <div className="flex gap-[10px] h-[20px] items-center relative shrink-0">
                    <p className="font-normal text-[14px] leading-[20px] text-neutral-400">
                      Processing...
                    </p>
                  </div>
                  <div className="flex gap-[10px] h-[20px] items-center relative shrink-0">
                    <p className="font-medium text-[18px] leading-[28px] text-white tabular-nums">
                      {progressPercent}%
                    </p>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-[8px] overflow-clip relative rounded-[9999px] shrink-0 w-full bg-neutral-800/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="absolute bg-white h-[8px] left-0 rounded-full top-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          {/* <div className="bg-[#1e1e1e] box-border flex flex-col items-start px-[24px] py-[24px] relative rounded-[24px] shrink-0 w-full border border-neutral-800 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
            {stages.map((stage, index) => {
              const stageStatus = getStageStatus(index);
              const isQueued = stage.id === 'queued';
              const showQueueInfo = isQueued && stageStatus === 'active' && queueInfo;

              return (
                <ProgressStage
                  key={stage.id}
                  label={stage.label}
                  sublabel={stage.sublabel}
                  status={stageStatus}
                  showConnector={index < stages.length - 1}
                  engineBadge={isQueued ? stage.engineBadge : undefined}
                  countdown={
                    showQueueInfo && queueInfo.etaSeconds
                      ? formatCountdown(queueInfo.etaSeconds)
                      : undefined
                  }
                  queuePosition={
                    showQueueInfo && queueInfo.position && queueInfo.total
                      ? `Place ${queueInfo.position}/${queueInfo.total}`
                      : undefined
                  }
                />
              );
            })}
          </div> */}
        </div>
      </div>

      <Footer />
    </motion.div>
  );
}
