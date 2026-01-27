import { ReactNode } from 'react';
import { useIsDesktop } from '@/hooks/useMediaQuery';

interface ResponsiveScreenProps {
  mobile: ReactNode;
  desktop: ReactNode;
}

export function ResponsiveScreen({ mobile, desktop }: ResponsiveScreenProps) {
  const isDesktop = useIsDesktop();

  // Conditionally render only the appropriate layout
  // This prevents lazy-loaded desktop components from loading on mobile
  // and avoids Suspense fallback flashes during StrictMode double-mounting
  if (isDesktop) {
    return <>{desktop}</>;
  }

  return <>{mobile}</>;
}
