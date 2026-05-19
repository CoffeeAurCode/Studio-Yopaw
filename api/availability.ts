import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { CatalogObject } from 'square'
import { square, getLocationId } from './_square.js'
import { getMaxSeats, getClassTimes, slotMontrealTime } from './_config.js'

const normalizeStartAt = (s: string) => s.replace(/\.\d+Z$/, 'Z')

const SCHEDULE_CATEGORY = 'class schedule'
const SCHEDULE_ITEM = 'Class Session Dates'

/** Reads allowed session dates from Square Catalog (pushed by scripts/push-schedule.ts).
 *  Returns null if no schedule is found — availability is unfiltered in that case. */
async function getAllowedDates(): Promise<Set<string> | null> {
  const catObjects: CatalogObject[] = []
  for await (const obj of await square.catalog.list({ types: 'CATEGORY' })) {
    catObjects.push(obj)
  }
  const cat = catObjects.find(
    o => o.type === 'CATEGORY' && !o.isDeleted && o.categoryData?.name?.toLowerCase() === SCHEDULE_CATEGORY,
  )
  if (!cat) return null

  const itemObjects: CatalogObject[] = []
  for await (const obj of await square.catalog.list({ types: 'ITEM' })) {
    itemObjects.push(obj)
  }
  const item = itemObjects.find(
    o =>
      o.type === 'ITEM' &&
      !o.isDeleted &&
      o.itemData?.name === SCHEDULE_ITEM &&
      (o.itemData?.categories ?? []).some(c => c.id === cat.id),
  )
  if (!item) return null

  const dates = new Set<string>(
    (item.itemData?.variations ?? [])
      .filter(v => !v.isDeleted && /^\d{4}-\d{2}-\d{2}$/.test(v.itemVariationData?.name ?? ''))
      .map(v => v.itemVariationData!.name as string),
  )
  return dates.size > 0 ? dates : null
}

