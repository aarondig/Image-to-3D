import { ReactNode } from 'react';

interface DesktopLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
}

export function DesktopLayout({ sidebar, content }: DesktopLayoutProps) {
  return (
    <div className="hidden lg:flex bg-neutral-900 h-screen w-full overflow-hidden">
      {/* Left Sidebar - Fixed thin column */}
      {sidebar}

      {/* Main Content Area - Flex to fill */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {content}
      </div>
    </div>
  );
}
