# Breed Schedule — Implementation Plan

## Concept

The Studio Yopaw calendar shows which dog breed will be present on each class day.  
The source of truth lives entirely in Square Appointments: the business owner creates a **single all-day booking** per class day in the Square calendar to declare dog availability.

| Square field | Meaning |
|---|---|
| All-day booking | One entry per class date |
| Customer name on the booking | Dog breed name (e.g. "Fox Red Labrador") |
| Appointment segments | Services that dog will attend (Regular / Private / Corporate) |

The frontend:
- **Only shows dates that have an all-day booking** (no breed = date hidden from customers)
- **Shows the breed in brackets** next to each date: `Sun, Jun 1, 2026 (Fox Red Labrador)`
- **Filters by service** — a date only appears if the all-day booking includes a segment for the service the customer is booking

---

## How to create a breed schedule entry in Square

1. Open Square Dashboard → Appointments → Calendar
2. Click the date → **+ New Appointment** → toggle **All-day**
3. **Customer**: create/select a customer whose **First Name + Last Name = breed name**  
   e.g. First: `Fox Red`, Last: `Labrador`
4. **Services**: add one segment per service the dog will be in  
   (Regular Puppy Yoga / Private Group / Corporate — omit services the dog won't attend)
5. Save. The API picks this up immediately — no code deploy needed.

---

## Service Variation ID Map

| Class | Variation ID (from `.env.local`) |
|---|---|
| Regular Class (Yin) | `UFR52E7LXZ7JT4FEGCVLMAWK` |
| Private Event (Gentle) | `ZTBAB7TMN5WOPZASMFR3HX5W` |
| Corporate | `2SOV3LLZDOEUJIRHQN3Q2P7N` |

These IDs are what the frontend sends when booking and what gets stored in the appointment segments. They are what link an all-day booking to a specific class type.

---

## Changes Required

### 1. `api/breeds.ts` — Rewrite (all-day bookings approach)

**Current approach (to be replaced):** reads from a Square Catalog category named `breed schedule`, where items = breeds and variations = dates.  
**New approach:** reads all-day bookings directly from the Bookings API.

**New response format:**
```ts
{
  schedule: {
    "2026-06-01": [
      { breed: "Test Breed", serviceIds: ["UFR52E7LXZ7JT4FEGCVLMAWK", "ZTBAB7TMN5WOPZASMFR3HX5W", "2SOV3LLZDOEUJIRHQN3Q2P7N"] }
    ],
    "2026-06-14": [
      { breed: "Fox Red Labrador", serviceIds: ["UFR52E7LXZ7JT4FEGCVLMAWK"] }
    ]
  }
}
```

**Implementation steps:**

```ts
// 1. Fetch all bookings in the requested date range (chunked if >30 days)
const bookings = await square.bookings.list({
  locationId: LOCATION_ID,
  startAtMin: `${startDate}T00:00:00Z`,
  startAtMax: `${endDate}T23:59:59Z`,
})

// 2. Filter to all-day, non-cancelled bookings that have a customer
const allDayBookings = bookings.filter(b =>
  b.allDay === true &&
  b.status !== 'CANCELLED' &&
  b.customerId
)

// 3. Batch-fetch customers to get breed names
const customerIds = [...new Set(allDayBookings.map(b => b.customerId!))]
// Use Promise.all — Square has no batch-retrieve for customers via the SDK
const customers = await Promise.all(
  customerIds.map(id => square.customers.get({ customerId: id }))
)
const customerMap = new Map(
  customers.map(r => [r.customer!.id!, `${r.customer!.givenName ?? ''} ${r.customer!.familyName ?? ''}`.trim()])
)

// 4. Build schedule map
const schedule: Record<string, { breed: string; serviceIds: string[] }[]> = {}

for (const booking of allDayBookings) {
  const date = booking.startAt!.slice(0, 10)
  const breed = customerMap.get(booking.customerId!) ?? 'Unknown'
  const serviceIds = (booking.appointmentSegments ?? [])
    .map(seg => seg.serviceVariationId!)
    .filter(Boolean)

  if (!schedule[date]) schedule[date] = []
  schedule[date].push({ breed, serviceIds })
}

return res.status(200).json({ schedule })
```

**Important:** The `bookings.list` endpoint returns bookings sorted by `start_at`. Since all-day bookings have `all_day: true`, they appear alongside regular bookings. Filter by `allDay === true` to isolate them.

---

### 2. `src/hooks/useBreedSchedule.ts` — Update return type

**Current return type:**
```ts
Record<string, string[]>   // date → breed names
```

**New return type:**
```ts
export interface BreedEntry {
  breed: string
  serviceIds: string[]
}

// hook returns:
Record<string, BreedEntry[]>  // date → [{ breed, serviceIds }]
```

Update the `useState` type and the fetch parsing accordingly.

---

### 3. `src/App.tsx` — Three changes

#### 3a. Remove the hardcoded `SESSION_BREEDS` constant (lines 89–95)

Delete:
```ts
const SESSION_BREEDS: Record<string, { en: string; fr: string }> = {
  '2026-06-14': { en: 'Fox Red Labrador', fr: 'Labrador roux' },
  ...
}
```

#### 3b. Wire up `useBreedSchedule`

Add the hook call inside `PricingSection`, alongside the existing `useSquareAvailability` call:

```ts
const { schedule: breedSchedule, loading: breedLoading } = useBreedSchedule(startDate, endDate)
```

#### 3c. Update `effectiveDates` — filter by breed schedule + current service

```ts
const effectiveDates = useMemo(() => {
  return Object.keys(effectiveSlotsByDate)
    .filter(date => {
      const entries = breedSchedule[date]
      if (!entries || entries.length === 0) return false
      // Date must have a breed entry that covers the current service
      return entries.some(e => e.serviceIds.includes(currentServiceVariationId))
    })
    .sort()
}, [effectiveSlotsByDate, breedSchedule, currentServiceVariationId])
```

#### 3d. Update breed display in the date row

Replace the `SESSION_BREEDS[dateIso]` lookup with:

```tsx
// Inside the effectiveDates.map(dateIso => ...) render:
const breedEntries = breedSchedule[dateIso] ?? []
const breedForService = breedEntries
  .filter(e => e.serviceIds.includes(currentServiceVariationId))
  .map(e => e.breed)
  .join(', ')

// Then in JSX (replacing the existing breed block):
{breedForService && (
  <span className="pricing-session-breed">({breedForService})</span>
)}
```

This handles the case where multiple breeds share the same date and service.

---

## Loading states

- While `breedLoading` is true and the user is on the date step, keep the existing  
  `Loading available sessions…` spinner (no change needed — `availabilityLoading` already covers this).
- If `breedSchedule` is empty and `breedLoading` is false, the `effectiveDates` array will be empty, showing the existing `No sessions available right now` message.

---

## Edge cases

| Case | Behaviour |
|---|---|
| Date has slots from Square but no breed booking | Date hidden from customers |
| Date has breed booking but Square shows no slots (fully booked) | Date hidden (filtered out by `effectiveSlotsByDate`) |
| Breed covers only 1 of 3 services | Date visible only when booking that service |
| Multiple breeds on same date, same service | Both breed names shown comma-separated |
| All-day booking cancelled in Square | Excluded (`status !== 'CANCELLED'` filter) |

---

## No deploy needed for new class dates

Once the code is live, the business owner manages the calendar entirely from Square:
- Add a breed entry → the date appears on the website
- Delete/cancel the all-day booking → the date disappears
- Add/remove services from the booking → changes which class types show the date
