/**
 * Attaches GST and QST tax objects to your Square service catalog items.
 * Run AFTER setup-square-taxes.ts AND after your real service IDs are in Square Dashboard.
 *
 * Usage:
 *   npx tsx scripts/attach-square-taxes.ts
 *
 * Requires in .env.local:
 *   SQUARE_ACCESS_TOKEN
 *   SQUARE_ENVIRONMENT
 *   SQUARE_GST_TAX_ID   (from setup-square-taxes.ts)
 *   SQUARE_QST_TAX_ID   (from setup-square-taxes.ts)
 */
import 'dotenv/config'
import { SquareClient, SquareEnvironment } from 'square'
import { randomUUID } from 'crypto'

// Names must match what you named the services in Square Dashboard
const TARGET_ITEM_NAMES = ['Regular Class', 'Private Event', 'Corporate']

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment:
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
})

async function main() {
  const gstTaxId = process.env.SQUARE_GST_TAX_ID?.trim()
  const qstTaxId = process.env.SQUARE_QST_TAX_ID?.trim()

  if (!process.env.SQUARE_ACCESS_TOKEN) {
    console.error('Missing SQUARE_ACCESS_TOKEN.')
    process.exit(1)
  }
  if (!gstTaxId || !qstTaxId) {
    console.error('Missing SQUARE_GST_TAX_ID or SQUARE_QST_TAX_ID. Run setup-square-taxes.ts first.')
    process.exit(1)
  }

  console.log(`Environment: ${process.env.SQUARE_ENVIRONMENT ?? 'sandbox'}`)
  console.log('Fetching catalog items…\n')

  const listResult = await client.catalog.list({ types: 'ITEM' })
  const allItems = listResult.objects ?? []

  const targets = allItems.filter(obj =>
    obj.type === 'ITEM' &&
    TARGET_ITEM_NAMES.some(name =>
      obj.itemData?.name?.toLowerCase().includes(name.toLowerCase())
    )
  )

  if (targets.length === 0) {
    console.error(
      'No matching catalog items found.\n' +
      `Looking for items whose names contain: ${TARGET_ITEM_NAMES.join(', ')}\n` +
      'Check that your service names in Square Dashboard match TARGET_ITEM_NAMES in this script.'
    )
    process.exit(1)
  }

  console.log(`Found ${targets.length} item(s):`)
  targets.forEach(t => console.log(`  - ${t.itemData?.name} (${t.id})`))
  console.log()

  const updatedObjects = targets.map(item => ({
    ...item,
    itemData: {
      ...item.itemData,
      taxIds: [gstTaxId, qstTaxId],
    },
  }))

  const upsertResult = await client.catalog.batchUpsert({
    idempotencyKey: randomUUID(),
    batches: [{ objects: updatedObjects }],
  })

  console.log(`✅ Taxes attached to ${upsertResult.objects?.length ?? 0} item(s).`)
  console.log('Verify in Square Dashboard → Items → [item name] → Taxes tab.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
