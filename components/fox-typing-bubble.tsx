import type { SVGProps } from "react";
import delivery from "./fox-chat-delivery.module.css";

export function FoxTypingBubble({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 44 22" className={`${delivery.typing} ${className}`} aria-hidden="true" focusable="false">
    <path d="M12 1h21a10 10 0 0 1 0 20H8l-7 1q3-3 3-7v-4A10 10 0 0 1 12 1Z" fill="#fff" />
    <g fill="#5994b4">
      {[13, 22, 31].map(x => <circle key={x} className={delivery.dot} cx={x} cy="11" r="2.7" />)}
    </g>
  </svg>;
}
