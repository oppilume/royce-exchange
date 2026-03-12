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

- Admin username: `admin`
- Admin password: `jayhawkadmin`
- User password for seeded users: `password123`
- Seeded usernames: `alex`, `mila`, `jordan`, `zoe`, `samir`

## Auth flow

- Signup asks for `username` and `password`.
- Supabase Auth still requires an email internally, so the app generates a hidden synthetic email in the format `username@jayhawkgems.local`.
- Signup uses the server-side admin API to create and auto-confirm the auth user, then signs the user in immediately.
- A trigger on `auth.users` creates the matching `profiles` row automatically.
- Login accepts username + password by looking up the stored auth email server-side, then calling Supabase password auth.

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

## Verification status

The environment I built this in does not have `node`, `npm`, or `npx` installed, so I could not run the Next app, typecheck, or lint here. The codebase and setup files are complete, but local verification still needs to be done after installing Node.
# royce-exchange
