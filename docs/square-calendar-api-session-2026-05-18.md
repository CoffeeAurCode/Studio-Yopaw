# Square Calendar API — Live Inspection Session (2026-05-18)

## What we did

Called the Square production API directly using the credentials in `.env.local` to inspect what's actually on the calendar and compare it to what the app uses.

---

## What Square's Bookings API can return

### Per booking (`GET /v2/bookings` or `GET /v2/bookings/{id}`)
| Field | Description |
|---|---|
| `id` | Unique booking ID |
| `status` | `ACCEPTED`, `PENDING`, `CANCELLED`, `NO_SHOW` |
| `start_at` | Start timestamp (ISO 8601, UTC) |
| `customer_id` | Linked Square customer ID |
| `customer_note` | Note left by customer |
| `appointment_segments` | Array of: `service_variation_id`, `team_member_id`, `duration_minutes`, `service_variation_version` |
| `location_id` | Which location |
| `created_at` / `updated_at` | Audit timestamps |
| `version` | Optimistic concurrency version (needed to cancel/update) |
| `source` | `FIRST_PARTY_MERCHANT` (created by staff) or `FIRST_PARTY_BUYER` (online) |
| `creator_details` | Who created the booking (team member or customer) |
| `address` | Studio address attached to the booking |

### Per availability slot (`POST /v2/bookings/availability/search`)
| Field | Description |
|---|---|
| `start_at` | Slot start time (UTC) |
| `location_id` | Location |
| `appointment_segments` | Includes live `service_variation_version`, `team_member_id`, `duration_minutes` |

---

## What the app currently uses

**From `searchAvailability`:** only `startAt`

**From `bookings.list`:** only `startAt` and `status` (to count non-cancelled bookings per slot)

**Sent to the frontend:**
```ts
{ startAt: string, seatsRemaining: number }
```
`seatsRemaining` = `SQUARE_MAX_SEATS` env var − count of active bookings at that slot.

---

## Live findings from the calendar

### 1 test booking found

| Field | Value |
|---|---|
| Booking ID | `b0dzircd0kv2pd` |
| Status | `ACCEPTED` |
| Start time | `2026-05-18T19:15:00Z` = 3:15 PM Montreal |
| Duration | 90 min |
| Customer | "Test customer" — `test@gmail.com`, `+12345678900` |
| Source | `FIRST_PARTY_MERCHANT` (created by staff from Dashboard) |
| Service variation | `VJCHZYMZHVSIQGU2SGKJCTCO` |
| Parent item | `EPHJEYJELP7USTRKSH7CWXS2` = "Regular Puppy Yoga / 60 min / Drop-in" |

### Availability
Searching the yin service (`UFR52E7LXZ7JT4FEGCVLMAWK`) returned **hundreds of open slots** — every 30 minutes across the entire 30-day window. This is because no specific class schedule has been set in the Dashboard; Square treats every open team-member time window as bookable.

---

## Issues found

### Issue 1 — Test booking is on the wrong service
The test appointment was placed on `VJCHZYMZHVSIQGU2SGKJCTCO` (parent: "Regular Puppy Yoga"), but the app's configured yin service is `UFR52E7LXZ7JT4FEGCVLMAWK` (a different parent item). There are **two separate "Regular Puppy Yoga" services** in the Square catalog. The booking wizard and the calendar appointment will never match unless they're on the same service.

**Fix:** Delete the old duplicate service from Square Dashboard, or rebook the test appointment on the correct service.

### Issue 2 — All 3 version numbers were stale

| Variable | Old (stale) | Correct (live) |
|---|---|---|
| `VITE_SQUARE_YIN_VARIATION_VERSION` | `1778934240827` | `1778937263029` |
| `VITE_SQUARE_GENTLE_VARIATION_VERSION` | `1778934241307` | `1778936095659` |
| `VITE_SQUARE_CORP_VARIATION_VERSION` | `1778934241810` | `1778936109111` |

Stale versions cause Square to reject booking creation with a version mismatch error.

**Fix:** Updated `.env.local` and pushed to Vercel (development + production) — done this session.

### Issue 3 — Availability returns too many slots
No specific class times are configured in the Dashboard. Square returns every open 30-minute window instead of just scheduled class times.

**Fix:** In Square Dashboard → Services → [service] → Availability, set specific recurring class times (e.g. Saturdays 10:00 AM, 11:30 AM). Only those times will then appear in availability search results.

---

## What we fixed this session

Updated the 3 stale version env vars in `.env.local` and pushed to Vercel for both `development` and `production` environments using `npx vercel env rm` + `npx vercel env add`.

---

## Why service variation versions change on their own

Square's `service_variation_version` is **not a sequential integer** — it is a **Unix timestamp in milliseconds** representing the last time the catalog item was saved. Every time you edit a service in the Square Dashboard (price, name, duration, availability settings, anything), Square automatically sets the version to the current save timestamp.

The original versions in `.env` were captured at the moment the services were created. They went stale because the services were edited in the Dashboard afterwards:

| Service | Created | Last edited | Version |
|---|---|---|---|
| Yin | 2026-05-16 12:24Z | 2026-05-16 13:14Z | `1778937263029` |
| Gentle | 2026-05-16 12:24Z | 2026-05-16 12:54Z | `1778936095659` |
| Corporate | 2026-05-16 12:24Z | 2026-05-16 12:55Z | `1778936109111` |

**Long-term fix:** Pull `service_variation_version` live from the availability response (it's in `appointment_segments[0].service_variation_version` of each slot) instead of hardcoding it in env vars. This makes the app immune to Dashboard edits.

---

## Service IDs confirmed active in production

| Service | Variation ID | Parent Item |
|---|---|---|
| Regular class (yin) | `UFR52E7LXZ7JT4FEGCVLMAWK` | `N3AYDWFLPVEWIYGKHWERKOWE` |
| Private group (gentle) | `ZTBAB7TMN5WOPZASMFR3HX5W` | `4QR7ZP4RT3YZ5NWHOZDDCFS2` |
| Corporate | `2SOV3LLZDOEUJIRHQN3Q2P7N` | `SND2GJ5LJAVPE5RKSGJTRLVV` |
| **Old duplicate (unused)** | `VJCHZYMZHVSIQGU2SGKJCTCO` | `EPHJEYJELP7USTRKSH7CWXS2` — delete this |

All 3 active services: `$46 CAD`, `90 min duration`, `available_for_booking: true`, assigned to team member `TMQ833hLdwAMWKo7`.
