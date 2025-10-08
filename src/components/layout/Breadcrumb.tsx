import { ChevronLeft, Slash } from 'lucide-react';

interface BreadcrumbProps {
  items: string[];
  activeIndex?: number;
  showBack?: boolean;
  onBack?: () => void;
}

export function Breadcrumb({ items, activeIndex, showBack, onBack }: BreadcrumbProps) {
  return (
    <div className="bg-neutral-900 relative shrink-0 w-full border-b border-neutral-800 max-h-[60px]">
      <div className="box-border flex items-center justify-between overflow-clip p-[24px] relative w-full h-[60px]">
        {showBack && onBack && (
          <button
            onClick={onBack}
            className="box-border flex items-center justify-center p-[8px] relative rounded-full shrink-0 size-[36px] border border-neutral-700 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:bg-white transition-colors group"
          >
            <ChevronLeft className="h-[22px] w-[22px] text-white group-hover:text-black transition-colors" strokeWidth={2} />
          </button>
        )}

        <div className="flex gap-[6px] items-center relative shrink-0">
          {items.map((item, index) => (
            <div key={index} className="flex gap-[6px] items-center">
              <p className={`leading-auto text-[14px] whitespace-pre ${index === activeIndex ? 'font-medium text-neutral-50' : 'font-normal text-neutral-400'}`}>
                {item}
              </p>
              {index < items.length - 1 && (
                <Slash className="h-[14px] w-[14px] text-neutral-400" strokeWidth={2} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
