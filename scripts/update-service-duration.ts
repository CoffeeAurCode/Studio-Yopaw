/**
 * Updates the Regular Puppy Yoga service variation to 90-minute duration
 * so Square returns slots at 10:30, 12:00, 13:30, 15:00 (90-min intervals).
 * Run with: npx tsx scripts/update-service-duration.ts
 */
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { SquareClient, SquareEnvironment } from 'square'

try {
  const content = readFileSync('.env.local', 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
} catch {
  console.warn('Warning: .env.local not found\n')
}

const isProd = process.env.SQUARE_ENVIRONMENT === 'production'
const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: isProd ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
})

async function main() {
  const variationId = process.env.VITE_SQUARE_YIN_VARIATION_ID
  if (!variationId) throw new Error('VITE_SQUARE_YIN_VARIATION_ID not set in .env.local')

  console.log(`Fetching variation ${variationId} ...`)
  const { object: variation } = await square.catalog.object.get({ objectId: variationId })
  if (!variation) throw new Error('Variation not found')

  const itemId = variation.itemVariationData?.itemId
  if (!itemId) throw new Error('Parent item ID not found on variation')

  console.log(`Parent item ID: ${itemId}`)
  console.log(`Current version: ${variation.version}`)
  console.log(`Updating service duration to 90 minutes ...`)

  const result = await square.catalog.object.upsert({
    idempotencyKey: randomUUID(),
    object: {
      type: 'ITEM_VARIATION',
      id: variation.id!,
      version: variation.version,
      itemVariationData: {
        ...variation.itemVariationData,
        itemId,
        serviceDuration: BigInt(90 * 60 * 1000),
      },
    },
  })

  const updated = result.catalogObject
  console.log(`\nDone. New version: ${updated?.version}`)
  console.log(`\nPaste this into .env.local:`)
  console.log(`VITE_SQUARE_YIN_VARIATION_VERSION=${Number(updated?.version ?? 0)}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Failed:', err?.errors ?? err?.message ?? err)
    process.exit(1)
  })
