/**
 * Creates all three Studio Yopaw Square catalog services (yin, gentle, corporate)
 * if they don't already exist, then prints the env var block to paste into .env.local.
 * Run with: npx tsx scripts/setup-all-services.ts
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
} catch { console.warn('Warning: .env.local not found\n') }

function stripBom(s: string) { while (s.charCodeAt(0) === 0xFEFF) s = s.slice(1); return s.trim() }

const isProd = stripBom(process.env.SQUARE_ENVIRONMENT ?? '') === 'production'
const square = new SquareClient({
  token: stripBom(process.env.SQUARE_ACCESS_TOKEN ?? ''),
  environment: isProd ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
})

const SERVICES = [
  {
    id: '#yin-puppy-yoga',
    varId: '#yin-puppy-yoga-var',
    envPrefix: 'VITE_SQUARE_YIN',
    name: 'Regular Puppy Yoga',
    varName: '60 min / Drop-in',
    priceCents: 4600n,
  },
  {
    id: '#private-puppy-yoga',
    varId: '#private-puppy-yoga-var',
    envPrefix: 'VITE_SQUARE_GENTLE',
    name: 'Private Puppy Yoga',
    varName: 'Private Group / up to 20',
    priceCents: 4600n,
  },
  {
    id: '#corporate-puppy-yoga',
    varId: '#corporate-puppy-yoga-var',
    envPrefix: 'VITE_SQUARE_CORP',
    name: 'Corporate Puppy Yoga',
    varName: 'Corporate Group / up to 20',
    priceCents: 4600n,
  },
]

async function main() {
  console.log(`\n=== Studio Yopaw — Square Service Setup (${isProd ? 'PRODUCTION' : 'sandbox'}) ===\n`)

  // List existing services
  const catalogResult = await square.catalog.list({ types: 'ITEM' })
  const existing = (catalogResult.objects ?? []).filter(
    o => o.itemData?.productType === 'APPOINTMENTS_SERVICE'
  )

  console.log('--- Existing appointment services ---')
  if (existing.length === 0) console.log('  (none)')
  for (const svc of existing) {
    console.log(`  [${svc.id}] ${svc.itemData?.name}`)
    for (const v of svc.itemData?.variations ?? []) {
      console.log(`    variation: [${v.id}] "${v.itemVariationData?.name}" v${Number(v.version ?? 0)}`)
    }
  }
  console.log()

  // Upsert all three services
  const results: Record<string, { varId: string; version: number }> = {}

  for (const svc of SERVICES) {
    const match = existing.find(e => e.itemData?.name === svc.name)
    if (match) {
      const v = match.itemData?.variations?.[0]
      console.log(`✓ "${svc.name}" already exists — skipping creation`)
      results[svc.envPrefix] = { varId: v?.id ?? '', version: Number(v?.version ?? 0) }
      continue
    }

    console.log(`Creating "${svc.name}" ...`)
    const result = await square.catalog.object.upsert({
      idempotencyKey: randomUUID(),
      object: {
        type: 'ITEM',
        id: svc.id,
        itemData: {
          name: svc.name,
          productType: 'APPOINTMENTS_SERVICE',
          variations: [{
            type: 'ITEM_VARIATION',
            id: svc.varId,
            itemVariationData: {
              name: svc.varName,
              pricingType: 'FIXED_PRICING',
              priceMoney: { amount: svc.priceCents, currency: 'CAD' },
              availableForBooking: true,
              serviceDuration: BigInt(90 * 60 * 1000),
            },
          }],
        },
      },
    })
    const variation = result.catalogObject?.itemData?.variations?.[0]
    console.log(`  → created variation ${variation?.id}`)
    results[svc.envPrefix] = { varId: variation?.id ?? '', version: Number(variation?.version ?? 0) }
  }

  // Team member
  const teamResult = await square.teamMembers.search({ query: { filter: { status: 'ACTIVE' } } })
  const memberId = teamResult.teamMembers?.[0]?.id ?? ''

  // Location
  const locResult = await square.locations.list()
  const locationId = locResult.locations?.find(l => l.status === 'ACTIVE')?.id ?? ''

  console.log('\n=== PASTE INTO .env.local (then run push-env-to-vercel.ps1) ===\n')
  console.log(`SQUARE_LOCATION_ID=${locationId}`)
  console.log(`VITE_SQUARE_LOCATION_ID=${locationId}`)
  console.log(`VITE_SQUARE_TEAM_MEMBER_ID=${memberId}`)
  for (const svc of SERVICES) {
    const r = results[svc.envPrefix]
    if (r) {
      console.log(`${svc.envPrefix}_VARIATION_ID=${r.varId}`)
      console.log(`${svc.envPrefix}_VARIATION_VERSION=${r.version}`)
    }
  }
  console.log('\n=== END ===\n')
  console.log('NOTE: Go to Square Dashboard → Appointments → Services → assign Joëlle to each new service.')
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Failed:', err?.errors ?? err?.message ?? err)
    process.exit(1)
  })
