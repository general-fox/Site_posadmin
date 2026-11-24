const symbolPath = "M15.8 29.2V17.1H13.8V13.4H15.8V12.3C15.8 8.7 18.1 6.8 21.8 6.8C22.8 6.8 23.7 6.9 24.6 7.1V10.9H22.7C20.9 10.9 20.1 11.5 20.1 13.2V13.4H24.1V17.1H20.1V29.2H15.8Z";

/** Vector artwork redrawn from the supplied Flexbonus brand mark. */
export function FlexBonusLogo({ className, symbolOnly = false }: { className?: string; symbolOnly?: boolean }) {
  return <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox={symbolOnly ? "0 0 38 38" : "0 0 144 38"}
    width={symbolOnly ? 38 : 144}
    height="38"
    role="img"
    aria-label="Flexbonus"
    focusable="false"
  >
    <g transform="translate(1 1)">
      <rect width="36" height="36" rx="11.5" fill="#1043F5" />
      <rect x="1" y="1" width="34" height="34" rx="10.5" fill="#335CFF" />
      <path d={symbolPath} transform="translate(.65 .65)" fill="#173FEA" />
      <path d={symbolPath} fill="#FFFFFF" />
      <circle cx="26.4" cy="24.7" r="3.8" fill="#1747EE" />
      <circle cx="26.1" cy="24.4" r="3.2" fill="#B6FFDB" />
    </g>
    {!symbolOnly && <text
      x="45"
      y="25.7"
      fill="#111111"
      fontFamily="var(--font-inter), Inter, Arial, sans-serif"
      fontSize="19"
      fontWeight="600"
      letterSpacing="-.65"
    >flexbonus</text>}
  </svg>;
}
