/**
 * Syncs class-schedule.json → Square Catalog so the availability API reads
 * session dates from Square instead of hardcoded code.
 *
 * Usage:  npx tsx scripts/push-schedule.ts
 *
 * To add new sessions: edit class-schedule.json then re-run this script.
 * No code deployment needed — the availability API reads from Catalog live.
 */
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
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

const CATEGORY_NAME = 'class schedule'
const ITEM_NAME = 'Class Session Dates'

interface ClassSchedule {
  dates: string[]
  times: string[]
  maxSeats: number
}

async function main() {
  const raw = readFileSync('class-schedule.json', 'utf8')
  const schedule: ClassSchedule = JSON.parse(raw)
  const { dates, times, maxSeats } = schedule

  if (!dates.every(d => /^\d{4}-\d{2}-\d{2}$/.test(d))) {
    throw new Error('All dates must be in YYYY-MM-DD format')
  }

  console.log(`\n=== Push Class Schedule → Square Catalog (${isProd ? 'PRODUCTION' : 'sandbox'}) ===\n`)
  console.log(`Dates   : ${dates.join(', ')}`)
  console.log(`Times   : ${times.join(', ')}`)
  console.log(`Seats   : ${maxSeats}\n`)

  // --- 1. Find or create "class schedule" category ---
  const catResp = await square.catalog.list({ types: ['CATEGORY'] })
  let categoryId = (catResp.objects ?? []).find(
    o => o.type === 'CATEGORY' && !o.isDeleted && o.categoryData?.name?.toLowerCase() === CATEGORY_NAME
  )?.id

  if (!categoryId) {
    console.log(`Creating "${CATEGORY_NAME}" catalog category...`)
    const r = await square.catalog.object.upsert({
      idempotencyKey: randomUUID(),
      object: {
        type: 'CATEGORY',
        id: '#yopaw-class-schedule-cat',
        categoryData: { name: CATEGORY_NAME },
      },
    })
    categoryId = r.catalogObject?.id!
    console.log(`  → ${categoryId}`)
  } else {
    console.log(`Category "${CATEGORY_NAME}" exists: ${categoryId}`)
  }

  // --- 2. Delete existing "Class Session Dates" item (full replace each run) ---
  const itemResp = await square.catalog.list({ types: ['ITEM'] })
  const existing = (itemResp.objects ?? []).find(
    o =>
      o.type === 'ITEM' &&
      !o.isDeleted &&
      o.itemData?.name === ITEM_NAME &&
      (o.itemData?.categories ?? []).some(c => c.id === categoryId),
  )

  if (existing?.id) {
    console.log(`\nReplacing existing "${ITEM_NAME}" item (${existing.id})...`)
    await square.catalog.batchDelete({ objectIds: [existing.id] })
  }

  // --- 3. Create fresh item — one variation per date ---
  console.log(`\nCreating "${ITEM_NAME}" with ${dates.length} date(s)...`)
  const result = await square.catalog.object.upsert({
    idempotencyKey: randomUUID(),
    object: {
      type: 'ITEM',
      id: '#yopaw-class-session-dates',
      itemData: {
        name: ITEM_NAME,
        categories: [{ id: categoryId, ordinal: BigInt(0) }],
        variations: dates.map(date => ({
          type: 'ITEM_VARIATION' as const,
          id: `#yopaw-date-${date}`,
          itemVariationData: {
            name: date,
            pricingType: 'VARIABLE_PRICING' as const,
          },
        })),
      },
    },
  })

  const item = result.catalogObject
  console.log(`  → item ID: ${item?.id}`)
  console.log(`  → ${item?.itemData?.variations?.length ?? 0} date(s) stored`)

  // --- 4. Summary ---
  console.log('\n=== Done ===\n')
  console.log('Ensure these are set in .env.local AND Vercel environment variables:\n')
  console.log(`SQUARE_MAX_SEATS=${maxSeats}`)
  console.log(`VITE_SQUARE_MAX_SEATS=${maxSeats}`)
  console.log(`SQUARE_CLASS_TIMES=${times.join(',')}`)
  console.log()
  console.log('The availability API now reads session dates from Square Catalog.')
  console.log('To add sessions: edit class-schedule.json and re-run this script.\n')
}

main().catch(err => {
  console.error('Failed:', err?.errors ?? err?.message ?? err)
  process.exit(1)
})
