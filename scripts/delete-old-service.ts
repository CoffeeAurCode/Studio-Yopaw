/**
 * Deletes the old "Regular Puppy Yoga / 60 min Drop-in" catalog item
 * (EPHJEYJELP7USTRKSH7CWXS2) that is a duplicate of the production Yin
 * service variation (UFR52E7LXZ7JT4FEGCVLMAWK) already in .env.local.
 *
 * Usage:  npx tsx scripts/delete-old-service.ts
 */
import { readFileSync } from 'node:fs'
import { SquareClient, SquareEnvironment } from 'square'

// Load .env.local
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
} catch { console.warn('Warning: .env.local not found\n') }

function stripBom(s: string) { while (s.charCodeAt(0) === 0xFEFF) s = s.slice(1); return s.trim() }

const isProd = stripBom(process.env.SQUARE_ENVIRONMENT ?? '') === 'production'
const square = new SquareClient({
  token: stripBom(process.env.SQUARE_ACCESS_TOKEN ?? ''),
  environment: isProd ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
})

// Parent item ID — deleting this also removes the only variation VJCHZYMZHVSIQGU2SGKJCTCO
const OLD_ITEM_ID = 'EPHJEYJELP7USTRKSH7CWXS2'
const EXPECTED_NAME = 'Regular Puppy Yoga'

async function main() {
  console.log(`\n=== Delete Old Service (${isProd ? 'PRODUCTION' : 'sandbox'}) ===\n`)

  // Confirm the item still exists and matches expected name
  const resp = await square.catalog.object.get({ objectId: OLD_ITEM_ID })
  const obj = resp.object
  if (!obj || obj.isDeleted) {
    console.log(`Item ${OLD_ITEM_ID} does not exist or is already deleted. Nothing to do.`)
    return
  }

  const name = obj.itemData?.name ?? '(unknown)'
  console.log(`Found item: "${name}" (${obj.id})`)
  if (name !== EXPECTED_NAME) {
    console.error(`Name mismatch — expected "${EXPECTED_NAME}", got "${name}". Aborting.`)
    process.exit(1)
  }

  const variations = obj.itemData?.variations ?? []
  console.log(`Variations (${variations.length}):`)
  for (const v of variations) {
    console.log(`  ${v.id} — ${v.itemVariationData?.name}`)
  }

  console.log(`\nDeleting item ${OLD_ITEM_ID} and all its variations...`)
  await square.catalog.batchDelete({ objectIds: [OLD_ITEM_ID] })

  console.log('Done. The old "Regular Puppy Yoga" item has been removed from Square.')
  console.log('The production Yin service (UFR52E7LXZ7JT4FEGCVLMAWK) is unaffected.\n')
}

main().catch(err => {
  console.error('Failed:', err?.errors ?? err?.message ?? err)
  process.exit(1)
})
