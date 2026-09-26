import type { SVGProps } from "react"

/**
 * Stylized fox head (rubah) silhouette, front profile, with a small
 * growth-leaf accent near the right ear — symbolizing financial growth.
 * Uses currentColor for the head so it inherits the header's white-on-blue
 * treatment; the leaf and snout accents use fixed brand colors.
 */
export function FoxLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      {/* Head + ears silhouette */}
      <path d="M2.4 2.2 L10 6.6 h4 L21.6 2.2 L19.7 13.1 C19.7 16.2 16.3 19.3 12 22 C7.7 19.3 4.3 16.2 4.3 13.1 Z" />
      {/* Snout cut for a sleeker, more defined face */}
      <path
        d="M12 22 C10.3 20.9 9.2 19.9 8.6 19 L12 17.4 L15.4 19 C14.8 19.9 13.7 20.9 12 22 Z"
        fill="#1e3a8a"
      />
      {/* Growth leaf accent near the right ear */}
      <path
        d="M19.6 0.6 C21.9 0.3 23 2 21.7 3.7 C20.2 5.2 17.9 4.4 17.7 2.6 C17.6 1.4 18.5 0.8 19.6 0.6 Z"
        fill="#10b981"
      />
      <path
        d="M19.6 0.9 L18.6 3.6"
        stroke="#065f46"
        strokeWidth="0.3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
