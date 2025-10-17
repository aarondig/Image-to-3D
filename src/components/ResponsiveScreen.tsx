import { ReactNode } from 'react';
import { useIsDesktop } from '@/hooks/useMediaQuery';

interface ResponsiveScreenProps {
  mobile: ReactNode;
  desktop: ReactNode;
}

export function ResponsiveScreen({ mobile, desktop }: ResponsiveScreenProps) {
  const isDesktop = useIsDesktop();

  return (
    <>
      {/* Mobile Layout */}
      <div className={isDesktop ? 'hidden' : 'block'}>
        {mobile}
      </div>

      {/* Desktop Layout */}
      <div className={isDesktop ? 'block' : 'hidden'}>
        {desktop}
      </div>
    </>
  );
}
