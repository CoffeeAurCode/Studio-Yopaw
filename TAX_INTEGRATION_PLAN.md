# Tax Integration Plan — TPS/GST + TVQ/QST

## ⚠️ Base Price Clarification (Action Required)

The tax amounts you specified imply a **$51 base price**, not $46:

| Tax | Rate | On $46 | On $51 |
|-----|------|--------|--------|
| TPS / GST | 5 % | $2.30 | **$2.55 ✓** |
| TVQ / QST | 9.975 % | $4.59 | **$5.09 ✓** |
| **Total** | | **$52.89** | **$58.64** |

**Confirm before proceeding:** Is the new base price $51?  
All env vars and display strings in this plan assume $51. Adjust `BASE_AMOUNT_CENTS` below if different.

---

## Architecture Decision

**Recommended approach: Square Orders API**

Instead of calling `payments.create()` directly with a hardcoded cents amount, we:
1. Create a Square **Order** with a line item (the service) and two applied taxes (GST + QST catalog objects).
2. Square computes and returns the authoritative total including taxes.
3. Call `payments.create()` referencing that Order — Square charges exactly what the Order says.

**Benefits:**
- Tax rates live in Square Dashboard, not in code.
- Tax amounts appear correctly in Square reporting and receipts.
- If tax rates ever change, update them in Square — zero code deploy needed.
- Frontend just reads `totalMoney` from the Order for display.

---

## Phase 1 — Square CRM Setup (run scripts once)

### Prerequisites

```bash
npm install -D tsx dotenv
```

These scripts read from `.env.local` (or whatever env file you use locally). Run them once in sandbox, verify, then run against production.

---

### Script 1 — `scripts/setup-square-taxes.ts`

**Purpose:** Creates GST and QST as Catalog Tax objects in Square.  
**Output:** Prints the two tax IDs you must copy into your `.env`.

```typescript
// scripts/setup-square-taxes.ts
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
  const batchResult = await client.catalog.batchUpsert({
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

  const idMap = batchResult.idMappings ?? []
  const gstId = idMap.find(m => m.clientObjectId === '#gst')?.objectId
  const qstId = idMap.find(m => m.clientObjectId === '#qst')?.objectId

  console.log('\n✅ Tax objects created. Add these to your .env:\n')
  console.log(`SQUARE_GST_TAX_ID=${gstId}`)
  console.log(`SQUARE_QST_TAX_ID=${qstId}`)
  console.log()
}

main().catch(console.error)
```

**Run:**
```bash
npx tsx scripts/setup-square-taxes.ts
```

Copy the two IDs it prints into `.env.local` and Vercel env vars.

---

### Script 2 — `scripts/attach-square-taxes.ts`

**Purpose:** Fetches your existing service Catalog Items by name and attaches the GST/QST tax IDs to every variation.  
**When to run:** After Script 1 AND after your real service IDs are configured in Square Dashboard.

```typescript
// scripts/attach-square-taxes.ts
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

const GST_TAX_ID = process.env.SQUARE_GST_TAX_ID!
const QST_TAX_ID = process.env.SQUARE_QST_TAX_ID!

// Names must match exactly what you named the services in Square Dashboard
const TARGET_ITEM_NAMES = ['Regular Class', 'Private Event', 'Corporate']

async function main() {
  if (!GST_TAX_ID || !QST_TAX_ID) {
    console.error('Missing SQUARE_GST_TAX_ID or SQUARE_QST_TAX_ID. Run setup-square-taxes.ts first.')
    process.exit(1)
  }

  // Fetch all catalog items of type ITEM
  const listResult = await client.catalog.list({ types: 'ITEM' })
  const allItems = listResult.objects ?? []

  const targets = allItems.filter(obj =>
    obj.type === 'ITEM' &&
    TARGET_ITEM_NAMES.some(name =>
      obj.itemData?.name?.toLowerCase().includes(name.toLowerCase())
    )
  )

  if (targets.length === 0) {
    console.error('No matching catalog items found. Check that service names in Square match TARGET_ITEM_NAMES.')
    process.exit(1)
  }

  console.log(`Found ${targets.length} item(s) to update:`)
  targets.forEach(t => console.log(` - ${t.itemData?.name} (${t.id})`))

  // Attach taxes to each item
  const updatedObjects = targets.map(item => ({
    ...item,
    itemData: {
      ...item.itemData,
      taxIds: [GST_TAX_ID, QST_TAX_ID],
    },
  }))

  const upsertResult = await client.catalog.batchUpsert({
    idempotencyKey: randomUUID(),
    batches: [{ objects: updatedObjects }],
  })

  console.log('\n✅ Taxes attached to', upsertResult.objects?.length ?? 0, 'items.')
}

main().catch(console.error)
```

