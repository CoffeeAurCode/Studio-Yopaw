import type { VercelRequest, VercelResponse } from '@vercel/node'
import { square, getLocationId } from './_square.js'
import { getMaxSeats, getClassTimes, slotMontrealTime } from './_config.js'

const SCHEDULE_CATEGORY = 'class schedule'
const SCHEDULE_ITEM = 'Class Session Dates'

/** Reads allowed session dates from Square Catalog (pushed by scripts/push-schedule.ts).
 *  Returns null if no schedule is found — availability is unfiltered in that case. */
async function getAllowedDates(): Promise<Set<string> | null> {
  const catResp = await square.catalog.list({ types: ['CATEGORY'] })
  const cat = (catResp.objects ?? []).find(
    o => o.type === 'CATEGORY' && !o.isDeleted && o.categoryData?.name?.toLowerCase() === SCHEDULE_CATEGORY,
  )
  if (!cat) return null

  const itemResp = await square.catalog.list({ types: ['ITEM'] })
  const item = (itemResp.objects ?? []).find(
    o =>
      o.type === 'ITEM' &&
      !o.isDeleted &&
      o.itemData?.name === SCHEDULE_ITEM &&
      (o.itemData?.categories ?? []).some(c => c.id === cat.id),
  )
  if (!item) return null

  const dates = new Set(
    (item.itemData?.variations ?? [])
      .filter(v => !v.isDeleted && /^\d{4}-\d{2}-\d{2}$/.test(v.itemVariationData?.name ?? ''))
      .map(v => v.itemVariationData!.name!),
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
      for (const booking of result.data ?? []) {
        if (booking.startAt && booking.status === 'ACCEPTED') {
          bookingCounts.set(booking.startAt, (bookingCounts.get(booking.startAt) ?? 0) + 1)
        }
      }
    }

    const maxSeats = getMaxSeats()
    const availabilities = allAvailabilities
      .filter(slot => {
        if (!slot.startAt) return false
        if (allowedDates && !allowedDates.has(slot.startAt.slice(0, 10))) return false
        if (!allowedTimes.has(slotMontrealTime(slot.startAt))) return false
        return true
      })
      .map(slot => ({
        startAt: slot.startAt!,
        seatsRemaining: maxSeats - (bookingCounts.get(slot.startAt!) ?? 0),
      }))
      .filter(slot => slot.seatsRemaining > 0)

    return res.status(200).json({ availabilities })
  } catch (err) {
    console.error('availability error', err)
    return res.status(500).json({ error: 'Failed to fetch availability' })
  }
}
