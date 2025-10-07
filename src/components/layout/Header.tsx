import { useState, useEffect } from 'react';

interface CreditsResponse {
  remainingMesh: number;
  dailyMeshLimit: number;
  usedToday: number;
}

export function Header() {
  const [credits, setCredits] = useState<CreditsResponse | null>(null);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const response = await fetch('/api/credits', {
          credentials: 'include', // Important: send cookies
        });

        if (response.ok) {
          const data: CreditsResponse = await response.json();
          setCredits(data);
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
      }
    }

    fetchCredits();
    // Refresh credits every 10 seconds
    const interval = setInterval(fetchCredits, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-neutral-900 relative shrink-0 w-full border-b border-neutral-800">
      <div className="box-border flex flex-wrap items-center justify-between overflow-clip p-[24px] relative w-full">
        {/* Logo */}
        <button className="block cursor-pointer overflow-clip relative shrink-0 size-[32px]">
          <div className="absolute left-[1.63px] size-[28.75px] top-[1.63px]">
            <img src="/icons/logo.svg" alt="Logo" className="w-full h-full" />
          </div>
        </button>

        {/* Credits & Social Links */}
        <div className="flex gap-[12px] items-center justify-end relative shrink-0">
          {/* Credits Badge */}
          {credits && (
            <div className="flex items-center gap-[8px] px-[12px] py-[6px] rounded-full bg-neutral-800 border border-neutral-700">
              <div className="flex items-center gap-[6px]">
                <div className={`w-[8px] h-[8px] rounded-full ${credits.remainingMesh > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-[13px] font-medium text-neutral-200">
                  {credits.remainingMesh}/{credits.dailyMeshLimit}
                </span>
                <span className="text-[11px] text-neutral-500">today</span>
              </div>
            </div>
          )}

          {/* Social Links */}
          <a
            href="https://linkedin.com/in/aarondiggdon"
            target="_blank"
            rel="noopener noreferrer"
            className="box-border flex gap-[11.25px] items-center justify-center p-0 relative rounded-full shrink-0 size-[36px] border border-neutral-700 hover:bg-white transition-colors group"
          >
            <img src="/icons/linkedin.svg" alt="LinkedIn" className="h-[22px] w-[22px] transition-all group-hover:brightness-0" />
          </a>
          <a
            href="https://aarondig.com"
            target="_blank"
            rel="noopener noreferrer"
            className="box-border flex gap-[11.25px] items-center justify-center p-0 relative rounded-full shrink-0 size-[36px] border border-neutral-700 hover:bg-white transition-colors group"
          >
            <img src="/icons/uparrow.svg" alt="External link" className="h-[22px] w-[22px] transition-all group-hover:brightness-0" />
          </a>
        </div>
      </div>
    </header>
  );
}