**Run:**
```bash
npx tsx scripts/attach-square-taxes.ts
```

---

## Phase 2 — API Changes

### `api/booking.ts` — Use Orders API

**What changes:** Replace the direct `payments.create()` call with a two-step: create Order (Square computes taxes) → pay Order.  
**What stays the same:** Customer lookup/create, booking creation, email notification, request/response shape.

The `amountCents` field sent by the frontend becomes ignored server-side — the server trusts Square's computed `totalMoney` from the Order. This closes a client-tampering vector.

**New flow inside the `try` block (steps 4–5 only):**

```typescript
// Step 4 – Create Order so Square calculates taxes
const { order } = await square.orders.create({
  idempotencyKey: randomUUID(),
  order: {
    locationId: getLocationId(),
    customerId,
    referenceId: booking!.id,
    lineItems: [
      {
        quantity: '1',
        basePriceMoney: { amount: BigInt(baseAmountCents), currency: 'CAD' },
        name: serviceName,         // e.g. "Regular Class"
        appliedTaxes: [
          { taxUid: 'gst', uid: randomUUID() },
          { taxUid: 'qst', uid: randomUUID() },
        ],
      },
    ],
    taxes: [
      { uid: 'gst', catalogObjectId: process.env.SQUARE_GST_TAX_ID!, scope: 'LINE_ITEM' },
      { uid: 'qst', catalogObjectId: process.env.SQUARE_QST_TAX_ID!, scope: 'LINE_ITEM' },
    ],
  },
})

const chargeAmount = order!.totalMoney!.amount!   // BigInt, already includes taxes

// Step 5 – Pay the Order
const { payment } = await square.payments.create({
  idempotencyKey: randomUUID(),
  sourceId: cardNonce,
  amountMoney: { amount: chargeAmount, currency: 'CAD' },
  orderId: order!.id,
  locationId: getLocationId(),
  customerId,
})
```

**New request body field** from frontend (replace `amountCents` with `baseAmountCents` + `serviceName`):

```typescript
// In the destructured body:
baseAmountCents: number   // base price only, taxes computed server-side
serviceName: string       // for the Order line item description
```

**Updated email** (include tax breakdown):

```html
<p><strong>Base:</strong> $${(baseAmountCents / 100).toFixed(2)} CAD</p>
<p><strong>GST (5%):</strong> $${(Number(chargeAmount - BigInt(baseAmountCents)) / 100 /* rough — use order.totalTaxMoney */).toFixed(2)}</p>
<p><strong>Total charged:</strong> $${(Number(chargeAmount) / 100).toFixed(2)} CAD — ${payment!.status}</p>
```

---

## Phase 3 — Frontend Changes

### 3a. `src/lib/squareServices.ts`

Remove `amountCents` from the object (server now owns pricing) and add `serviceName` + `baseAmountCents`.

```typescript
// New shape — no amountCents (server charges what Square computes)
export const SQUARE_SERVICE_VARIATIONS = {
  yin: {
    serviceVariationId: ...,
    serviceVariationVersion: ...,
    teamMemberId: ...,
    baseAmountCents: Number(import.meta.env.VITE_SQUARE_YIN_BASE_CENTS ?? 5100),
    serviceName: 'Regular Class',
    maxSeats: ...,
  },
  gentle: {
    ...
    baseAmountCents: Number(import.meta.env.VITE_SQUARE_GENTLE_BASE_CENTS ?? 5100),
    serviceName: 'Private Event',
  },
  corporate: {
    ...
    baseAmountCents: Number(import.meta.env.VITE_SQUARE_CORP_BASE_CENTS ?? 5100),
    serviceName: 'Corporate Event',
  },
}

// Tax rates as constants (government-mandated, change very rarely)
export const TAX_RATES = { gst: 0.05, qst: 0.09975 } as const

// Helper: compute display breakdown from a base in cents
export function computeTaxBreakdown(baseCents: number) {
  const gst = Math.round(baseCents * TAX_RATES.gst)
  const qst = Math.round(baseCents * TAX_RATES.qst)
  return { baseCents, gstCents: gst, qstCents: qst, totalCents: baseCents + gst + qst }
}
```

---

### 3b. `src/App.tsx` — Payment summary + booking submission

**`submitBookingWithPayment`:** Change `amountCents` → `baseAmountCents`, add `serviceName`:

```typescript
// Replace:
amountCents,

// With:
baseAmountCents: serviceInfo.baseAmountCents * (isGroup ? groupSize : 1),
serviceName: serviceInfo.serviceName,
```

**Payment summary UI:** Replace the hardcoded `$46 + taxes` / `46 $ + taxes` strings with a live breakdown using `computeTaxBreakdown()`. The total that Square will charge is what the customer sees.

