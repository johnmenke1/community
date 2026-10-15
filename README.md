# community

A self-hostable community platform: live audio/video rooms (RealtimeKit), communities, posts feed, and courses.

> **Status: v0.2.** Communities, posts feed, RealtimeKit rooms, course scaffolding, and the 4 v0.1 polish items are all live. Stripe payments and email notifications are out of scope; courses have table + API but no player UI (the client builds the player against `/api/communities/:slug/courses` and `.../lessons` in commit 3).

## Stack

- **Monorepo:** pnpm 12 workspaces + Turborepo
- **Web (`apps/web`):** React Router v8.4 (framework mode, SSR) · TypeScript · Tailwind CSS v4 · Vite 6 · React 19
- **API (`apps/api`):** NestJS 11 · better-auth · Drizzle ORM · postgres-js
- **DB (`packages/db`):** Drizzle schema + migrations + CJS client
- **Shared (`packages/shared`):** zod schemas shared between web and api
- **Local infra:** Postgres 16 + MailHog via docker-compose

## Prerequisites

- **Node 24+**
- **pnpm 12** (the repo pins `pnpm@12.9.1` via `packageManager`)
- **Docker** + Docker Compose v2 (for Postgres and MailHog)
- **Cloudflare account** (for RealtimeKit) — optional for non-room smoke tests

## Quickstart (local dev)

```bash
# 1. Install
pnpm install

# 2. Bring up Postgres + MailHog
docker compose up -d postgres mailhog

# 3. Apply Drizzle migrations
pnpm db:migrate

# 4. Copy env files and fill in secrets (only first time)
cp apps/api/.env.example apps/api/.env.local
# edit apps/api/.env.local — set BETTER_AUTH_SECRET, CF_ACCOUNT_ID, CF_REALTIMEKIT_TOKEN (token optional)

# 5. Run api + web in parallel
pnpm dev
```

- API: <http://localhost:3001/api/health>
- Web: <http://localhost:3000>
- MailHog UI: <http://localhost:8025>

## What works in v0.2

| Area | Status |
|---|---|
| Email/password signup & login (better-auth) | ✅ |
| Public landing + dashboard | ✅ |
| Create community, view list, join, leave | ✅ |
| Create post, view feed, react (like/love/insightful), soft-delete | ✅ |
| Real-time rooms (RealtimeKit Cloudflare API, lazy session creation) | ✅ (requires `CF_REALTIMEKIT_TOKEN` + `CF_ACCOUNT_ID`) |
| Courses + lessons schema & API | ✅ (UI shows empty state with API docs) |
| Membership guards on all community-scoped routes | ✅ |
| Role guards (owner/admin/member) on create/update/delete | ✅ |
| `ParseUUIDPipe` on user `:id` route | ✅ (no more 500 on `/api/users/foo`) |
| `path-to-regexp` v8 deprecation silenced | ✅ (`@All("*path")` instead of `*`) |
| Dashboard loader defensive 500 → /login fallback | ✅ (uses `getUser()` helper) |
| Stripe payments | ❌ (out of scope) |
| Email notifications / MailHog templates | ❌ (out of scope) |
| Course player UI | ❌ (client builds in commit 3) |

## API surface

```
GET    /api/health                                # api + db liveness
GET    /api/realtime/health                       # RealtimeKit configured?
POST   /api/auth/sign-up/email                    # better-auth
POST   /api/auth/sign-in/email                    # better-auth
POST   /api/auth/sign-out                         # better-auth
GET    /api/users/me                              # current session user
GET    /api/users/:id                             # public profile (UUID only)

GET    /api/communities/mine                      # my communities
GET    /api/communities/:slug                     # read
POST   /api/communities                           # create (auth)
PUT    /api/communities/:slug                     # update (admin)
GET    /api/communities/:slug/members             # list members (member only)
POST   /api/communities/:slug/join                # join (auth)
POST   /api/communities/:slug/leave               # leave (member; owner forbidden)

GET    /api/communities/:slug/posts               # paginated feed (member only)
POST   /api/communities/:slug/posts               # create post (member)
DELETE /api/posts/:id                             # soft-delete (author or admin)
POST   /api/posts/:id/reactions                   # toggle like/love/insightful

GET    /api/communities/:slug/rooms               # list rooms (member)
POST   /api/communities/:slug/rooms               # create room (admin)
POST   /api/rooms/:id/join                        # issue RealtimeKit token (member)

POST   /api/communities/:slug/courses             # create course (admin)
DELETE /api/communities/:slug/courses/:courseSlug # delete course (admin)
POST   /api/communities/:slug/courses/:courseSlug/lessons  # add lesson (admin)
```

## Verifying it works

After the quickstart above:

```bash
# 1. API health
curl http://localhost:3001/api/health
#   -> {"status":"ok","db":"ok"}

# 2. RealtimeKit health (false if no token, true once CF_* is set)
curl http://localhost:3001/api/realtime/health
#   -> {"configured":false}

# 3. Sign up
curl -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"[email protected]","password":"testpass123","name":"Test User"}'

# 4. Web flow
#    open http://localhost:3000
#    click "Sign up" -> register -> /dashboard
#    dashboard shows your name + your communities (empty at first)
#    click "New community" -> create -> /c/:slug
#    /c/:slug shows posts feed + Live rooms + Courses link
#    owners see "Start a room" (admin-only)
```

## Project layout

```
.
├── apps/
│   ├── api/                 NestJS 11 + better-auth + Drizzle
│   │   src/auth/            catch-all controller, guard, instance
│   │   src/communities/     CRUD + members + role guards
│   │   src/courses/         course + lesson CRUD
│   │   src/posts/           feed, reactions
│   │   src/realtime/        RealtimeKit Cloudflare wiring
│   │   src/users/           session + public profile
│   │   src/database/        DATABASE injection token
│   │   src/health/          health endpoint
│   └── web/                 React Router v8 + Tailwind v4
│       app/lib/server.ts    apiFetch, getUser, requireUser
│       app/routes/          _index, login, signup, dashboard, logout,
│                            c.* (communities + posts + rooms + courses)
├── packages/
│   ├── db/                  Drizzle schema + migrations + client
│   └── shared/              zod schemas shared with the api
├── docker-compose.yml       postgres + mailhog
├── pnpm-workspace.yaml
├── turbo.json
└── .env.example
```

## Production architecture

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
└──────┬────────┘                └──────┬───────┘
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
- **RealtimeKit** runs on Cloudflare's edge; the API mints short-lived meeting tokens (1h TTL).

## What's NOT in v0.2 (deferred)

- **Stripe paid memberships** — the `memberships` table has `stripe_customer_id` and `stripe_subscription_id` columns ready, but no Stripe SDK, no webhook, no UI
- **Email notifications** — MailHog is wired in docker-compose but no transactional email templates (verification, post notifications, etc.)
- **Course player UI** — schema, API, and admin CRUD are done; the actual lesson viewer is the client's commit 3 work
- **Scheduled rooms, room recordings** — rooms are ephemeral ("start a room, join, done")
- **In-app notifications / DMs / search / mentions** — out of scope
- **Multi-tenancy / organizations** — single community hierarchy only

## CI

`.github/workflows/ci.yml` runs `pnpm install --frozen-lockfile` + `turbo lint build` on push to `main` and on PRs.
