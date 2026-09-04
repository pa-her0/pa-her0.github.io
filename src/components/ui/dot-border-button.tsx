import type { ComponentPropsWithoutRef } from "react"
import "@/styles/dot-border-button.css"

type DotBorderButtonProps = ComponentPropsWithoutRef<"a">

// Adapted from the supplied Dot Border Button effect as a native content link.
// CSS-only decoration keeps the image accessible without an iframe or CDN scripts.
export default function DotBorderButton({ children, className = "", ...props }: DotBorderButtonProps) {
  return (
    <a {...props} className={`dot-border-link ${className}`}>
      <span className="dot-border-content">{children}</span>
      <span className="dot-border-decoration" aria-hidden="true">
        <span className="dot-border-line dot-border-top" />
        <span className="dot-border-line dot-border-right" />
        <span className="dot-border-line dot-border-bottom" />
        <span className="dot-border-line dot-border-left" />
        <span className="dot-border-point dot-border-nw" />
        <span className="dot-border-point dot-border-ne" />
        <span className="dot-border-point dot-border-se" />
        <span className="dot-border-point dot-border-sw" />
      </span>
    </a>
  )
}
