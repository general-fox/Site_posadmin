const paths = {
  plus: "M5 12h14m-7-7v14",
  minus: "M5 12h14",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M18 6 6 18",
  "arrow-up-right": "M6 18 18 6M6 6h12v12",
  "arrow-right": "M4 12h16m-6-6 6 6-6 6",
  "arrow-down": "M12 4v16m-6-6 6 6 6-6",
  "chevron-down": "m6 9 6 6 6-6",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4",
} as const;

type UiIconProps = {
  name: keyof typeof paths;
  size?: number;
  className?: string;
};

export function UiIcon({ name, size = 18, className }: UiIconProps) {
  return <svg
    className={className ? `shrink-0 ${className}` : "shrink-0"}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.65"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  ><path d={paths[name]} /></svg>;
}
