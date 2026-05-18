export function getMaxSeats(): number {
  return Number(process.env.SQUARE_MAX_SEATS ?? 20)
}

const DEFAULT_CLASS_TIMES = new Set(['10:30', '12:00', '13:30', '15:00'])

// Returns allowed start times in Montreal local time (e.g. "10:30").
// Defaults to the four studio slots; override via SQUARE_CLASS_TIMES env var.
export function getClassTimes(): Set<string> {
  const raw = process.env.SQUARE_CLASS_TIMES?.trim()
  if (!raw) return DEFAULT_CLASS_TIMES
  const times = raw.split(',').map(t => t.trim()).filter(Boolean)
  return times.length > 0 ? new Set(times) : DEFAULT_CLASS_TIMES
}

export function slotMontrealTime(startAt: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(startAt))
  const h = parts.find(p => p.type === 'hour')?.value ?? '00'
  const m = parts.find(p => p.type === 'minute')?.value ?? '00'
  return `${h}:${m}`
}
