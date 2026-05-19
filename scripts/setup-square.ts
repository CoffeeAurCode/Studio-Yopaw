/**
 * Square setup script — lists locations, team members, and existing services,
 * then prints the exact env var lines to paste into .env.local
 * Run with: npx tsx scripts/setup-square.ts
 */
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { SquareClient, SquareEnvironment } from 'square'

// Load .env.local without dotenv dependency
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
  console.warn('Warning: .env.local not found — using existing process.env\n')
}

const isProd = process.env.SQUARE_ENVIRONMENT === 'production'

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: isProd ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
})

async function main() {
  console.log(`\n=== Square Setup (${isProd ? 'PRODUCTION' : 'sandbox'}) ===\n`)

  // --- 1. Locations ---
  console.log('--- Locations ---')
  const locResult = await square.locations.list()
  const locations = locResult.locations ?? []
  for (const loc of locations) {
    console.log(`  [${loc.id}] ${loc.name} — ${loc.status}`)
  }
  const activeLocation = locations.find(l => l.status === 'ACTIVE') ?? locations[0]
  console.log()

  // --- 2. Team members ---
  console.log('--- Team Members ---')
  const teamResult = await square.teamMembers.search({
    query: { filter: { status: 'ACTIVE' } },
  })
  const members = teamResult.teamMembers ?? []
  if (members.length === 0) {
    console.log('  (none found)')
  } else {
    for (const m of members) {
      console.log(`  [${m.id}] ${m.displayName ?? 'Unnamed'}`)
    }
  }
  console.log()

  // --- 3. Existing APPOINTMENTS_SERVICE catalog items ---
  console.log('--- Existing Appointment Services ---')
  const catalogResult = await square.catalog.list({ types: 'ITEM' })
  const services = (catalogResult.objects ?? []).filter(
    o => o.itemData?.productType === 'APPOINTMENTS_SERVICE'
  )

  if (services.length === 0) {
    console.log('  (none found — creating Regular Puppy Yoga...)\n')
    await createService()
  } else {
    for (const svc of services) {
      console.log(`  [${svc.id}] ${svc.itemData?.name}`)
      for (const v of svc.itemData?.variations ?? []) {
        console.log(`    variation: "${v.itemVariationData?.name}"`)
        console.log(`      id:      ${v.id}`)
        console.log(`      version: ${Number(v.version ?? 0)}`)
      }
    }
    console.log()
  }

  // --- 4. Print env var block to copy ---
  console.log('=== PASTE INTO .env.local ===\n')

  if (activeLocation) {
    console.log(`SQUARE_LOCATION_ID=${activeLocation.id}`)
    console.log(`VITE_SQUARE_LOCATION_ID=${activeLocation.id}`)
  }

  if (members[0]) {
    console.log(`VITE_SQUARE_TEAM_MEMBER_ID=${members[0].id}`)
  }

  if (services.length > 0) {
    console.log('\n# Match each service variation to the correct VITE_ key:')
    for (const svc of services) {
      console.log(`\n# ${svc.itemData?.name}`)
      for (const v of svc.itemData?.variations ?? []) {
        console.log(`# variation: ${v.itemVariationData?.name}`)
        console.log(`VITE_SQUARE_YIN_VARIATION_ID=${v.id}          # rename key to match service type`)
        console.log(`VITE_SQUARE_YIN_VARIATION_VERSION=${Number(v.version ?? 0)}`)
      }
    }
  }

  if (isProd) {
    console.log('\n# Also set your production app ID from developer.squareup.com → your app → Production')
    console.log('VITE_SQUARE_APP_ID=sq0idp-xxxx   # replace with real production app ID')
  }

  console.log('\n===========================\n')
  console.log('NOTE: Go to Square Dashboard → Appointments → Services → assign your team member to each service (required — cannot be done via API).')
}

async function createService() {
  const upsert = await square.catalog.object.upsert({
    idempotencyKey: randomUUID(),
    object: {
      type: 'ITEM',
      id: '#regular-puppy-yoga',
      itemData: {
        name: 'Regular Puppy Yoga',
        description: 'Drop-in puppy yoga session — 60 minutes',
        productType: 'APPOINTMENTS_SERVICE',
        variations: [
          {
            type: 'ITEM_VARIATION',
            id: '#regular-puppy-yoga-var',
            itemVariationData: {
              name: '60 min / Drop-in',
              pricingType: 'FIXED_PRICING',
              priceMoney: { amount: BigInt(4600), currency: 'CAD' },
              availableForBooking: true,
              serviceDuration: BigInt(60 * 60 * 1000),
            },
          },
        ],
      },
    },
  })

  const variation = upsert.catalogObject?.itemData?.variations?.[0]
  if (variation) {
    console.log(`VITE_SQUARE_YIN_VARIATION_ID=${variation.id}`)
    console.log(`VITE_SQUARE_YIN_VARIATION_VERSION=${Number(variation.version ?? 0)}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Setup failed:', err?.errors ?? err?.message ?? err)
    process.exit(1)
  })
