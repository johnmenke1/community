# community

A self-hostable community platform: live audio/video rooms (RealtimeKit), communities, posts feed, courses, and Stripe-backed memberships.

> **Status: v0.1 (foundation).** This commit only scaffolds the monorepo, auth (better-auth + email/password), Drizzle schema, and Docker setup. RealtimeKit wiring, communities, feed, courses, and payments land in commit 2.

## Stack

- **Monorepo:** pnpm 12 workspaces + Turborepo
- **Web (`apps/web`):** React Router v8.4 (framework mode, SSR) · TypeScript · Tailwind CSS v4 · Vite
- **API (`apps/api`):** NestJS 11 · better-auth · Drizzle ORM · postgres-js
- **DB (`packages/db`):** Drizzle schema + migrations
- **Local infra:** Postgres 16 + MailHog via docker-compose

## Prerequisites

- **Node 24+**
- **pnpm 12** (the repo pins `pnpm@12.9.1` via `packageManager`)
- **Docker** + Docker Compose v2 (for Postgres and MailHog)

## Quickstart (local dev)

```bash
# 1. Install
pnpm install

# 2. Bring up Postgres + MailHog
docker compose up -d postgres mailhog

# 3. Apply Drizzle migrations
pnpm db:migrate

# 4. Copy env files and fill in secrets (only first time)
cp apps/api/.env.example apps/api/.env.local   # if it doesn't exist
# edit apps/api/.env.local — set BETTER_AUTH_SECRET, CF_*, etc.

# 5. Run api + web in parallel
pnpm dev
```

- API: <http://localhost:3001/api/health>
- Web: <http://localhost:3000>
- MailHog UI: <http://localhost:8025>

## Verifying it works

After the quickstart above, run each smoke test in a separate terminal:

```bash
# 1. API health (DB connectivity check)
curl http://localhost:3001/api/health
#   -> {"status":"ok","db":"ok"}

# 2. Realtime stub health (no token yet in commit 1)
curl http://localhost:3001/api/realtime/health
#   -> {"configured":false}

# 3. Sign up a test user (returns 200 + user object)
curl -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"[email protected]","password":"testpass123","name":"Test User"}'

# 4. Web smoke test
#    open http://localhost:3000
#    click "Sign up" -> register -> redirected to /dashboard
#    dashboard shows your name + "Realtime health: false"
```

## Project layout

```
.
├── apps/
│   ├── api/                 NestJS 11 + better-auth
│   └── web/                 React Router v8 + Tailwind v4
├── packages/
│   └── db/                  Drizzle schema + migrations + client
├── docker-compose.yml       postgres + mailhog + api + web
├── pnpm-workspace.yaml
├── turbo.json
└── .env.example
```

## Expected production architecture (commit 2+)

```
            ┌──────────────────────┐
   Browser ─┤  Cloudflare (CDN/WAF)│
            └──────────┬───────────┘
                       │
       ┌───────────────┼────────────────┐
       │                               │
       ▼                               ▼
┌──────────────┐                ┌──────────────┐
│  Web (RR v8)  │                │ RealtimeKit  │
│  on Coolify   │                │  CF Workers  │
└──────┬────────┘                └──────────────┘
       │                               │
       │ HTTPS                          │ WS
       ▼                               ▼
┌──────────────┐   tunnel    ┌──────────────────┐
│  API (Nest)  │─────────────│  Postgres        │
│  on Coolify  │             │  (managed or     │
└──────────────┘             │   tunneled)      │
                             └──────────────────┘
```

- **Coolify** hosts `apps/api` and `apps/web` as Docker services.
- **Postgres** can be a managed DB or self-hosted behind a Cloudflare Tunnel.
- **RealtimeKit** runs on Cloudflare's edge; the API mints short-lived meeting tokens.

## What's NOT in this commit

Deferred to commit 2 — not implemented here:
- RealtimeKit real token minting (stub only)
- Communities CRUD UI
- Posts feed
- Courses + classrooms
- Stripe payments / memberships
- Admin dashboard
- Email magic links (MailHog is wired but no email templates yet)

## CI

`.github/workflows/ci.yml` runs `pnpm install --frozen-lockfile` + `turbo lint build` on push to `main` and on PRs.
