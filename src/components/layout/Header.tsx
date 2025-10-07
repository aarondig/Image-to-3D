export function Header() {
  return (
    <header className="bg-neutral-900 relative shrink-0 w-full border-b border-neutral-800">
      <div className="box-border flex flex-wrap items-center justify-between overflow-clip p-[24px] relative w-full">
        {/* Logo */}
        <button className="block cursor-pointer overflow-clip relative shrink-0 size-[32px]">
          <div className="absolute left-[1.63px] size-[28.75px] top-[1.63px]">
            <img src="/icons/logo.svg" alt="Logo" className="w-full h-full" />
          </div>
        </button>

        {/* Social Links */}
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
    </header>
  );
}
