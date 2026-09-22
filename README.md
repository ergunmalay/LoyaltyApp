# PocketStamp

Digital stamp cards for coffee shops. Businesses create a reward, customers join with a QR code, and staff scan each customer's pass to add stamps and redeem rewards. Customers can keep their pass in a browser without installing an app.

## What it does

- **For businesses:** Sign up, create a stamp promotion, display a customer join QR code, and view recent activity and analytics.
- **For customers:** Join with a name and email, view a personal stamp card and QR code, and see new stamps appear on the pass.
- **For staff:** Scan a pass with a camera or enter its barcode, add stamps, and redeem a completed reward. The stamps API also supports removing a stamp within one hour of adding it.
- **Settings:** Update business details, your profile, and the active promotion.

## Tech stack

Next.js 16 (App Router), React, TypeScript, Tailwind CSS, Supabase (Auth and PostgreSQL), `html5-qrcode`, and `qrcode.react`. Tests use Vitest and Testing Library.

## Run locally

You need Node.js and npm, plus a Supabase project.

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/ergunmalay/LoyaltyApp.git
   cd LoyaltyApp
   npm ci
   ```

2. In your Supabase project's SQL Editor, run [`schema.sql`](schema.sql), then [`migrations/002_phase2.sql`](migrations/002_phase2.sql), in that order. The migration adds the database functions used for adding stamps, removing stamps, and redeeming rewards.

3. Copy the example environment file and fill in the values from your Supabase project:

   ```bash
   cp .env.local.example .env.local
   ```

   | Variable | Purpose |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public/anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server-side database access; keep secret |
   | `NEXT_PUBLIC_SITE_URL` | App origin, such as `http://localhost:3000` |

4. In Supabase Auth URL settings, add `http://localhost:3000/auth/callback` as an allowed redirect URL for email confirmation and password recovery. If deploying, add your production callback URL and set `NEXT_PUBLIC_SITE_URL` to your production origin.

5. Start the app and open [http://localhost:3000](http://localhost:3000):

   ```bash
   npm run dev
   ```

Keep `SUPABASE_SERVICE_ROLE_KEY` on the server. Do not commit `.env.local` or expose that key in browser code.

## Try the flow

1. Sign up as a business owner and confirm your email if Supabase email confirmation is enabled.
2. Create a promotion on the dashboard and open the join URL shown beneath its QR code.
3. Join as a customer to receive a browser-based pass.
4. Open **Staff Scanner** in the business dashboard, scan the pass QR code or enter its barcode, and add stamps.
5. Once the stamp target is reached, redeem the reward. Check **Analytics** for membership, stamp, and redemption activity.

## Project layout

| Path | What it contains |
| --- | --- |
| `app/dashboard`, `app/scan`, `app/analytics`, `app/settings` | Business and staff pages |
| `app/join/[businessSlug]`, `app/pass/[passId]` | Customer signup and digital pass |
| `app/api` | Signup, passes, stamps, redemption, and settings endpoints |
| `lib` | Supabase clients and rate limiting |
| `schema.sql`, `migrations/` | Database schema and follow-up migration |
| `tests/` | Automated tests |

## Tests

```bash
npm test
```

## Current limitation

The customer pass works in the browser and can be saved to a phone's home screen. The Apple Wallet route is a **mock**: it returns example pass data, not a signed, installable `.pkpass`. Apple Wallet support would require a Pass Type ID certificate and signed pass bundle.
