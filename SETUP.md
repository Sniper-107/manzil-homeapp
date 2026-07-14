# Manzil — Home Asset & Maintenance Manager

## What's built so far

- Next.js 16 app (App Router, TypeScript, Tailwind v4)
- Full DB schema (`supabase/migrations/0001_init.sql`, `0002_storage.sql`) —
  **already tested against a real local Postgres**, including RLS
  isolation between households, generated warranty/maintenance-due
  columns, and the join-by-invite-code flow. Not just written and hoped.
- Auth: passwordless magic-link sign-in (Supabase Auth)
- Household creation / joining via a short invite code
- Dashboard: urgent warranties + maintenance, asset count/value
- Assets: list, add (camera receipt scan → Claude Haiku 4.5 vision →
  editable review form → save), detail view w/ signed receipt photo,
  delete
- Maintenance: list grouped by overdue/due-soon/upcoming, add task,
  mark-done (logs history + auto-recalculates next due date)
- Household settings: invite code, member list, sign out
- PWA manifest + icons (installable to home screen on iOS/Android)

## What you need to do before we can go further

I can't fully live-test auth flows, the receipt-scan Edge call, or
real-time sync without your actual Supabase project — here's the setup:

### 1. Create the Supabase project
Go to [supabase.com](https://supabase.com) → New Project (free tier is
enough). Pick the region closest to you (likely `eu-central-1` or similar
for Saudi Arabia — whichever is closest/available).

### 2. Run the migrations
Supabase Dashboard → SQL Editor → paste and run, **in order**:
1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_storage.sql`
3. `supabase/migrations/0003_rooms_planning_documents.sql`

### 3. Configure Auth
Dashboard → Authentication → Providers → **Email**:
- Turn **OFF** "Confirm email" — this lets you sign in immediately after
  creating an account, no confirmation email to wait for.

Dashboard → Authentication → URL Configuration:
- **Site URL**: your live web address once deployed (e.g.
  `https://manzil-homeapp.vercel.app`)

### 4. Get your API credentials
Dashboard → Settings → API:
- Project URL
- `anon` `public` key

### 5. Get an Anthropic API key
[console.anthropic.com](https://console.anthropic.com) → API Keys.
**Important**: this is separate from the leaked key in your old project
— use a brand new one, and never commit it to a file.

### 6. Set environment variables
Copy `.env.local.example` to `.env.local` for local dev, and add the
same three variables in Vercel → Project Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` (mark this one as "Sensitive" in Vercel — it's
  server-only and never reaches the browser)

### 7. Deploy
Push this to a GitHub repo, then import it into Vercel — same
`home-assets-mustafa` project or a new one, your call.

Once you've got a live Project URL + anon key, share them with me (or
just tell me it's done) and I'll do a real end-to-end pass: sign up,
create a household, scan a real receipt, check the dashboard math,
and confirm two accounts can share one household live.

## Cost check-in
Nothing here costs anything beyond the free tiers until you're scanning
real receipts — that's the ~$0.003/receipt Claude Haiku cost from the
original plan. Still comfortably under the $5/month target.
