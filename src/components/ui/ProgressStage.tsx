import { useSpring, animated } from '@react-spring/web';
import { CornerDownRight } from 'lucide-react';

interface ProgressStageProps {
  label: string;
  sublabel?: string;
  status: 'inactive' | 'active';
  showConnector?: boolean;
  engineBadge?: string;
  rightLabel?: string;
  rightSublabel?: string;
}

export function ProgressStage({
  label,
  sublabel,
  status,
  showConnector = true,
  engineBadge,
  rightLabel,
  rightSublabel,
}: ProgressStageProps) {
  const isActive = status === 'active';

  // Smooth spring animations for all state changes
  const contentSpring = useSpring({
    opacity: isActive ? 1 : 0.4,
    config: { tension: 280, friction: 60 },
  });

  const dotSpring = useSpring({
    backgroundColor: isActive ? '#ffffff' : '#404040',
    config: { tension: 280, friction: 60 },
  });

  const sublabelSpring = useSpring({
    opacity: isActive ? 1 : 0,
    height: isActive ? 'auto' : 0,
    marginTop: isActive ? 6 : 0,
    config: { tension: 280, friction: 60 },
  });

  return (
    <animated.div
      style={contentSpring}
      className="relative flex gap-[24px] w-full"
    >
      {/* Left side: Dot + Connector Line */}
      <div className="flex flex-col items-center pt-[6px]">
        {/* Dot Indicator */}
        <animated.div
          style={dotSpring}
          className="size-[8px] rounded-full shrink-0"
        />

        {/* Vertical Connector Line */}
        {showConnector && (
          <div
            className={`w-[1px] flex-1 mt-[8px] transition-colors duration-300 ${
              isActive ? 'bg-neutral-700' : 'bg-neutral-800'
            }`}
          />
        )}
      </div>

      {/* Right side: Content */}
      <div className="flex-1 pb-[16px]">
        {/* Main Row */}
        <div className="flex items-start justify-between gap-2">
          {/* Label */}
          <p
            className={`font-medium text-[14px] leading-[20px] transition-colors duration-300 ${
              isActive ? 'text-white' : 'text-neutral-500'
            }`}
          >
            {label}
          </p>

          {/* Right Label - Inline with title */}
          {(rightLabel || rightSublabel) && (
            <p
              className={`font-medium text-[14px] leading-[20px] tabular-nums transition-colors duration-300 ${
                isActive ? 'text-white' : 'text-neutral-600'
              }`}
            >
              {isActive ? rightLabel : rightSublabel}
            </p>
          )}
        </div>

        {/* Sublabel Row - Smoothly animate in/out */}
        <animated.div
          style={sublabelSpring}
          className="flex items-start justify-between gap-2 overflow-hidden"
        >
          {/* Left Sublabel */}
          <div className="flex items-start gap-1">
            {sublabel && (
              <p className="font-normal text-[12px] leading-[16px] text-neutral-500">
                {sublabel}
              </p>
            )}
            {engineBadge && (
              <div className="flex items-center gap-1">
                <CornerDownRight className="size-[14px] text-neutral-600" strokeWidth={2} />
                <p className="font-normal text-[12px] leading-[16px] text-neutral-500">
                  {engineBadge}
                </p>
              </div>
            )}
          </div>
        </animated.div>
      </div>
    </animated.div>
  );
}
