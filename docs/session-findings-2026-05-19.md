# Session Findings — 2026-05-19

## 1. Square Service Versions Updated

**What changed:** The three appointment services were edited in Square Dashboard (duration changed to 90 min slot / 60 min class). Every edit bumps the `serviceVariationVersion` which must match Square exactly for booking creation.

**New versions pushed to `.env.local` and Vercel (dev + production) via `scripts/push-env-to-vercel.ps1` and `scripts/push-env-to-vercel-prod.ps1`:**

| Service | Variation ID | New Version |
|---|---|---|
| Regular (yin) | `UFR52E7LXZ7JT4FEGCVLMAWK` | `1779136635823` |
| Private (gentle) | `ZTBAB7TMN5WOPZASMFR3HX5W` | `1779136626244` |
| Corporate (corp) | `2SOV3LLZDOEUJIRHQN3Q2P7N` | `1779136616134` |

All three services now have **90-minute slot duration** in Square.

---

## 2. `api/breeds.ts` — 500 Bug Fixed and Committed

**Commit:** `6596980` — *"fix: handle 404 customer lookups in breeds endpoint"*

**Root cause:** `Promise.all()` was used to batch-fetch customer records for breed name lookup. When any customer is deleted from Square, the SDK throws a 404 error, which rejects the entire `Promise.all` and returns a 500.

**Fix:** Switched to `Promise.allSettled()`. Rejected (404) customers are filtered out; their bookings fall back to `{ en: 'Unknown', fr: 'Unknown' }`. The schedule is still returned for all other valid bookings.

**Before:**
```ts
const customers = await Promise.all(
  customerIds.map(id => square.customers.get({ customerId: id })),
)
const customerMap = new Map(
  customers.map(r => [r.customer!.id!, { en: ..., fr: ... }])
)
```

**After:**
```ts
const customerResults = await Promise.allSettled(
  customerIds.map(id => square.customers.get({ customerId: id })),
)
const customerMap = new Map(
  customerResults
    .filter((r): r is PromiseFulfilledResult<...> =>
      r.status === 'fulfilled' && !!r.value.customer?.id)
    .map(r => [r.value.customer!.id!, { en: ..., fr: ... }])
)
```

---

## 3. Breed Schedule — Current State in Square

### All-day bookings (breed entries) found via API:

| Date | Status | Customer ID | Breed (EN / FR) | Services |
|---|---|---|---|---|
| 2026-05-20 | CANCELLED_BY_SELLER | `CDKXSPDQVJV3SRS5VTJDY7TS38` | — | Yin, Gentle, Corp |
| 2026-06-01 | CANCELLED_BY_SELLER | `GF95F6AX853VJD9R63XSCV19MM` | — | Corp, Gentle, Corp, Yin |
| 2026-06-14 | CANCELLED_BY_SELLER | `G2JYYSVCSXRJAQXW5P376GJSG4` | **DELETED** | Yin, Gentle, Corp |
| 2026-06-14 | **ACCEPTED** | `2NN66RCR7QWP5AP9H8YC88DZ4C` | **Red Labrador / Labrador roux** | Corp, Gentle, Yin |
| 2026-07-04 | **ACCEPTED** | `RMBMPBVCNFZFC4549BK9VY40PM` | **Goldendoodle / Goldendoodle** | Corp, Gentle, Yin |
| 2026-07-05 | **ACCEPTED** | `RMBMPBVCNFZFC4549BK9VY40PM` | **Goldendoodle / Goldendoodle** | Corp, Gentle, Yin |

### Breed name convention in use:
- Square customer **First Name** = English breed name (shown when `lang === 'en'`)
- Square customer **Last Name** = French breed name (shown when `lang === 'fr'`)

### Class Session Dates catalog (scheduled dates):
`2026-06-14`, `2026-06-21`, `2026-06-28`, `2026-07-04`, `2026-07-05`

**Missing all-day bookings:** Jun 21, Jun 28 have no all-day breed booking → those dates are hidden from customers. Create them in Square Dashboard.

---

## 4. Why July 4 & 5 Were Not Showing — Root Cause Found

### Bug in `api/availability.ts` — `getAllowedDates()` always returns null

**`getAllowedDates()`** reads the Square Catalog to find a category named `class schedule`, then finds the `Class Session Dates` item linked to that category. It returns the set of allowed dates (e.g. `{"2026-06-14", "2026-07-04", ...}`).

**The problem:** Square has **3 duplicate categories** all named `class schedule`:

| ID | Name |
|---|---|
| `HG4YCONSXD3ZDT6YDTMRFRWN` | class schedule |
| `HXOJ4KTDZAIO2YSH53PTRPM6` | class schedule |
| `DTTIGFQQWPE33FQATE6S2DPJ` | class schedule ← this one is linked to the item |

