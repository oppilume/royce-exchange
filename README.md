# Jayhawk Gems

Jayhawk Gems is a full-stack prototype for a school-specific prediction market. Students trade artificial-currency YES/NO markets on what teachers will say during class, while admins moderate proposals, credit balances, and resolve outcomes.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres + SQL RPCs

## What’s included

- Landing page with hero, featured live markets, and leaderboard preview
- Markets browse page with filters, search, sort, and status-aware market cards
- Single market page with trade actions, participant voting, and admin resolution panel
- Market proposal flow with pending review queue
- Portfolio with balance, positions, performance metrics, transaction history, and deposit requests
- Public leaderboard and public user profiles
- Admin dashboard for approvals, resolution, deletion, deposit review, and balance adjustments
- SQL schema enforcing trading windows, balance checks, participant-only voting, refunds on deletion, and payouts on resolution
- Realistic seed data for teachers, classes, users, pending/live/resolved markets, trades, votes, and leaderboard stats

## Project structure

```text
.
├── app
│   ├── actions
│   │   ├── admin.ts
│   │   ├── auth.ts
│   │   └── market.ts
│   ├── admin/page.tsx
│   ├── create/page.tsx
│   ├── leaderboard/page.tsx
│   ├── login/page.tsx
│   ├── markets/[marketId]/page.tsx
│   ├── markets/page.tsx
│   ├── portfolio/page.tsx
│   ├── signup/page.tsx
│   ├── u/[username]/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── components
│   ├── admin-panels.tsx
│   ├── app-shell.tsx
│   ├── leaderboard-table.tsx
│   ├── market-card.tsx
│   ├── market-proposal-form.tsx
│   ├── trade-form.tsx
│   ├── vote-form.tsx
│   └── ui
│       ├── badge.tsx
│       ├── button.tsx
│       └── input.tsx
├── lib
│   ├── supabase
│   │   ├── admin.ts
│   │   ├── client.ts
│   │   └── server.ts
│   ├── auth.ts
│   ├── data.ts
│   ├── types.ts
│   └── utils.ts
├── supabase
│   ├── schema.sql
│   └── seed.sql
├── .env.example
├── middleware.ts
├── next.config.ts
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Local setup

1. Install Node.js 20+ and npm locally.
2. Create a new Supabase project.
3. Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

4. Install dependencies:

```bash
npm install
```

5. In Supabase SQL Editor, run [`supabase/schema.sql`](/Users/kaysonnaik/Documents/Playground/supabase/schema.sql).
6. Then run [`supabase/seed.sql`](/Users/kaysonnaik/Documents/Playground/supabase/seed.sql).
7. Start the app:

```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

- Admin email: `admin@example.com`
- Admin password: `jayhawkadmin`
- User password for seeded users: `password123`
- Seeded emails: `alex@example.com`, `mila@example.com`, `jordan@example.com`, `zoe@example.com`, `samir@example.com`
- Seeded public usernames: `admin`, `alex`, `mila`, `jordan`, `zoe`, `samir`

## Auth flow

- Signup asks for `email`, `password`, and `username`.
- Email is the login credential. Username is the public identity shown throughout the app.
- Signup uses the server-side admin API to create and auto-confirm the auth user, then inserts the matching `profiles` row using the auth user id and username.
- Login signs in directly with email + password through Supabase Auth.

## Core backend rules

- Only approved markets can be traded.
- Trading is blocked after `trading_close_at`.
- Voting opens only after `vote_start_at`.
- Only users with positions in a market can vote.
- Trades debit Gems immediately and adjust the market’s YES price.
- Admins can approve, reject, resolve, delete, review deposit requests, and adjust balances.
- Deleting a market refunds cost basis to all affected traders.
- Resolving a market pays 100 Gems per winning share.

## Notes

- This MVP intentionally avoids Stripe and real-money flows.
- Pricing is prototype-simple: each trade nudges the YES price linearly, while NO is always `100 - YES`.
- Prisma is omitted to keep the architecture lean and close to Supabase’s SQL/RPC model.
- Admin writes use the server-side Supabase service-role client so role checks and operational actions stay on the server.

## One-time Supabase steps

1. Run [`supabase/schema.sql`](/Users/kaysonnaik/Documents/playground/supabase/schema.sql) in the connected Supabase project.
2. Run [`supabase/seed.sql`](/Users/kaysonnaik/Documents/playground/supabase/seed.sql) if you want demo data.
3. If you already created the project before these MVP changes, rerun the schema file so the new `deposit_requests.admin_note`, `balance_transactions`, and `admin_audit_log` objects exist.

## First admin bootstrap

For a fresh deployment, the safest built-in path is:

1. Set `FIRST_ADMIN_EMAIL=you@example.com` in [.env.local](/Users/kaysonnaik/Documents/playground/.env.local) before creating the first real account.
2. Start the app and sign up using that exact email.
3. During signup, the app checks whether there are currently zero admin users. If so, and the email matches `FIRST_ADMIN_EMAIL`, that new profile is promoted to `admin`.
4. After your first admin account is created, remove `FIRST_ADMIN_EMAIL` from `.env.local` and redeploy/restart.

Important details:

- The bootstrap only works when there are no existing admins.
- The email must match exactly.
- This keeps the path safe for new deployments without leaving an always-on admin backdoor.

## Verification status

Verified locally in this workspace:

- `npm run typecheck`
- `npm run build`
