export function LikelyrLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M3 2L12 4L21 2V18L12 22L3 18V2Z" fill="currentColor" opacity="0.15" />
      <path d="M12 4L3 2V18L12 22V4Z" fill="currentColor" opacity="0.3" />
      <path d="M3 2L12 4L21 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 4V22" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 2V18L12 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 2V18L12 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11L12 9L16 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}