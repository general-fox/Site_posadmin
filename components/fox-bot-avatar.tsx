export function FoxBotAvatar({ className }: { className?: string }) {
  return <svg className={className} width="100%" height="100%" viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
    <circle cx="20" cy="20" r="20" fill="#28313d" />
    <path d="m5.7 6.2 10.8 5.5a16 16 0 0 1 7 0l10.8-5.5-2.8 15.5C29.9 27 25.6 31 20 33.8 14.4 31 10 27 8.5 21.7Z" fill="#f39c46" />
    <path d="m9.3 10.5 4.6 2.4-3.7 2.4Zm21.4 0-4.6 2.4 3.7 2.4Z" fill="#714224" />
    <path d="M8.5 21.1c4.9-.5 8.4 1.5 11.5 5.7 3.1-4.2 6.6-6.2 11.5-5.7-1.8 5.2-6.1 9.5-11.5 12.7-5.4-3.2-9.7-7.5-11.5-12.7Z" fill="#fff5df" />
    <path d="m13.2 19.5 3.1 1.5m10.5-1.5-3.1 1.5" stroke="#352b2b" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M17.1 26.2c0-.7 5.8-.7 5.8 0 0 1.3-1.8 3.4-2.9 3.4s-2.9-2.1-2.9-3.4Z" fill="#352b2b" />
  </svg>;
}