The code uses `Array.find()` which stops at the **first match** — `HG4YCONSXD3ZDT6YDTMRFRWN`. The `Class Session Dates` item is linked to `DTTIGFQQWPE33FQATE6S2DPJ`. Because the IDs don't match, `item` comes back undefined, and `getAllowedDates()` returns `null`.

**Consequence of null `allowedDates`:**
- The date filter is skipped entirely
- `searchAvailability` results are used unfiltered → all 50 days show availability
- Dates not returned by `searchAvailability` get no synthetic slot generated

### Why July 5 specifically disappeared:

Square's `searchAvailability` returns **zero slots for July 5** (Sunday). The team member's Square schedule apparently has no Sunday availability for that date. With `allowedDates = null`, no synthetic slot is generated → July 5 is never in `effectiveSlotsByDate` → never passes the `effectiveDates` filter → invisible.

July 4 shows because Square *does* return slots for that Saturday.

### The fix (NOT yet committed — needs review):

In `getAllowedDates()`, replace single-category `find()` with a Set of all matching category IDs:

```ts
async function getAllowedDates(): Promise<Set<string> | null> {
  const [catResp, itemResp] = await Promise.all([
    square.catalog.list({ types: ['CATEGORY'] }),
    square.catalog.list({ types: ['ITEM'] }),
  ])

  // Collect ALL IDs for every "class schedule" category (duplicates exist in Square)
  const schedCatIds = new Set(
    (catResp.objects ?? [])
      .filter(o => o.type === 'CATEGORY' && !o.isDeleted && o.categoryData?.name?.toLowerCase() === SCHEDULE_CATEGORY)
      .map(o => o.id!),
  )
  if (schedCatIds.size === 0) return null

  const item = (itemResp.objects ?? []).find(
    o =>
      o.type === 'ITEM' &&
      !o.isDeleted &&
      o.itemData?.name === SCHEDULE_ITEM &&
      (o.itemData?.categories ?? []).some(c => schedCatIds.has(c.id!)),
  )
  if (!item) return null

  const dates = new Set(
    (item.itemData?.variations ?? [])
      .filter(v => !v.isDeleted && /^\d{4}-\d{2}-\d{2}$/.test(v.itemVariationData?.name ?? ''))
      .map(v => v.itemVariationData!.name!),
  )
  return dates.size > 0 ? dates : null
}
```

**After this fix:**
- `getAllowedDates()` returns `{"2026-06-14", "2026-06-21", "2026-06-28", "2026-07-04", "2026-07-05"}`
- Only those 5 dates show on the website (correct behavior)
- July 5 gets a synthetic slot generated even with no Square `searchAvailability` result
- June 21 and June 28 will show once all-day breed bookings are created for them

---

## 5. Code Architecture Confirmed — No Hardcoding

Per `docs/breed-schedule-plan.md`, every part of the breed schedule is API-driven:

| Plan step | Status |
|---|---|
| No `SESSION_BREEDS` constant | ✅ Removed |
| `useBreedSchedule` wired in `PricingSection` | ✅ Line 475 of `App.tsx` |
| `effectiveDates` filtered by breed + service | ✅ Lines 478–486 |
| Breed display reads from `breedSchedule` | ✅ Lines 986–1001 |
| `api/breeds.ts` reads all-day bookings from Square | ✅ |

One intentional divergence from the plan: breed is stored as `{ en: string, fr: string }` (bilingual) instead of the plan's single combined string. Hook, API, and `App.tsx` are all consistent with each other on this.

---

## 6. Things Still Needed (Square Dashboard Actions)

1. **June 21** — create an all-day appointment with a breed customer + all 3 services
2. **June 28** — same
3. **Delete the 2 extra "class schedule" categories** from Square Catalog (or leave them and apply the code fix above — both resolve the bug)
4. **Review the July 5 team member schedule** in Square — confirm the team member is available that Sunday, otherwise booked slots will fail even though the date shows

---

## 7. Availability Window

The frontend fetches 50 days from today (`plusDaysIso(50)` in `App.tsx` line 444). Both `useSquareAvailability` and `useBreedSchedule` share the same `startDate` / `endDate`. Extend to 90 days by changing `50` → `90` if more lead time is needed.

---

## 8. Breed Schedule Plan — Rebuilt from Live API (second session, same day)

`docs/breed-schedule-plan.md` was scraped and rewritten based on actual Square production API responses.

**Confirmed from live API probes:**

| Field | Observed |
|---|---|
| `allDay` | Boolean `true` — not a string |
| Status (active) | `"ACCEPTED"` — filtering `!== 'CANCELLED'` is WRONG; cancelled status is `"CANCELLED_BY_SELLER"` |
| `startAt` on all-day bookings | Always `T18:30:00Z` (14:30 EDT) — NOT midnight |
| Customer on cancelled booking | HTTP 404 — deleted from Square when booking is cancelled |
| Bilingual naming | `givenName` = full English name, `familyName` = full French name |

