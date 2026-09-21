import type { SVGProps } from "react"

/**
 * Stylized fox head (rubah) silhouette, front profile.
 * Uses currentColor so it inherits the header's white-on-blue treatment,
 * matching the previous piggy bank icon's sizing and color behavior.
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
    </svg>
  )
}
