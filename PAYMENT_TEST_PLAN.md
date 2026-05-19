# Payment Sandbox Test Plan

Goal: verify the full booking + payment flow works end-to-end in Square Sandbox,
then confirm production is identical and re-enable production mode.

---

## What's already fixed (in this session)

- `api/booking.ts` — Resend email is now fire-and-forget (`.catch` logs to console).
  A failed email can never cause the booking endpoint to return 500.
- Same fix applied to `api/inquiry.ts`.

---

## Prerequisites

You need two things from the Square Developer Console
(https://developer.squareup.com/apps → your app → Sandbox tab):

| Variable            | Where to find it                           |
|---------------------|--------------------------------------------|
| Sandbox Access Token | Credentials → Sandbox Access Token        |
| Sandbox Location ID  | Sandbox → Locations (default location ID) |

The Sandbox App ID is already in `.env.local`:
```
SANDBOX_APPLICATION_ID=sandbox-sq0idb-rL2Y-0H_Mj7Lal9jI4dbBw
```

---

## Step 1 — Switch `.env.local` to Sandbox

Edit `.env.local`. Change these four lines:

```
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=<sandbox access token from Square Developer Console>
SQUARE_LOCATION_ID=<sandbox location ID>

VITE_SQUARE_APP_ID=sandbox-sq0idb-rL2Y-0H_Mj7Lal9jI4dbBw
VITE_SQUARE_LOCATION_ID=<sandbox location ID>
```

Leave everything else (Resend, variation IDs, team member ID) unchanged.

> The sandbox and production variation IDs / team member IDs are different
> objects in Square. If the yin/gentle/corp variation IDs in `.env.local`
> were set up in production, they will not exist in sandbox. You have two
> options:
>
> A) Run `npx tsx scripts/setup-square.ts` with sandbox credentials to create
>    sandbox services and get sandbox variation IDs — then update the
>    `VITE_SQUARE_*_VARIATION_ID` vars with those sandbox values.
>
> B) Or just check that `api/booking.ts` returns the correct error when the
>    variation ID is wrong (Square will return a clear error; the booking
>    endpoint will return 500 with that message).
>
> Option B is fine for a quick smoke test of the payment path specifically.

---

## Step 2 — Start local dev server

```powershell
vercel dev
```

This runs both the Vite frontend and the Vercel API functions locally using
`.env.local`.

Open http://localhost:3000 (or whatever port vercel dev reports).

---

## Step 3 — Walk through the booking flow

1. Pick "Regular Class (Yin Yoga)"
2. Select a date from the calendar
3. Pick a time slot
4. Fill in contact info (any test name/email)
5. Accept the waiver
6. Click "Proceed to payment" — you should see the Square card form

At the payment screen, enter Square's sandbox test card:

```
Card number : 4111 1111 1111 1111
Expiry      : any future date (e.g. 12/26)
CVV         : 111
Postal code : 12345
```

Click "Pay" / the submit button.

---

## Step 4 — Verify success

**Frontend:** You should see the booking confirmation screen with the booking
date/time and a confirmation message.

**Terminal (`vercel dev` output):** No `booking error` lines. You may see a
Resend error logged (because `RESEND_FROM_EMAIL` isn't a verified sandbox
domain) — that's expected and non-fatal.

**Square Sandbox Dashboard:**
- Go to https://developer.squareup.com/apps → Sandbox → Payments
- A payment for the correct amount should appear with status COMPLETED
- Under Bookings, the appointment should appear

---

## Step 5 — If payment works, switch back to production

Restore `.env.local` to the original production values:

```
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN=EAAAl7AR0NDUJSk0WJOnj_FX0IRmD3h8WXIbYk965BbqWuxcExAR-kKuQHSn2Qdb
SQUARE_LOCATION_ID=L8H321P4NTVWS

VITE_SQUARE_APP_ID=sq0idp-bo2YwhCWN-KQBkVe2XZTcg
VITE_SQUARE_LOCATION_ID=L8H321P4NTVWS
```

Then push to Vercel:
```powershell
vercel env pull   # not needed if you edited .env.local directly
vercel --prod     # or push via git if auto-deploy is on
```

---

## Step 6 — Check Vercel logs for the incident 3–4 hrs ago

While you're in the Vercel dashboard:

1. Deployments → click the deployment that was live during the incident
2. Functions → `api/booking` → Logs
3. Filter by time window (around the time client reported issue)
4. Look for `booking error` followed by a Resend or Square error message

This will confirm whether it was an email failure (now fixed) or a Square
credential/service issue.

---

## If sandbox test FAILS

Check the terminal output from `vercel dev`. The most common failures:

| Error in terminal                           | Cause                                      |
|---------------------------------------------|--------------------------------------------|
| `NOT_FOUND` or `INVALID_VALUE` from Square  | Variation ID / team member ID wrong for sandbox |
| `UNAUTHORIZED` from Square                  | Sandbox access token not set correctly     |
| `sq-card-container` doesn't render          | `VITE_SQUARE_APP_ID` is wrong (needs `sandbox-sq0idb-...`) |
| 500 with `booking error` + Resend body      | Email fire-and-forget is logging (non-fatal, ignore) |