Affected areas (currently hardcoded, must be replaced):
- Line ~1082–1084: `"46 $ + taxes"` / `"$46 + taxes"` in the yin/gentle payment summary
- Lines ~986–987, ~1192–1193: private group total string `"N × $46 = $total + taxes"`
- Lines ~1225–1226: corporate payment summary

**New payment summary component (inline in PricingSection):**

```tsx
function TaxBreakdown({ baseCents, lang }: { baseCents: number; lang: Lang }) {
  const { gstCents, qstCents, totalCents } = computeTaxBreakdown(baseCents)
  const fmt = (c: number) =>
    lang === 'fr'
      ? `${(c / 100).toFixed(2).replace('.', ',')} $`
      : `$${(c / 100).toFixed(2)}`

  return (
    <div className="pricing-tax-breakdown">
      <div className="pricing-tax-row">
        <span>{lang === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
        <span>{fmt(baseCents)}</span>
      </div>
      <div className="pricing-tax-row">
        <span>TPS / GST (5 %)</span>
        <span>{fmt(gstCents)}</span>
      </div>
      <div className="pricing-tax-row">
        <span>TVQ / QST (9.975 %)</span>
        <span>{fmt(qstCents)}</span>
      </div>
      <div className="pricing-tax-row pricing-tax-total">
        <span>{lang === 'fr' ? 'Total' : 'Total'}</span>
        <span>{fmt(totalCents)}</span>
      </div>
    </div>
  )
}
```

---

### 3c. `src/i18n/siteStrings.ts`

Update the static pricing display strings (shown on the pricing card before booking starts):

| Key | EN current | EN new | FR current | FR new |
|-----|-----------|--------|-----------|--------|
| `pricingAmount` | `'$46'` | `'$51'` | `'46 $'` | `'51 $'` |
| `pricingDropInRow` | `'$46 + taxes per session'` | `'$51 + taxes per session'` | `'46 $ + taxes par séance'` | `'51 $ + taxes par séance'` |
| `pricingHeaderSummary` | `'$46 + taxes · Per session'` | `'$51 + taxes · Per session'` | `'46 $ + taxes · À la séance'` | `'51 $ + taxes · À la séance'` |

No new keys needed — the tax breakdown is rendered by the `TaxBreakdown` component above, not from strings.

---

## Phase 4 — Environment Variables

### Server-side (Vercel dashboard only, never `VITE_` prefixed)

```bash
SQUARE_GST_TAX_ID=        # output of setup-square-taxes.ts
SQUARE_QST_TAX_ID=        # output of setup-square-taxes.ts
```

### Client-side (safe to expose, used for display + sent to API)

```bash
VITE_SQUARE_YIN_BASE_CENTS=5100       # $51.00 — base before tax for Regular Class
VITE_SQUARE_GENTLE_BASE_CENTS=5100    # $51.00 — per person for Private Event
VITE_SQUARE_CORP_BASE_CENTS=5100      # $51.00 — per person for Corporate (confirm separately)
```

These default to `5100` in code so the site works even if the vars are not set.

---

## Execution Order

```
1. Run scripts/setup-square-taxes.ts  (sandbox)
2. Copy SQUARE_GST_TAX_ID + SQUARE_QST_TAX_ID to .env.local
3. Configure real service IDs in Square Dashboard + squareServices.ts
4. Run scripts/attach-square-taxes.ts (sandbox)
5. Implement Phase 2 API changes (api/booking.ts)
6. Implement Phase 3 frontend changes
7. Update Phase 4 env vars in .env.local
8. Run vercel dev — do a full test booking in sandbox (card: 4111 1111 1111 1111)
9. Verify Square Dashboard shows the Order with GST + QST line items
10. Repeat steps 1-9 against production environment
```

---

## What Does NOT Change

- `api/availability.ts` — no touch
- `api/inquiry.ts` — no touch (private/corporate inquiries don't take payment)
- `api/square-webhook.ts` — no touch
- `api/_square.ts` — no touch
- Booking flow steps (mat → date → contact → payment) — no touch
- Waiver modal — no touch
- All other sections (Hero, Gallery, FAQ, etc.) — no touch
- Refund policy page — no touch

---

## Testing Checklist

- [ ] Sandbox booking completes: Square Order shows correct GST + QST amounts
- [ ] Payment summary on screen matches Square's computed total (no rounding discrepancy)
- [ ] French payment summary shows correct tax labels and amounts
- [ ] Private group booking (gentle): tax applied to `base × groupSize`
- [ ] Corporate booking: tax applied correctly per person
- [ ] Confirmation email shows total with taxes
- [ ] Square Dashboard → Transactions: tax line items visible
- [ ] Existing availability fetching still works (no regression)
- [ ] Inquiry flow (private/corporate) still works (no Square payment taken)
