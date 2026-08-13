"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { HeaderSearch } from "./header-search"
import { ThemeToggle } from "./theme-toggle"

const navItems: { name: string; href: string; external?: boolean }[] = [
  { name: "首页", href: "/#home-main" },
  { name: "时间线", href: "/timeline/" },
  { name: "碎碎念", href: "/thoughts/" },
  { name: "项目", href: "/projects/" },
  { name: "友链", href: "/friends/" },
  { name: "留言板", href: "/messages/" },
  { name: "关于", href: "/about/" },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    let ticking = false

    const updateScrolledState = () => {
      const nextScrolled = window.scrollY > 20
      setScrolled((previous) => (previous === nextScrolled ? previous : nextScrolled))
      ticking = false
    }

    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(updateScrolledState)
    }

    updateScrolledState()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = ""
      return
    }
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
          scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/50 py-4" : "bg-transparent py-6",
        )}
      >
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-[1fr_auto_1fr] items-center">
          {/* Left: Logo */}
          <a href="/#home-main" data-astro-prefetch className="group flex items-center gap-2.5 justify-self-start" aria-label="Whalefall 首页">
            <div className="relative h-8 w-9 overflow-hidden transition-transform duration-300 group-hover:scale-105" aria-hidden="true">
              <img src="/brand/whalefall-logo.png" alt="" className="absolute left-1/2 top-0 h-[47px] w-[47px] max-w-none -translate-x-1/2" />
            </div>
            <span className="hidden font-serif text-lg font-semibold tracking-tight text-[#0874c9] sm:block">Whalefall</span>
          </a>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-8 justify-self-center">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
                data-astro-prefetch={item.external ? undefined : ""}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Right: Search + Theme Toggle */}
          <div className="hidden md:flex items-center gap-4 justify-self-end">
            <HeaderSearch />
            <ThemeToggle />
          </div>

          {/* Mobile: Search + Theme + Menu Button */}
          <div className="flex items-center gap-2 md:hidden col-start-3 justify-self-end">
            <HeaderSearch />
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
              aria-label="Toggle menu"
            >
              <div className="relative w-5 h-4">
                <span
                  className={cn(
                    "absolute left-0 top-0 w-full h-px bg-foreground transition-all duration-300",
                    mobileMenuOpen && "top-1/2 -translate-y-1/2 rotate-45 bottom-auto",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-1/2 w-full h-px -translate-y-1/2 bg-foreground transition-all duration-300",
                    mobileMenuOpen && "opacity-0",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 bottom-0 w-full h-px bg-foreground transition-all duration-300",
                    mobileMenuOpen && "top-1/2 -translate-y-1/2 -rotate-45 bottom-auto",
                  )}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl transition-opacity duration-300",
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileMenuOpen(false)}
        role="dialog"
        aria-modal={mobileMenuOpen ? "true" : "false"}
        aria-hidden={!mobileMenuOpen}
      >
        <div
          className="absolute inset-0 flex items-center justify-center px-8"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="absolute inset-x-0 top-0">
            <div className="max-w-6xl mx-auto px-6 pt-6 flex justify-end">
              <button
                type="button"
                className="p-2"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="relative w-5 h-4">
                  <span className="absolute left-0 top-1/2 w-full h-px -translate-y-1/2 bg-foreground rotate-45 transition-all duration-300" />
                  <span className="absolute left-0 top-1/2 w-full h-px -translate-y-1/2 bg-foreground opacity-0 transition-all duration-300" />
                  <span className="absolute left-0 top-1/2 w-full h-px -translate-y-1/2 bg-foreground -rotate-45 transition-all duration-300" />
                </div>
              </button>
            </div>
          </div>
          <nav className="flex flex-col items-center gap-6 text-center">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
                data-astro-prefetch={item.external ? undefined : ""}
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}
