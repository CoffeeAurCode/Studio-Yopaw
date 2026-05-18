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
    baseAmountCents,
    serviceName,
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
    baseAmountCents: number
    serviceName: string
  }

  const gstTaxId = stripBom(process.env.SQUARE_GST_TAX_ID ?? '')
  const qstTaxId = stripBom(process.env.SQUARE_QST_TAX_ID ?? '')

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

    // 4. Create Order (with taxes when configured) so Square computes the authoritative total
    let chargeAmount: bigint
    let orderId: string | undefined

    if (gstTaxId && qstTaxId) {
      const { order } = await square.orders.create({
        idempotencyKey: randomUUID(),
        order: {
          locationId: getLocationId(),
          customerId,
          referenceId: booking!.id,
          lineItems: [
            {
              quantity: '1',
              name: serviceName,
              basePriceMoney: { amount: BigInt(baseAmountCents), currency: 'CAD' },
              appliedTaxes: [
                { taxUid: 'gst' },
                { taxUid: 'qst' },
              ],
            },
          ],
          taxes: [
            { uid: 'gst', catalogObjectId: gstTaxId, scope: 'LINE_ITEM' },
            { uid: 'qst', catalogObjectId: qstTaxId, scope: 'LINE_ITEM' },
          ],
        },
      })
      chargeAmount = order!.totalMoney!.amount!
      orderId = order!.id
    } else {
      // Tax IDs not yet configured — charge base amount only
      chargeAmount = BigInt(baseAmountCents)
    }

    // 5. Process payment
    const { payment } = await square.payments.create({
      idempotencyKey: randomUUID(),
      sourceId: cardNonce,
      amountMoney: { amount: chargeAmount, currency: 'CAD' },
      locationId: getLocationId(),
      customerId,
      referenceId: booking!.id,
      ...(orderId ? { orderId } : {}),
    })

    // 6. Send lead notification email
    const totalDollars = (Number(chargeAmount) / 100).toFixed(2)
    const baseDollars = (baseAmountCents / 100).toFixed(2)
    const taxDollars = ((Number(chargeAmount) - baseAmountCents) / 100).toFixed(2)

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
        <p><strong>Service:</strong> ${serviceName}</p>
        <p><strong>Subtotal:</strong> $${baseDollars} CAD</p>
        ${gstTaxId && qstTaxId ? `<p><strong>Taxes:</strong> $${taxDollars} CAD (TPS/GST + TVQ/QST)</p>` : ''}
        <p><strong>Total charged:</strong> $${totalDollars} CAD — ${payment!.status}</p>
      `,
    })

    return res.status(200).json({ bookingId: booking!.id, paymentStatus: payment!.status })
  } catch (err) {
    console.error('booking error', err)
    const message = err instanceof Error ? err.message : 'Booking failed'
    return res.status(500).json({ error: message })
  }
}
