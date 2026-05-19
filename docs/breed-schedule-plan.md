# Breed Schedule — Implementation Plan (v2)

> Rebuilt 2026-05-19 from live API probe. All code sections reflect the **actual Square response shape** observed in production.

---

## Concept

The Studio Yopaw calendar shows which dog breed will be present on each class day.  
The source of truth lives entirely in Square Appointments: the studio owner creates a **single all-day booking** per class day to declare which breed attends.

| Square field | Meaning |
|---|---|
| `allDay: true` | Marks the booking as a breed schedule entry (not a customer class) |
| Customer `givenName` | Breed name in **English** (e.g. `"Red Labrador"`) |
| Customer `familyName` | Breed name in **French** (e.g. `"Labrador roux"`) |
| `appointmentSegments[].serviceVariationId` | Which class types that breed covers |

The frontend:
- **Only shows dates that have an ACCEPTED all-day booking** matching the service the customer is booking
- **Shows the breed name** next to each date: `Sun, Jun 14, 2026 (Red Labrador)`
- **Bilingual** — French UI shows `familyName`, English UI shows `givenName`

---

## How to create a breed schedule entry in Square

1. Open Square Dashboard → Appointments → Calendar
2. Click the target date → **+ New Appointment** → toggle **All-day**
3. **Customer**: create a new customer with:
   - **First Name** = breed name in **English** (e.g. `Red Labrador`)
   - **Last Name** = breed name in **French** (e.g. `Labrador roux`)
