import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ProgressStage } from '@/components/ui/ProgressStage';
import type { Phase } from '@/types/api';

interface PhaseData {
  phase: Phase;
  label: string;
  description: string;
  timestamp: number;
  queuePosition?: string;
  engineName?: string;
}

interface ProcessingScreenProps {
  image: string;
  progress: number;
  currentPhase: Phase;
  phaseHistory: PhaseData[];
  queuePosition?: string;
  engineName?: string;
  isComplete?: boolean;
  onBack?: () => void;
}

// Phase configuration with labels and descriptions
const PHASE_CONFIG: Record<Phase, { label: string; description: string }> = {
  uploading: {
    label: 'Uploading',
    description: 'Optimizing and encoding image data for processing',
  },
  queued: {
    label: 'Queued',
    description: 'Awaiting processing slot in generation queue',
  },
  preprocessing: {
    label: 'Preprocessing',
    description: 'Normalizing color and lighting data',
  },
  depth: {
    label: 'Depth Estimation',
    description: 'Generating surface map from single photo',
  },
  reconstruction: {
    label: 'Mesh Reconstruction',
    description: 'Converting depth map into 3D geometry',
  },
  texturing: {
    label: 'Texturing',
    description: 'Projecting image colors onto 3D surface',
  },
  compiling: {
    label: 'Compiling',
    description: 'Compressing and optimizing mesh for export',
  },
  finalizing: {
    label: 'Finalizing',
    description: 'Validating file integrity and upload success',
  },
  ready: {
    label: 'Ready',
    description: '3D preview available · tap to view',
  },
  error: {
    label: 'Error',
    description: 'An error occurred during processing',
  },
};

export function ProcessingScreen({
  image,
  progress,
  currentPhase,
  phaseHistory,
  queuePosition,
  engineName,
  isComplete,
  onBack,
}: ProcessingScreenProps) {
  const progressPercent = Math.round(progress * 100);
  const currentConfig = PHASE_CONFIG[currentPhase];

  // Build ordered list of phases to render
  // Current phase at top, followed by history in reverse order
  const orderedPhases = useMemo(() => {
    const phases: Array<{
      key: string;
      phase: Phase;
      label: string;
      description: string;
      isActive: boolean;
      showConnector: boolean;
      engineBadge?: string;
      rightLabel?: string;
      rightSublabel?: string;
    }> = [];

    // Current active phase at top
    phases.push({
      key: `current-${currentPhase}`,
      phase: currentPhase,
      label: currentConfig.label,
      description: currentConfig.description,
      isActive: true,
      showConnector: phaseHistory.length > 0,
      engineBadge: engineName,
      rightLabel: queuePosition,
    });

    // Add history in reverse order (most recent first)
    [...phaseHistory].reverse().forEach((historyPhase, index) => {
      phases.push({
        key: `history-${historyPhase.phase}-${historyPhase.timestamp}`,
        phase: historyPhase.phase,
        label: historyPhase.label,
        description: historyPhase.description,
        isActive: false,
        showConnector: index < phaseHistory.length - 1,
        engineBadge: historyPhase.engineName,
        rightSublabel: 'Complete',
      });
    });

    return phases;
  }, [currentPhase, currentConfig, phaseHistory, engineName, queuePosition]);

  const imageSpring = useSpring({
    opacity: 1,
    scale: 1,
    from: { opacity: 0, scale: 0.8 },
    config: { tension: 280, friction: 60 },
  });

  return (
    <div className="bg-[#141414] min-h-screen flex flex-col">
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
              <animated.div
                style={imageSpring}
                className="relative shrink-0 size-[32px]"
              >
                <Loader2 className="h-[32px] w-[32px] text-white animate-spin" strokeWidth={2} />
              </animated.div>
            </div>

            {/* Progress Section with Image and Percentage */}
            <div className="flex gap-[16px] items-center relative shrink-0 w-full">
              {/* Thumbnail */}
              <animated.div
                style={imageSpring}
                className="bg-[#2c2c2c] relative rounded-[16px] shrink-0 size-[50px] border border-neutral-700 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] overflow-hidden"
              >
                <img
                  src={image}
                  alt="Processing"
                  className="w-full h-full object-cover"
                />
              </animated.div>

              {/* Progress Details */}
              <div className="flex flex-col gap-[12px] items-center flex-1 relative shrink-0">
                <div className="flex items-end justify-between relative shrink-0 w-full">
                  <div className="flex gap-[10px] h-[20px] items-center relative shrink-0">
                    <p className="font-normal text-[14px] leading-[20px] text-neutral-400">
                      Processing...
                    </p>
                  </div>
                  <div className="flex gap-[10px] h-[20px] items-center relative shrink-0">
                    <p className="font-medium text-[14px] leading-[20px] text-white tabular-nums">
                      {progressPercent}%
                    </p>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-[8px] overflow-clip relative rounded-[9999px] shrink-0 w-full bg-neutral-800/50">
                  <animated.div
                    style={useSpring({
                      width: `${progressPercent}%`,
                      config: { tension: 280, friction: 60 },
                    })}
                    className="absolute bg-white h-[8px] left-0 rounded-full top-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Progressive Phase Tracking */}
          <div className="flex flex-col items-start px-[24px] relative shrink-0 w-full">
            {orderedPhases.map((phase) => (
              <ProgressStage
                key={phase.key}
                label={phase.label}
                sublabel={phase.description}
                status={phase.isActive ? 'active' : 'inactive'}
                showConnector={phase.showConnector}
                engineBadge={phase.engineBadge}
                rightLabel={phase.rightLabel}
                rightSublabel={phase.rightSublabel}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
