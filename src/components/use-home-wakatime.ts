import { useEffect, useState } from "react"
import { homeDashboard } from "@/data/home-dashboard"

type Language = { name: string; count: number }
type CalendarDay = { date: string; seconds: number }

/** Optional reference-site integration; absent configuration makes no requests. */
export function useHomeWakatime() {
  const [languages, setLanguages] = useState<Language[] | null>(null)
  const [calendar, setCalendar] = useState<CalendarDay[] | null>(null)
  const [error, setError] = useState(false)
  const { languagesUrl, calendarUrl } = homeDashboard.wakatime
  useEffect(() => {
    const controller = new AbortController()
    let disposed = false
    const timeout = setTimeout(() => controller.abort(), 10000)
    async function read(url: string) {
      const parsed = new URL(url)
      if (parsed.protocol !== "https:" || parsed.hostname !== "wakatime.com" || !parsed.pathname.startsWith("/share/")) {
        throw new Error("Use a public HTTPS WakaTime share URL")
      }
      const response = await fetch(url, { signal: controller.signal, credentials: "omit" })
      if (!response.ok) throw new Error("WakaTime is unavailable")
      return response.json()
    }
    const tasks: Promise<void>[] = []
    if (languagesUrl) tasks.push(read(languagesUrl).then((result) => {
      if (!Array.isArray(result.data)) throw new Error("Invalid language data")
      const data = result.data.filter((item: { name?: unknown; hours?: unknown }) => typeof item.name === "string" && typeof item.hours === "number" && Number.isFinite(item.hours) && item.hours >= 0)
        .slice(0, 5).map((item: { name: string; hours: number }) => ({ name: item.name, count: Math.round(item.hours * 10) / 10 }))
      if (!disposed) setLanguages(data)
    }))
    if (calendarUrl) tasks.push(read(calendarUrl).then((result) => {
      if (!Array.isArray(result.days)) throw new Error("Invalid calendar data")
      const data = result.days.filter((item: { date?: unknown; total?: unknown }) => typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && typeof item.total === "number" && Number.isFinite(item.total) && item.total >= 0)
        .map((item: { date: string; total: number }) => ({ date: item.date, seconds: item.total }))
      if (!disposed) setCalendar(data)
    }))
    void Promise.allSettled(tasks).then((results) => {
      clearTimeout(timeout)
      if (!disposed) setError(results.some((result) => result.status === "rejected"))
    })
    return () => { disposed = true; clearTimeout(timeout); controller.abort() }
  }, [languagesUrl, calendarUrl])
  return { languages, calendar, error }
}
