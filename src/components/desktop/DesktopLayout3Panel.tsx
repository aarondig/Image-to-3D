import { ReactNode } from 'react';

interface DesktopLayout3PanelProps {
  panel1: ReactNode; // Left sidebar (84px when collapsed)
  panel2: ReactNode; // Middle panel (416px)
  panel3: ReactNode; // Canvas (700px)
}

export function DesktopLayout3Panel({ panel1, panel2, panel3 }: DesktopLayout3PanelProps) {
  return (
    <div className="hidden lg:flex bg-neutral-900 h-screen w-full overflow-hidden">
      {/* Panel 1: Collapsed Sidebar - 84px */}
      {panel1}

      {/* Panel 2: Middle Panel - 416px */}
      {panel2}

      {/* Panel 3: Canvas Area - 700px */}
      {panel3}
    </div>
  );
}
