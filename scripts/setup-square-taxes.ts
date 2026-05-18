/**
 * Creates TPS/GST and TVQ/QST tax catalog objects in Square.
 * Run once per environment (sandbox, then production).
 *
 * Usage:
 *   npx tsx scripts/setup-square-taxes.ts
 *
 * Reads from .env.local. After running, copy the printed IDs into your .env:
 *   SQUARE_GST_TAX_ID=...
 *   SQUARE_QST_TAX_ID=...
 */
import 'dotenv/config'
import { SquareClient, SquareEnvironment } from 'square'
import { randomUUID } from 'crypto'

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment:
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
})

async function main() {
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    console.error('Missing SQUARE_ACCESS_TOKEN. Set it in .env.local and retry.')
    process.exit(1)
  }

  console.log(`Environment: ${process.env.SQUARE_ENVIRONMENT ?? 'sandbox'}`)
  console.log('Creating tax catalog objects…\n')

  const result = await client.catalog.batchUpsert({
    idempotencyKey: randomUUID(),
    batches: [
      {
        objects: [
          {
            type: 'TAX',
            id: '#gst',
            taxData: {
              name: 'TPS / GST',
              calculationPhase: 'TAX_SUBTOTAL_PHASE',
              inclusionType: 'ADDITIVE',
              percentage: '5',
              appliesToCustomAmounts: true,
              enabled: true,
            },
          },
          {
            type: 'TAX',
            id: '#qst',
            taxData: {
              name: 'TVQ / QST',
              calculationPhase: 'TAX_SUBTOTAL_PHASE',
              inclusionType: 'ADDITIVE',
              percentage: '9.975',
              appliesToCustomAmounts: true,
              enabled: true,
            },
          },
        ],
      },
    ],
  })

  const mappings = result.idMappings ?? []
  const gstId = mappings.find(m => m.clientObjectId === '#gst')?.objectId
  const qstId = mappings.find(m => m.clientObjectId === '#qst')?.objectId

  if (!gstId || !qstId) {
    console.error('Unexpected response — could not extract IDs.')
    console.error(JSON.stringify(result, null, 2))
    process.exit(1)
  }

  console.log('✅ Tax objects created. Add these to your .env.local and Vercel env vars:\n')
  console.log(`SQUARE_GST_TAX_ID=${gstId}`)
  console.log(`SQUARE_QST_TAX_ID=${qstId}`)
  console.log()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
