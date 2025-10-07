export function Footer() {
  return (
    <footer className="bg-[#1e1e1e] relative shrink-0 w-full border-t border-neutral-800">
      <div className="box-border flex flex-col gap-[64px] items-start overflow-clip p-[32px] relative w-full">
        {/* Title & Social */}
        <div className="flex items-center justify-between min-w-[240px] relative shrink-0 w-full">
          <h3 className="font-semibold text-[24px] leading-[32px] text-white">
            aarondig
          </h3>
          <div className="flex gap-[8px] items-center justify-end relative shrink-0">
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

        {/* Contact Links */}
        <div className="flex flex-col gap-[24px] items-start relative shrink-0 w-full">
          <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <div className="box-border flex flex-col gap-[10px] items-start pb-[4px] pt-0 px-0 relative shrink-0 w-full">
              <p className="font-bold text-[16px] leading-[1.4] text-white whitespace-pre">
                Contact
              </p>
            </div>
            <div className="h-[22px] relative shrink-0 w-full">
              <a
                href="mailto:aarondiggdon@gmail.com"
                className="font-normal text-[16px] leading-[1.4] text-white whitespace-pre hover:underline"
              >
                aarondiggdon@gmail.com
              </a>
            </div>
            <div className="h-[22px] relative shrink-0 w-full">
              <a
                href="https://linkedin.com/in/aarondiggdon"
                target="_blank"
                rel="noopener noreferrer"
                className="font-normal text-[16px] leading-[1.4] text-white whitespace-pre hover:underline"
              >
                linkedin.com/in/aarondiggdon
              </a>
            </div>
            <div className="h-[22px] relative shrink-0 w-full">
              <a
                href="https://aarondig.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-normal text-[16px] leading-[1.4] text-white whitespace-pre hover:underline"
              >
                aarondig.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
