import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'crypto'
import { Resend } from 'resend'
import { square, getLocationId, stripBom } from './_square.js'
import { getMaxSeats } from './_config.js'

const resend = new Resend(stripBom(process.env.RESEND_API_KEY ?? ''))

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const {
    givenName,
    familyName,
    email,
    phone,
    serviceVariationId,
    serviceVariationVersion,
    teamMemberId,
    startAt,
    cardNonce,
    amountCents,
  } = req.body as {
    givenName: string
    familyName: string
    email: string
    phone: string
    serviceVariationId: string
    serviceVariationVersion: number
    teamMemberId: string
    startAt: string
    cardNonce: string
    amountCents: number
  }

  try {
    // 1. Find or create customer
    const searchResult = await square.customers.search({
      query: { filter: { emailAddress: { exact: email } } },
    })

    let customerId = searchResult.customers?.[0]?.id
    if (!customerId) {
      const { customer } = await square.customers.create({
        idempotencyKey: randomUUID(),
        givenName,
        familyName,
        emailAddress: email,
        phoneNumber: phone,
      })
      customerId = customer!.id!
    }

    // 2. Guard: reject if class is already full (race condition protection)
    const slotEnd = new Date(new Date(startAt).getTime() + 1000).toISOString()
    const slotBookings = await square.bookings.list({
      locationId: getLocationId(),
      startAtMin: startAt,
      startAtMax: slotEnd,
    })
    const taken = (slotBookings.data ?? []).filter(
      b => b.startAt === startAt && b.status !== 'CANCELLED'
    ).length
    if (taken >= getMaxSeats()) {
      return res.status(409).json({ error: 'This class is full' })
    }

    // 3. Create the booking
    const { booking } = await square.bookings.create({
      idempotencyKey: randomUUID(),
      booking: {
        locationId: getLocationId(),
        customerId,
        startAt,
        appointmentSegments: [
          {
            serviceVariationId,
            serviceVariationVersion: BigInt(serviceVariationVersion),
            teamMemberId,
          },
        ],
      },
    })

    // 4. Process payment
    const { payment } = await square.payments.create({
      idempotencyKey: randomUUID(),
      sourceId: cardNonce,
      amountMoney: { amount: BigInt(amountCents), currency: 'CAD' },
      locationId: getLocationId(),
      customerId,
      referenceId: booking!.id,
    })

    // 5. Send lead notification email
    await resend.emails.send({
      from: stripBom(process.env.RESEND_FROM_EMAIL ?? 'Studio Yopaw <noreply@studio-yopaw.com>'),
      to: stripBom(process.env.LEAD_NOTIFY_EMAIL ?? ''),
      subject: `New Booking — ${givenName} ${familyName}`,
      html: `
        <h2>New booking confirmed</h2>
        <p><strong>Customer:</strong> ${givenName} ${familyName} (${email})</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Start:</strong> ${startAt}</p>
        <p><strong>Booking ID:</strong> ${booking!.id}</p>
        <p><strong>Payment:</strong> $${(amountCents / 100).toFixed(2)} CAD — ${payment!.status}</p>
      `,
    })

    return res.status(200).json({ bookingId: booking!.id, paymentStatus: payment!.status })
  } catch (err) {
    console.error('booking error', err)
    const message = err instanceof Error ? err.message : 'Booking failed'
    return res.status(500).json({ error: message })
  }
}
