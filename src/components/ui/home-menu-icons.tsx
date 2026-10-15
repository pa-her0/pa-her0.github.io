import type { SVGProps } from "react"

const iconProps = {
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const

export function UpdatesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M35 10H17a5 5 0 0 0-5 5v34a5 5 0 0 0 5 5h29a5 5 0 0 0 5-5V31" />
      <path d="M22 27h10M22 36h19M22 45h13" />
      <path d="M47 7v16M39 15h16" />
    </svg>
  )
}

export function AboutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="26" cy="21" r="11" />
      <path d="M22 24q4 4 8 0M10 54v-5a16 16 0 0 1 32 0v5" />
      <path d="M41 39l6-7a11 11 0 0 0 3-8v-5M47 10l-1-4M55 14l4-2" />
    </svg>
  )
}

export function CvIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="26" cy="16" r="8" />
      <path d="m18 18-9 6a5 5 0 0 0 0 8l9 6a8 8 0 0 1 3 7v4M34 18l8 4a5 5 0 0 1 2 8l-2 3M18 29l5-4" />
      <path d="M34 41h21a2 2 0 0 1 2 3l-4 11a4 4 0 0 1-4 3H28l6-17ZM23 58h26" />
    </svg>
  )
}
