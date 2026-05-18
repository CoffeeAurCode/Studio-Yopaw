import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'
import { stripBom } from './_square.js'

const resend = new Resend(stripBom(process.env.RESEND_API_KEY ?? ''))

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { fullName, email, phone, classType, preferredDate, preferredTime, groupSize } =
    req.body as {
      fullName: string
      email: string
      phone: string
      classType: string
      preferredDate?: string
      preferredTime?: string
      groupSize?: string
    }

  try {
    await resend.emails.send({
      from: stripBom(process.env.RESEND_FROM_EMAIL ?? 'Studio Yopaw <noreply@studio-yopaw.com>'),
      to: stripBom(process.env.LEAD_NOTIFY_EMAIL ?? ''),
      subject: `New Inquiry — ${fullName} (${classType})`,
      html: `
        <h2>New class inquiry</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Class type:</strong> ${classType}</p>
        <p><strong>Preferred date:</strong> ${preferredDate ?? '—'}</p>
        <p><strong>Preferred time:</strong> ${preferredTime ?? '—'}</p>
        <p><strong>Group size:</strong> ${groupSize ?? '—'}</p>
      `,
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('inquiry email error', err)
    return res.status(500).json({ error: 'Failed to send inquiry' })
  }
}