/** Split [startDate, endDate] into ≤30-day chunks to stay within Square's 32-day limit. */
function dateChunks(startDate: string, endDate: string): Array<{ start: string; end: string }> {
  const chunks: Array<{ start: string; end: string }> = []
  let cursor = new Date(`${startDate}T00:00:00Z`)
  const finish = new Date(`${endDate}T00:00:00Z`)

  while (cursor <= finish) {
    const chunkEnd = new Date(cursor)
    chunkEnd.setDate(chunkEnd.getDate() + 29)
    if (chunkEnd > finish) chunkEnd.setTime(finish.getTime())
    chunks.push({
      start: cursor.toISOString().slice(0, 10),
      end: chunkEnd.toISOString().slice(0, 10),
    })
    cursor = new Date(chunkEnd)
    cursor.setDate(cursor.getDate() + 1)
  }
  return chunks
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const q = req.query as Record<string, string>
  const serviceVariationId = q.serviceVariationId?.replace(/^﻿/, '').trim()
  const startDate = q.startDate?.trim()
  const endDate = q.endDate?.trim()
  const teamMemberId = q.teamMemberId?.replace(/^﻿/, '').trim() || undefined

  if (!serviceVariationId || !startDate || !endDate) {
    return res.status(400).json({ error: 'serviceVariationId, startDate, endDate are required' })
  }

  try {
    const segmentFilter = teamMemberId
      ? { serviceVariationId, teamMemberIdFilter: { any: [teamMemberId] } }
      : { serviceVariationId }

    const chunks = dateChunks(startDate, endDate)

    // Fetch schedule + availability + existing bookings in parallel
    const [allowedDates, chunkResults, bookingChunkResults] = await Promise.all([
      getAllowedDates(),
      Promise.all(
        chunks.map(chunk =>
          square.bookings.searchAvailability({
            query: {
              filter: {
                startAtRange: {
                  startAt: `${chunk.start}T00:00:00Z`,
                  endAt: `${chunk.end}T23:59:59Z`,
                },
                locationId: getLocationId(),
                segmentFilters: [segmentFilter],
              },
            },
          }),
        ),
      ),
      Promise.all(
        chunks.map(chunk =>
          square.bookings.list({
            locationId: getLocationId(),
            startAtMin: `${chunk.start}T00:00:00Z`,
            startAtMax: `${chunk.end}T23:59:59Z`,
          }),
        ),
      ),
    ])

    const allowedTimes = getClassTimes()
    const allAvailabilities = chunkResults.flatMap(r => r.availabilities ?? [])

    const bookingCounts = new Map<string, number>()
    for (const result of bookingChunkResults) {
      for await (const booking of result) {
        if (!booking.startAt) continue
        const st = booking.status ?? ''
        if (st === 'CANCELLED_BY_SELLER' || st === 'CANCELLED_BY_CUSTOMER' || st === 'DECLINED') continue
        const key = normalizeStartAt(booking.startAt)
        bookingCounts.set(key, (bookingCounts.get(key) ?? 0) + 1)
      }
    }

    const maxSeats = getMaxSeats()

    // Build a map of slots Square already knows about
    const squareSlotMap = new Map<string, number>()
    for (const slot of allAvailabilities) {
      if (!slot.startAt) continue
      if (allowedDates && !allowedDates.has(slot.startAt.slice(0, 10))) continue
      if (!allowedTimes.has(slotMontrealTime(slot.startAt))) continue
      const booked = bookingCounts.get(normalizeStartAt(slot.startAt)) ?? 0
      squareSlotMap.set(slot.startAt, maxSeats - booked)
    }

    // Determine the set of dates we need to cover
    const coveredDates = new Set<string>()
    for (const startAt of squareSlotMap.keys()) {
      coveredDates.add(startAt.slice(0, 10))
    }
    // Also include all explicitly allowed dates that fall within [startDate, endDate]
    if (allowedDates) {
      for (const d of allowedDates) {
        if (d >= startDate && d <= endDate) coveredDates.add(d)
      }
    }

    // For each covered date, ensure every configured time slot is present
    const availabilities: Array<{ startAt: string; seatsRemaining: number }> = []
    const sortedDates = [...coveredDates].sort()
    const allowedTimesArr = [...allowedTimes].sort()

    for (const dateIso of sortedDates) {
      for (const timeStr of allowedTimesArr) {
        // Build a Montreal-local datetime and convert to UTC ISO
        // We look for an existing Square slot at this time first
        const existingKey = [...squareSlotMap.keys()].find(
          k => k.slice(0, 10) === dateIso && slotMontrealTime(k) === timeStr,
        )
        if (existingKey) {
          const remaining = squareSlotMap.get(existingKey)!
          if (remaining > 0) {
            availabilities.push({ startAt: existingKey, seatsRemaining: remaining })
          }
        } else {
          // Generate a synthetic slot: convert Montreal local time to UTC
          const [h, m] = timeStr.split(':').map(Number)
          // Compute offset by comparing local parse with UTC
          const utcGuess = new Date(`${dateIso}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`)
          // Check what Montreal time that UTC instant maps to
          const checkTime = slotMontrealTime(utcGuess.toISOString())
          const [ch, cm] = checkTime.split(':').map(Number)
          const offsetMinutes = (h * 60 + m) - (ch * 60 + cm)
          const corrected = new Date(utcGuess.getTime() + offsetMinutes * 60_000)
          const syntheticStartAt = corrected.toISOString().replace(/\.\d{3}Z$/, 'Z')

          const booked = bookingCounts.get(normalizeStartAt(syntheticStartAt)) ?? 0
          const remaining = maxSeats - booked
          if (remaining > 0) {
            availabilities.push({ startAt: syntheticStartAt, seatsRemaining: remaining })
          }
        }
      }
    }

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ availabilities })
  } catch (err) {
    console.error('availability error', err)
    return res.status(500).json({ error: 'Failed to fetch availability' })
  }
}
