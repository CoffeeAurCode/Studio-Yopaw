# Square Dashboard — Availability & Dog Breed Guide

This document explains **what is already managed through Square** and **what is not**, then gives step-by-step instructions for each.

---

## How the current setup works

### Available dates and times — already from Square

The booking calendar in the app calls `GET /api/availability`, which queries Square's `SearchAvailability` API.  
**Every date row and every time slot shown to customers comes directly from Square.**  
To add, remove, or change available times, the studio owner edits their Square calendar — no code change is needed.

### Dog breed names — hardcoded in the frontend

The breed that appears next to each date (e.g. "Fox Red Labrador") is **not** from Square.  
It lives in a static lookup table in `src/App.tsx`:

```ts
const SESSION_BREEDS: Record<string, { en: string; fr: string }> = {
  '2026-06-14': { en: 'Fox Red Labrador', fr: 'Labrador roux' },
  '2026-06-21': { en: 'Silver Labrador', fr: 'Labrador argenté' },
  ...
}
```

Square has no native "breed per date" field. There is no Square Dashboard screen where you type a breed name and it shows up on the booking calendar.

---

## Can we control breed names from Square Dashboard?

**Short answer:** not directly, but there is a workable approach using **class event names**.

### Why not direct

Square's catalog model is:
- **Service** (e.g. "Regular Class") → **Variations** (e.g. "Drop-in", "10-class pass")  
- Availability is computed from business hours + team member schedules

There is no per-date description field on an availability slot. Custom attributes exist, but they attach to **customer bookings**, not to open slots.

### Recommended approach — named class events (Appointments Plus)

On the **Appointments Plus** plan, Square supports **group classes**: instead of open availability windows, you create individual dated events, each with its own name and capacity. The class name can include the breed.

The API returns the class event name in the availability response, which the app can display directly. This makes breeds **100% manageable from the Square Dashboard** — no code deploy needed to update them.

---

## Part 1 — Managing Available Times in Square Dashboard

### Step 1: Set business hours

1. Log in at `dashboard.squareup.com`.
2. Go to **Appointments** → **Settings** → **Business hours**.
3. For each day of the week, toggle the day on and set **Open** and **Close** times.
4. These hours define the outer bounds of when bookings can appear.
5. Save. The change takes effect immediately — the availability API will return slots only within these hours.

**To offer sessions only at specific times (e.g. 10:30, 12:00, 13:30, 15:00):**  
Set the service duration to 60 minutes and enable "fixed start times" or use the **blocked time** feature to block off all other hours. Square will then only surface slots at those exact times.

### Step 2: Block specific days or time ranges

1. Go to **Appointments** → **Calendar**.
2. Click a day or drag across a time range.
3. Choose **Block time** → give it a label (e.g. "No class today").
4. That range is removed from availability search results immediately.

### Step 3: Control service buffer / padding

1. Go to **Appointments** → **Services** → click your service → **Edit**.
2. Under **Duration**, set pre/post-padding if you need buffer between sessions.
3. This prevents back-to-back slots from showing.

### Step 4: Set per-team-member availability

1. Go to **Team** → click a team member → **Edit**.
2. Under **Appointments**, set their available hours per day.
3. Availability slots are only returned when the team member is scheduled.

---

## Part 2 — Managing Breed Names from Square Dashboard (Named Class Events)

This requires the **Appointments Plus** plan and a small API change in the app.

### Dashboard steps — create a named class for each session

1. Log in to `dashboard.squareup.com`.
2. Go to **Appointments** → **Classes** (or **Items** → **Services**, depending on your plan display).
3. Click **Create a class**.
4. Fill in:
   - **Name:** Include the breed — e.g. `Regular Class · Fox Red Labrador` or just `Fox Red Labrador Session`
   - **Description:** Optional extra info
   - **Duration:** 60 minutes
   - **Capacity:** Max number of participants per session (e.g. 12)
   - **Price:** $46 CAD
5. Under **Schedule**, set the specific **date and time** for this class occurrence (e.g. June 14, 2026 at 10:30, 12:00, etc.).
6. Repeat for each session date with its own breed name.
7. Assign a team member to each class.
8. Save.

The class events will now appear as availability slots when the app calls `SearchAvailability`. The `start_at` timestamp in the response will match the scheduled time.

### API response — where the name lives

When using named class events, the availability response includes the **catalog item details** for each slot. The app can read the class name from:

```json
{
  "availabilities": [
    {
      "start_at": "2026-06-14T14:30:00Z",
      "appointment_segments": [
        {
          "service_variation_id": "...",
          "team_member_id": "..."
        }
      ]
    }
  ]
}
```

To get the name, the app makes one additional call:

```
GET /v2/catalog/object/{service_variation_id}
```

The response includes `item_data.name` on the parent item — that is the class name with the breed.

### Code change needed in the app

In `api/availability.ts`, after fetching slots, fetch the catalog object for each unique `service_variation_id` and include the name in the response:

```ts
// api/availability.ts — add to response shape
return res.json({
  availabilities: slots.map(slot => ({
    startAt: slot.startAt,
    serviceVariationId: slot.appointmentSegments?.[0]?.serviceVariationId,
    className: catalogNameMap[slot.appointmentSegments?.[0]?.serviceVariationId ?? ''] ?? null,
  }))
})
```

In `src/App.tsx`, replace the static `SESSION_BREEDS` lookup with the `className` field returned by the API, and parse the breed from the class name (or store EN/FR variants as separate Square catalog items using Square's localization support).

---

## Summary

| Feature | Managed from Square Dashboard? | Notes |
|---|---|---|
| Which dates have sessions | Yes | Controlled via Calendar + business hours |
| Which time slots are available | Yes | Business hours + fixed start times + blocked time |
| Max capacity per slot | Yes | Set on the service or class event |
| Dog breed name per date | Not natively | Needs named class events (Plus plan) + a small API update |
| Breed name in two languages | Not natively | Would need two separate catalog items (EN + FR) or a naming convention parsed by the app |

**Quickest path to production:** Keep breeds hardcoded in `SESSION_BREEDS` for now — update the code file whenever a new schedule is published. Switch to named class events when the studio is on Appointments Plus and breed updates are frequent enough to justify the API work.
