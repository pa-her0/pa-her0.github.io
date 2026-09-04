export interface ActivityDay { date: string; count: number; level: number; future: boolean }

/** Publication dates, not synthetic contributions or git checkout timestamps. */
export function buildHomeActivity(dates: string[], today = new Date(), weeks = 18) {
  const end = new Date(`${today.toISOString().slice(0, 10)}T00:00:00Z`)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - start.getUTCDay() - (weeks - 1) * 7)
  const counts = new Map<string, number>()
  for (const date of dates) counts.set(date, (counts.get(date) ?? 0) + 1)
  const days: ActivityDay[] = Array.from({ length: weeks * 7 }, (_, index) => {
    const day = new Date(start)
    day.setUTCDate(start.getUTCDate() + index)
    const date = day.toISOString().slice(0, 10)
    const future = day > end
    const count = future ? 0 : (counts.get(date) ?? 0)
    return { date, count, level: Math.min(count, 4), future }
  })
  const months: { label: string; column: number }[] = []
  let previous = ""
  for (let week = 0; week < weeks; week++) {
    const weekDays = days.slice(week * 7, week * 7 + 7)
    const monthStart = weekDays.find((day) => day.date.endsWith("-01") && !day.future)
    const date = new Date(`${monthStart?.date ?? weekDays[0].date}T00:00:00Z`)
    const month = date.toISOString().slice(0, 7)
    if (month !== previous) months.push({ label: date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }), column: week + 1 })
    previous = month
  }
  return { days, months, total: days.reduce((sum, day) => sum + day.count, 0) }
}
