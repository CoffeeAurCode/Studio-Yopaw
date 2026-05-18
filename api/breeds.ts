import type { VercelRequest, VercelResponse } from '@vercel/node'
import { square, getLocationId } from './_square.js'

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
  const startDate = q.startDate?.trim()
  const endDate = q.endDate?.trim()

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' })
  }

  try {
    const chunks = dateChunks(startDate, endDate)
    const chunkResults = await Promise.all(
      chunks.map(chunk =>
        square.bookings.list({
          locationId: getLocationId(),
          startAtMin: `${chunk.start}T00:00:00Z`,
          startAtMax: `${chunk.end}T23:59:59Z`,
        }),
      ),
    )

    const allBookings = chunkResults.flatMap(r => r.data ?? [])
    const allDayBookings = allBookings.filter(
      b => b.allDay === true && b.status === 'ACCEPTED' && b.customerId,
    )

    if (allDayBookings.length === 0) {
      return res.status(200).json({ schedule: {} })
    }

    const customerIds = [...new Set(allDayBookings.map(b => b.customerId!))]
    const customerResults = await Promise.allSettled(
      customerIds.map(id => square.customers.get({ customerId: id })),
    )
    const customerMap = new Map(
      customerResults
        .filter(
          (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof square.customers.get>>> =>
            r.status === 'fulfilled' && !!r.value.customer?.id,
        )
        .map(r => [
          r.value.customer!.id!,
          {
            en: (r.value.customer!.givenName ?? '').trim(),
            fr: (r.value.customer!.familyName ?? '').trim(),
          },
        ]),
    )

    const schedule: Record<string, { breed: { en: string; fr: string }; serviceIds: string[] }[]> = {}

    for (const booking of allDayBookings) {
      const date = booking.startAt!.slice(0, 10)
      const breed = customerMap.get(booking.customerId!) ?? { en: 'Unknown', fr: 'Unknown' }
      const serviceIds = (booking.appointmentSegments ?? [])
        .map(seg => seg.serviceVariationId!)
        .filter(Boolean)

      if (!schedule[date]) schedule[date] = []
      schedule[date].push({ breed, serviceIds })
    }

    return res.status(200).json({ schedule })
  } catch (err) {
    console.error('breeds error', err)
    return res.status(500).json({ error: 'Failed to fetch breed schedule' })
  }
}
