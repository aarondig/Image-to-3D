import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft } from 'lucide-react';
import { useSpring, animated } from '@react-spring/web';
import { DesktopLayout3Panel } from '@/components/desktop/DesktopLayout3Panel';
import { LoadingCube } from '@/components/desktop/LoadingCube';
import { ProgressStage } from '@/components/ui/ProgressStage';
import { safeHref } from '@/lib/safeUrl';
import type { Phase } from '@/types/api';

interface PhaseData {
  phase: Phase;
  label: string;
  description: string;
  timestamp: number;
  queuePosition?: string;
  engineName?: string;
}

interface DesktopProcessingProps {
  image: string;
  progress: number;
  currentPhase: Phase;
  phaseHistory: PhaseData[];
  queuePosition?: string;
  engineName?: string;
  onBack?: () => void;
  onLogoClick?: () => void;
}

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

export function DesktopProcessing({
  image,
  progress,
  currentPhase,
  phaseHistory,
  queuePosition,
  engineName,
  onBack,
  onLogoClick,
}: DesktopProcessingProps) {
  const progressPercent = Math.round(progress * 100);
  const currentConfig = PHASE_CONFIG[currentPhase];

  const orderedPhases = useMemo(() => {
    const phases: Array<{
      key: string;
      label: string;
      description: string;
      isActive: boolean;
      showConnector: boolean;
      engineBadge?: string;
      rightLabel?: string;
      rightSublabel?: string;
    }> = [];

    if (currentPhase !== 'ready' && currentPhase !== 'error') {
      phases.push({
        key: 'current',
        label: currentConfig.label,
        description: currentConfig.description,
        isActive: true,
        showConnector: phaseHistory.length > 0,
        engineBadge: currentPhase === 'queued' && engineName ? engineName : undefined,
        rightLabel: currentPhase === 'queued' && queuePosition ? queuePosition : undefined,
      });
    }

    const reversedHistory = [...phaseHistory].reverse();
    reversedHistory.forEach((phase, index) => {
      const config = PHASE_CONFIG[phase.phase];
      phases.push({
        key: `history-${phase.timestamp}`,
        label: config.label,
        description: config.description,
        isActive: false,
        showConnector: index < reversedHistory.length - 1,
        engineBadge: phase.engineName,
        rightLabel: phase.queuePosition,
        rightSublabel: 'Complete',
      });
    });

    return phases;
  }, [currentPhase, currentConfig, phaseHistory, queuePosition, engineName]);

  const imageSpring = useSpring({
    opacity: 1,
    scale: 1,
    from: { opacity: 0, scale: 0.8 },
    config: { tension: 280, friction: 60 },
  });

  return (
    <DesktopLayout3Panel
      panel1={
        /* PANEL 1: Collapsed Sidebar - 84px */
        <motion.div
          className="flex flex-col h-full w-[84px] border-r border-neutral-800 shrink-0"
          initial={{ width: 416, opacity: 1 }}
          animate={{ width: 84, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 60,
            mass: 1,
          }}
        >
          {/* Header with Logo */}
          <motion.div
            className="h-[84px] border-b border-neutral-800 flex items-center justify-center px-6"
            initial={{ justifyContent: 'space-between' }}
            animate={{ justifyContent: 'center' }}
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
            >
              <div className="absolute left-[1.83px] size-[32.344px] top-[1.83px]">
                <img src="/icons/logo.svg" alt="Logo" className="w-full h-full" />
              </div>
            </motion.button>
          </motion.div>

          {/* Footer - Icons stacked vertically */}
          <motion.div
            className="flex-1 flex flex-col justify-end items-center"
            initial={{ paddingBottom: 0 }}
            animate={{ paddingBottom: 40 }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 60,
            }}
          >
            <motion.div
              layoutId="social-icons"
              className="flex flex-col gap-2"
              initial={{ flexDirection: 'row', paddingLeft: 24, paddingRight: 24 }}
              animate={{ flexDirection: 'column', paddingLeft: 0, paddingRight: 0 }}
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
        </motion.div>
      }
      panel2={
        /* PANEL 2: Processing Panel - 416px */
        <motion.div
          className="flex flex-col h-full w-[416px] border-r border-neutral-800 shrink-0"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 60,
            mass: 0.8,
          }}
        >
          {/* Header with Back Button */}
          <div className="h-[84px] border-b border-neutral-800 flex items-center px-6">
            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border border-neutral-700 flex items-center justify-center p-2 rounded-full shrink-0 size-9 hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft className="w-[22px] h-[22px] text-white" />
            </motion.button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col gap-6 p-6 overflow-hidden">
            {/* Processing Card - 368px width */}
            <motion.div
              layoutId="main-card"
              className="bg-[#1e1e1e] flex flex-col gap-6 p-6 rounded-2xl border border-neutral-800 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] w-[368px]"
            >
              {/* Header with Spinner */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5 flex-1">
                  <p className="text-sm font-semibold text-white">Generating Mesh</p>
                  <p className="text-sm font-normal text-neutral-400">
                    This usually takes 30-90 seconds.
                  </p>
                </div>
                <animated.div style={imageSpring} className="shrink-0 size-8">
                  <Loader2 className="h-8 w-8 text-white animate-spin" strokeWidth={2} />
                </animated.div>
              </div>

              {/* Progress Section */}
              <div className="flex gap-4 items-center">
                {/* Thumbnail - 50px */}
                <animated.div
                  style={imageSpring}
                  className="bg-[#2c2c2c] rounded-[10.88px] shrink-0 size-[50px] border border-neutral-700 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] overflow-hidden"
                >
                  <img src={image} alt="Processing" className="w-full h-full object-cover" />
                </animated.div>

                {/* Progress Details */}
                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex items-end justify-between">
                    <p className="text-sm font-normal text-neutral-400">Processing...</p>
                    <p className="text-sm font-semibold text-white tabular-nums">
                      {progressPercent}%
                    </p>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-2 rounded-full bg-neutral-800/50 overflow-hidden">
                    <animated.div
                      style={useSpring({
                        width: `${progressPercent}%`,
                        config: { tension: 280, friction: 60 },
                      })}
                      className="bg-white h-2 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Phase Tracking - 368px width */}
            <div className="flex flex-col w-[368px] overflow-hidden">
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
        </motion.div>
      }
      panel3={
        /* PANEL 3: Canvas Area - Flexible, fills remaining space */
        <div className="flex flex-col h-full flex-1 min-w-0">
          {/* Breadcrumb Header */}
          <div className="h-[84px] border-b border-neutral-800 flex items-center justify-end px-6 shrink-0">
            <div className="flex gap-1.5 items-center">
              <p className="text-sm font-normal text-neutral-400">Upload</p>
              <span className="text-sm text-neutral-400">/</span>
              <p className="text-sm font-medium text-neutral-50">Generate</p>
              <span className="text-sm text-neutral-400">/</span>
              <p className="text-sm font-normal text-neutral-400">View</p>
            </div>
          </div>

          {/* Canvas - Fills available space */}
          <div className="flex-1 p-6 min-h-0">
            <div className="w-full h-full bg-[#1e1e1e] border border-neutral-800 rounded-[32px] overflow-hidden">
              <Canvas camera={{ position: [0, 0, 2], fov: 50 }} style={{ touchAction: 'none' }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <directionalLight position={[-10, -10, -5]} intensity={0.3} />
                <Suspense fallback={<LoadingCube />}>
                  <LoadingCube />
                </Suspense>
                <Environment preset="city" />
              </Canvas>
            </div>
          </div>
        </div>
      }
    />
  );
}