**Date extraction fix applied to `api/breeds.ts`:**
Previously `startAt.slice(0, 10)` (UTC). Changed to `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' })` to extract local Montreal date — prevents off-by-one if a booking is ever created late evening EDT.

---

## 9. libuv Windows Crash — Diagnosed and Fixed

**Error seen:** `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76`

**Root cause:** All `scripts/*.ts` had `process.exit(1)` on error but no `process.exit(0)` on success. On success, Node.js v24 on Windows tried to drain the event loop naturally — Square SDK HTTP keep-alive connections caused libuv's Windows async handle cleanup to hit a race condition.

**Fix applied to all 7 scripts** (`push-schedule.ts`, `setup-square.ts`, `delete-old-service.ts`, `setup-all-services.ts`, `update-service-duration.ts`, `setup-square-taxes.ts`, `attach-square-taxes.ts`):

```ts
main()
  .then(() => process.exit(0))   // ← was missing
  .catch(err => { console.error(...); process.exit(1) })
```

**Rule going forward:** Every CLI script that uses the Square SDK must call `process.exit(0)` on success.

---

## 10. All-Day Booking Debugging — Second Round

### Current ACCEPTED all-day bookings (as of ~06:00 UTC 2026-05-19)

| Date | Breed EN | Breed FR | Services |
|---|---|---|---|
| 2026-06-21 | Goldendoodle | Goldendoodle | Yin + Gentle + Corp |
| 2026-06-28 | Medium Goldendoodle | Goldendoodle moyen | Yin + Gentle + Corp |

All other all-day bookings are `CANCELLED_BY_SELLER` — cancelled during testing.

### Why the "new" bookings weren't appearing

Two additional all-day bookings were created near end of session but could **not be found in Square Production API** through December 2026. Searched exhaustively in 30-day chunks. Zero results.

**Two probable causes:**
1. **All-day toggle was off** — saved as `allDay: false` (regular timed booking). `breeds.ts` filters `allDay === true` strictly.
2. **Created in Sandbox** — Square Dashboard has a sandbox/production toggle. If the session was on Sandbox, Production API never sees those bookings.

**How to verify:** Open the booking in Square Dashboard → if it shows a clock time (e.g. "2:30 PM – 4:00 PM") instead of "All day", it was created without the toggle. Cancel it and recreate with All-day ON in Production.

---

## 11. Action Items Remaining

1. Confirm that Square Dashboard is on **Production** (not Sandbox) when creating breed schedule entries
2. For every date that should be visible: create a fresh all-day booking with **All-day toggle ON**, correct breed customer (EN givenName / FR familyName), and all relevant services
3. Apply the `getAllowedDates()` fix from §4 to `api/availability.ts` if the class schedule catalog is still in use

The frontend fetches 50 days from today (`plusDaysIso(50)` in `App.tsx` line 444). Both `useSquareAvailability` and `useBreedSchedule` share the same `startDate` / `endDate`. Extend to 90 days by changing `50` → `90` if more lead time is needed.

---

## 12. Pagination Bug in `breeds.ts` and `availability.ts` — Diagnosed, Fixed, Still Failing

### Root cause identified

`breeds.ts` and `availability.ts` both called `square.bookings.list(...)` and read only `r.data` (first page). The Square SDK paginates results and silently drops everything beyond page 1.

**Why June 14 was invisible despite being ACCEPTED:**
The May 19–June 17 chunk contains enough bookings (5 regular + 3 cancelled all-day on June 14 alone, plus any from May) to push the ACCEPTED all-day booking to page 2. `r.data ?? []` only returned page 1, so the booking was never processed.

**Confirmed via probes:**
- Targeted `startAtMin/Max` spanning only June 14 → booking found ✓
- Same booking searched via the 30-day chunk range → NOT found (page 2 dropped)
- June 1–30 probe WITH pagination drained → booking found ✓

### Fix applied

Both `breeds.ts` and `availability.ts` were updated to drain all pages per chunk:

```ts
async function listAllBookings(chunk: { start: string; end: string }) {
  let page = await square.bookings.list({
    locationId: getLocationId(),
    startAtMin: `${chunk.start}T00:00:00Z`,
    startAtMax: `${chunk.end}T23:59:59Z`,
  })
  const items = [...(page.data ?? [])]
  while (await page._hasNextPage()) {
    page = await page.loadNextPage()
    items.push(...(page.data ?? []))
  }
  return items
}
```

### Result: did not fix the issue

After restarting `vercel dev` and applying the pagination fix, the new June booking still did not appear on the frontend. Root cause is still unresolved — further investigation needed.
