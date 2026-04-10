# Thanksgiving Picks

Private family prediction game: **dog show** group winners + Best in Show, **Thanksgiving football** game winners, and a **live leaderboard**. Stack: **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase** (Postgres + Realtime + anonymous auth).

## Prerequisites

- Node.js 20+ recommended
- A [Supabase](https://supabase.com/) project

## 1. Supabase setup

1. Create a project in Supabase.
2. Open **SQL Editor**, paste the contents of [`supabase/migrations/0001_initial.sql`](supabase/migrations/0001_initial.sql), and run it.
3. Enable **Anonymous sign-ins**: **Authentication** → **Providers** → **Anonymous** → enable.
4. Under **Project Settings** → **API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only; never ship to the browser)

## 2. Local app setup

```bash
cd thanksgiving-picks
cp .env.local.example .env.local
# Edit .env.local with your Supabase keys, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 3. Seed sample data (optional)

With `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` in the environment (e.g. in `.env.local`), run:

```bash
node scripts/seed.mjs
```

On Windows PowerShell you can load `.env.local` manually or use a tool such as [dotenv-cli](https://www.npmjs.com/package/dotenv-cli):

```bash
npx dotenv-cli -e .env.local -- node scripts/seed.mjs
```

Defaults:

- Event slug: `thanksgiving-2026`
- Family code: `family-demo` (override with `SEED_FAMILY_CODE` if you set it in the shell)

You can also use **Admin** → **Ensure demo event** and **Seed sample dogs & games** in the UI.

## 4. Deploy on Vercel

1. Push the repo and import the project in [Vercel](https://vercel.com/).
2. Add the same environment variables as in `.env.local.example` (including `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`).
3. In Supabase **Authentication** → **URL Configuration**, add your Vercel URL to **Site URL** and **Redirect URLs** if you use additional auth flows later.

## How it works (short)

- **Players**: anonymous Supabase user per device, display name + **family code** verified on the server against `event_secrets`. Active event is stored in an **httpOnly cookie** (`tp_event_id`).
- **Admin**: password checked by `/api/admin/login`; a signed **httpOnly cookie** gates `/admin/*`. All data mutations use the **service role** client on the server only.
- **Realtime**: [`RefreshOnRealtime`](components/providers/RefreshOnRealtime.tsx) subscribes to `postgres_changes` and calls `router.refresh()` so scores and locks update without manual refresh.
- **Scoring**: SQL function `leaderboard_for_event` matches picks to official results; points apply only when a result row exists.

## Scripts

| Command        | Description                |
| -------------- | -------------------------- |
| `npm run dev`  | Start dev server           |
| `npm run build`| Production build           |
| `npm run start`| Start production server    |
| `npm run lint` | ESLint                     |
| `node scripts/seed.mjs` | Seed demo event + data |

## Security notes

This is a **low-friction family app**, not a public SaaS. Use a strong `ADMIN_PASSWORD`, rotate the **family code** in `event_secrets` for each year, and never expose the **service role** key to the client.
