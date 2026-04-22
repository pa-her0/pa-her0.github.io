"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

type PagefindResult = {
  id: string
  data: () => Promise<{
    url: string
    excerpt: string
    title?: string
    meta?: {
      title?: string
    }
  }>
}

declare global {
  interface Window {
    pagefind?: {
      search: (query: string) => Promise<{ results: PagefindResult[] }>
    }
  }
}

export function HeaderSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PagefindResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [loadRequested, setLoadRequested] = useState(false)
  const isProd = import.meta.env.PROD
  const containerRef = useRef<HTMLDivElement>(null)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  const showPanel = isOpen || (isFocused && (query.trim() || !isProd))

  const requestPagefindLoad = useCallback(() => {
    if (!isProd) return
    if (window.pagefind || status === "loading" || status === "ready") return
    setLoadRequested(true)
  }, [isProd, status])

  const focusSearchInput = (delay = 0) => {
    const focus = () => {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches
      const target = isDesktop ? desktopInputRef.current : mobileInputRef.current
      if (target) {
        target.focus()
        target.select()
      }
    }
    if (delay > 0) {
      window.setTimeout(focus, delay)
    } else {
      focus()
    }
  }

  // Load Pagefind as ES module
  useEffect(() => {
    if (!isProd || !loadRequested) return

    let cancelled = false

    const loadPagefind = async () => {
      if (window.pagefind) {
        setStatus("ready")
        return
      }

      setStatus("loading")

      // Use script tag with type="module" to load pagefind
      const script = document.createElement("script")
      script.type = "module"
      script.textContent = `
        import * as pagefind from "/pagefind/pagefind.js";
        window.pagefind = pagefind;
        window.dispatchEvent(new CustomEvent("pagefind:loaded"));
      `
      script.onerror = () => {
        if (!cancelled) setStatus("error")
      }
      document.head.appendChild(script)
    }

    const handleLoaded = () => {
      if (!cancelled) setStatus("ready")
    }

    window.addEventListener("pagefind:loaded", handleLoaded)
    loadPagefind()

    return () => {
      cancelled = true
      window.removeEventListener("pagefind:loaded", handleLoaded)
    }
  }, [isProd, loadRequested])

  // Run search
  useEffect(() => {
    if (!isProd) return

    const runSearch = async () => {
      if (!query.trim()) {
        setResults([])
        return
      }

      if (!window.pagefind) {
        requestPagefindLoad()
        return
      }

      try {
        const { results: searchResults } = await window.pagefind!.search(query)
        setResults(searchResults.slice(0, 8)) // Limit results
      } catch (error) {
        console.error("Pagefind search failed:", error)
      }
    }

    const debounce = setTimeout(runSearch, 200)
    return () => clearTimeout(debounce)
  }, [query, isProd, status, requestPagefindLoad])

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        const isDesktop = window.matchMedia("(min-width: 768px)").matches
        if (isDesktop) {
          setIsFocused(true)
          requestPagefindLoad()
          focusSearchInput()
        } else {
          setIsOpen(true)
          requestPagefindLoad()
          focusSearchInput(100)
        }
      }
      if (event.key === "Escape") {
        setIsOpen(false)
        setIsFocused(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [requestPagefindLoad])

  // Lock page scroll when search panel is open
  useEffect(() => {
    if (!showPanel) return
    const { body } = document
    const prevOverflow = body.style.overflow
    body.style.overflow = "hidden"
    return () => {
      body.style.overflow = prevOverflow
    }
  }, [showPanel])

  const overlay = showPanel && typeof document !== "undefined"
    ? createPortal(
      <div
        className="fixed inset-0 z-40"
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setIsOpen(false)
          setIsFocused(false)
        }}
      />,
      document.body
    )
    : null

  return (
    <div ref={containerRef} className="relative">
      {overlay}
      {/* Desktop search input */}
      <div className="hidden md:flex items-center">
        <div className={cn(
          "flex items-center h-9 rounded-lg transition-all duration-200",
          "bg-muted/50 hover:bg-muted focus-within:bg-muted",
          isFocused && "ring-1 ring-border"
        )}>
          <SearchIcon className="w-4 h-4 ml-3 text-muted-foreground pointer-events-none" />
          <input
            ref={desktopInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true)
              requestPagefindLoad()
            }}
            placeholder="搜索..."
            className={cn(
              "bg-transparent text-sm outline-none h-full px-2",
              "text-foreground placeholder:text-muted-foreground",
              "w-32 focus:w-48 transition-all duration-200"
            )}
          />
          <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 mr-2 text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Mobile search button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          requestPagefindLoad()
          if (!isOpen) focusSearchInput(100)
        }}
        className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="搜索"
      >
        <SearchIcon className="w-5 h-5" />
      </button>

      {/* Search panel */}
      <div className={cn(
        "fixed left-4 right-4 top-16 md:absolute md:top-full md:left-auto md:right-0 md:w-96 md:mt-2 z-50",
        "bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-lg",
        "transition-all duration-200 overflow-hidden",
        showPanel ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      )}>
        {/* Mobile search input inside panel */}
        <div className="md:hidden p-3 border-b border-border">
          <div className="flex items-center h-10 rounded-lg bg-muted/50">
            <SearchIcon className="w-4 h-4 ml-3 text-muted-foreground" />
            <input
            ref={mobileInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true)
              requestPagefindLoad()
            }}
            placeholder="搜索..."
            className="flex-1 bg-transparent text-sm outline-none px-2 text-foreground placeholder:text-muted-foreground"
          />
          </div>
        </div>

        {/* Dev mode notice */}
        {!isProd && (
          <div className="p-3 text-xs text-muted-foreground border-b border-border">
            搜索仅在生产构建后可用
          </div>
        )}

        {/* Search results */}
        <div className="max-h-80 overflow-y-auto">
          {isProd && query.trim() && results.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              未找到相关结果
            </div>
          )}

          {results.map((result) => (
            <SearchResultItem key={result.id} result={result} onSelect={() => setIsOpen(false)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SearchResultItem({ result, onSelect }: { result: PagefindResult; onSelect: () => void }) {
  const [data, setData] = useState<{
    url: string
    excerpt: string
    title?: string
    meta?: { title?: string }
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    result.data().then((payload) => {
      if (!cancelled) setData(payload)
    })
    return () => { cancelled = true }
  }, [result])

  if (!data) {
    return (
      <div className="px-4 py-3 text-sm text-muted-foreground animate-pulse">
        加载中...
      </div>
    )
  }

  return (
    <a
      href={data.url}
      onClick={onSelect}
      className="block px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
    >
      <div className="font-medium text-sm text-foreground line-clamp-1">
        {data.meta?.title || data.title || "未命名"}
      </div>
      <div
        className="text-xs text-muted-foreground mt-1 line-clamp-2"
        dangerouslySetInnerHTML={{ __html: data.excerpt }}
      />
    </a>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