4. **Services**: add one segment per class type that breed will cover  
   (Regular Class / Private Event / Corporate — omit services the dog won't attend)
5. Save. The API picks it up immediately — no code deploy needed.

To remove a date: cancel the all-day booking in Square.

---

## Actual Square API response (observed in production)

```json
{
  "id": "yzwmw9o6tfyzu8",
  "version": 0,
  "status": "ACCEPTED",
  "createdAt": "2026-05-18T21:26:25Z",
  "updatedAt": "2026-05-18T21:26:25Z",
  "locationId": "L8H321P4NTVWS",
  "customerId": "2NN66RCR7QWP5AP9H8YC88DZ4C",
  "startAt": "2026-06-14T18:30:00Z",
  "allDay": true,
  "appointmentSegments": [
    {
      "serviceVariationId": "UFR52E7LXZ7JT4FEGCVLMAWK",
      "teamMemberId": "TMQ833hLdwAMWKo7",
      "durationMinutes": 90
    },
    {
      "serviceVariationId": "ZTBAB7TMN5WOPZASMFR3HX5W",
      "teamMemberId": "TMQ833hLdwAMWKo7",
      "durationMinutes": 90
    },
    {
      "serviceVariationId": "2SOV3LLZDOEUJIRHQN3Q2P7N",
      "teamMemberId": "TMQ833hLdwAMWKo7",
      "durationMinutes": 90
    }
  ],
  "source": "FIRST_PARTY_MERCHANT",
  "locationType": "BUSINESS_LOCATION"
}
```

**Customer record for that booking** (`customerId: "2NN66RCR7QWP5AP9H8YC88DZ4C"`):

```json
{
  "givenName": "Red Labrador",
  "familyName": "Labrador roux",
  "emailAddress": "i@com.com"
}
```

### Key observations from the probe

| Field | Observed value | Notes |
|---|---|---|
| `allDay` | `true` | Boolean, not a string |
| `status` (active) | `"ACCEPTED"` | Filter must be `=== 'ACCEPTED'` |
| `status` (cancelled) | `"CANCELLED_BY_SELLER"` | NOT `"CANCELLED"` — filtering `!== 'CANCELLED'` would let these through |
| `startAt` | `"2026-06-14T18:30:00Z"` | Square sets ~14:30 EDT (18:30 UTC). Date must be extracted in **Montreal timezone**, not UTC slice |
| Customer on cancelled bookings | `404 Not Found` | Square deletes customers when bookings are cancelled; use `Promise.allSettled` |
| `appointmentSegments` | Array, 1–4 items | One segment per service the breed covers |

---

## Service Variation ID Map

| Class | Variation ID |
|---|---|
| Regular Class (yin) | `UFR52E7LXZ7JT4FEGCVLMAWK` |
| Private Event (gentle) | `ZTBAB7TMN5WOPZASMFR3HX5W` |
| Corporate | `2SOV3LLZDOEUJIRHQN3Q2P7N` |

IDs are stored in `.env.local` as `VITE_SQUARE_YIN_VARIATION_ID`, `VITE_SQUARE_GENTLE_VARIATION_ID`, `VITE_SQUARE_CORP_VARIATION_ID`.

---

## API constraints discovered

| Constraint | Detail |
|---|---|
| Date range limit | `bookings.list` rejects ranges > 31 days → chunk into ≤30-day windows |
| Pagination | SDK exposes `_hasNextPage` / `loadNextPage`; current code reads `.data` (first page only) — fine for a small studio |
| Customer fetch | No batch endpoint — use `Promise.allSettled` across individual `customers.get` calls |

---

## Implementation — `api/breeds.ts` (already built)

```ts
// 1. Chunk into ≤30-day windows and list all bookings
const chunkResults = await Promise.all(
  chunks.map(chunk =>
    square.bookings.list({
      locationId: getLocationId(),
      startAtMin: `${chunk.start}T00:00:00Z`,
      startAtMax: `${chunk.end}T23:59:59Z`,
    })
  )
)

// 2. Filter: all-day, ACCEPTED, has a customer
const allDayBookings = allBookings.filter(
  b => b.allDay === true && b.status === 'ACCEPTED' && b.customerId
)

// 3. Fetch customer names (EN + FR), tolerate 404s on deleted customers
const customerResults = await Promise.allSettled(
  customerIds.map(id => square.customers.get({ customerId: id }))
)
const customerMap = new Map(
  customerResults
    .filter(r => r.status === 'fulfilled' && r.value.customer?.id)
    .map(r => [
      r.value.customer!.id!,
      { en: r.value.customer!.givenName ?? '', fr: r.value.customer!.familyName ?? '' }
    ])
)

// 4. Extract date in Montreal timezone (not UTC slice — avoids off-by-one at night)
const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto',
  year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(booking.startAt!))

// 5. Build schedule map
schedule[date].push({
  breed: { en, fr },
  serviceIds: booking.appointmentSegments.map(s => s.serviceVariationId)
})
```

**Response shape:**

```ts
{
  schedule: {
    "2026-06-14": [
      { breed: { en: "Red Labrador", fr: "Labrador roux" }, serviceIds: ["UFR52E7LXZ7JT4FEGCVLMAWK", "ZTBAB7TMN5WOPZASMFR3HX5W", "2SOV3LLZDOEUJIRHQN3Q2P7N"] }
    ],
    "2026-07-03": [
      { breed: { en: "Goldendoodle", fr: "Goldendoodle" }, serviceIds: ["UFR52E7LXZ7JT4FEGCVLMAWK", "ZTBAB7TMN5WOPZASMFR3HX5W", "2SOV3LLZDOEUJIRHQN3Q2P7N"] }
    ]
  }
}
```

---

## Implementation — `src/hooks/useBreedSchedule.ts` (already built)

```ts
export interface BreedEntry {
  breed: { en: string; fr: string }
  serviceIds: string[]
}

// hook returns:
Record<string, BreedEntry[]>  // date → [{ breed: { en, fr }, serviceIds }]
```

Fetches `/api/breeds?startDate=…&endDate=…`, resets on date range change.

---

## Implementation — `src/App.tsx` (already built)

### `effectiveDates` — filter by breed schedule + current service

```ts
const effectiveDates = useMemo(() => {
  return Object.keys(effectiveSlotsByDate)
    .filter(date => {
      const entries = breedSchedule[date]
      if (!entries || entries.length === 0) return false
      return entries.some(e => e.serviceIds.includes(currentServiceVariationId))
    })
    .sort()
}, [effectiveSlotsByDate, breedSchedule, currentServiceVariationId])
```

A date only appears in the booking calendar if:
1. Square has at least one available time slot for that date
2. The breed schedule has an ACCEPTED all-day booking for that date covering the selected service

### Breed display in the date row

```tsx
const breedEntries = breedSchedule[dateIso] ?? []
const breedForService = breedEntries
  .filter(e => e.serviceIds.includes(currentServiceVariationId))
  .map(e => lang === 'fr' ? e.breed.fr : e.breed.en)
  .join(', ')

{breedForService && (
  <span className="pricing-session-breed">({breedForService})</span>
)}
```

---

## Edge cases

| Case | Behaviour |
|---|---|
| Date has Square slots but no ACCEPTED all-day booking | Date hidden |
| Date has all-day booking but Square shows no slots (fully booked / no times configured) | Date hidden |
| Breed covers only 1 of 3 services | Date visible only for that service |
| All-day booking cancelled in Square | Excluded (`status === 'ACCEPTED'` filter); associated customer may 404 — handled by `Promise.allSettled` |
| All-day booking `startAt` falls near midnight EDT | Date correctly extracted via `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' })` |
| `appointmentSegments` is empty | `serviceIds` will be `[]` → booking is filtered out for all services |

---

## No deploy needed for new class dates

Once live, the studio manages the calendar entirely from Square:

- **Add a date** → create an all-day booking with the breed customer + services
- **Remove a date** → cancel the all-day booking
- **Change which services a breed covers** → edit the segments on the all-day booking
- **Rename a breed** → update the customer's first/last name in Square
