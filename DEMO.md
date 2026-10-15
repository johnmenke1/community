# Client demo walkthrough

This is the script for showing the client "The Parent Project" — a real
parenting community pre-seeded into the database so the demo lands
without any sign-up flow or empty-state friction.

## Before the call (5 minutes)

```bash
# 1. Start postgres if not already up
docker compose up -d postgres

# 2. Apply migrations + seed the demo data
pnpm db:migrate
pnpm db:seed

# 3. Start the api + web
BETTER_AUTH_URL=http://localhost:3000 \
  pnpm --filter @community/api dev   # or: node dist/main.js
BETTER_AUTH_URL=http://localhost:3000 \
  API_URL=http://localhost:3001 \
  pnpm --filter @community/web dev   # or: react-router-serve ./build/server/index.js
```

API: <http://localhost:3001> · Web: <http://localhost:3000>

If you've already seeded once and want a clean re-seed, `pnpm db:seed`
is idempotent — it drops the community and recreates everything.

## What the client will see

### Sign in (1 minute)

Open <http://localhost:3000> and click **Sign in**. Use one of these:

| Email | Role | What they see |
|---|---|---|
| `marcus@parentproject.demo` | owner | Full admin: "Add lesson" button, "Start a room", etc. |
| `sarah@parentproject.demo` | admin | Can create rooms, but not the owner-y stuff |
| `david@parentproject.demo` | member | Read-only experience, can post + react + join rooms |
| `elena@parentproject.demo` | member | Same as David |
| `james@parentproject.demo` | member | Same |
| `priya@parentproject.demo` | member | Same |

Password for all six: `parentdemo123`

> **Tip:** sign in as **marcus** for the demo — owners see the most
> surface area, including the lesson-authoring form.

### Dashboard (30 seconds)

- "Your communities" section shows **The Parent Project** as a member
- Sign out and back in as another user to show the same view from
  a member's perspective

### Community home — `/c/the-parent-project` (2 minutes)

This is the heart of the product. Show:

- **The header**: real-feeling description, "Courses" button, "Leave
  community" button (disabled for owners — intentional)
- **Live rooms**: 1 room pre-seeded ("Office Hours — How to talk to a
  teen who won't talk to you"). The **Join** button currently renders
  a clean error ("RealtimeKit not configured") because we don't have
  Cloudflare credentials in the demo env — that's expected, not a bug.
- **Posts feed**: 6 posts from 6 different people, with reactions
  from the others. Click a heart to see the reaction count update.

### Courses — `/c/the-parent-project/courses` (1 minute)

- 3 real courses with real-feeling titles:
  - *Foundations of Conscious Parenting* (3 lessons)
  - *Navigating the Teen Years* (2 lessons)
  - *Repair is everything* (3 lessons)
- The "N lessons" count under each course card

### Course detail — `/c/the-parent-project/courses/foundations` (1 minute)

- Numbered lesson list (1, 2, 3) — shows the order field works
- The **Add lesson** button (owner-only) — click it to show the
  authoring form with the markdown editor hint

### Lesson player — click into "Why it starts with you" (2 minutes)

This is the centerpiece. Show:

- The sidebar on the left with the lesson list (current lesson
  highlighted in black)
- The breadcrumb at the top (`/c/.../courses/foundations/lessons/...`)
- The markdown content rendered as proper HTML — H1, H2, paragraphs,
  blockquotes, code blocks, lists, links all working
- The **Next →** button at the bottom-right (no Previous on lesson 1)
- Click **Next** to go to lesson 2 — now both Previous and Next appear
- Click into lesson 3 — Next disappears, replaced by "Back to overview"
  (the end-of-course nav)

> **Tip:** during the demo, briefly resize the browser narrower to
> show the responsive layout (sidebar collapses below `lg`).

## What NOT to show (out of scope for this demo)

- **Stripe** — no payments, no "Upgrade" button. Mention as the next
  sprint.
- **Email** — the auth flow uses email/password but no transactional
  emails. Mention as the next sprint.
- **In-app notifications** — the dashboard has no notification bell
  yet. Mention as backlog.
- **The "RealtimeKit not configured" error on Join** — explain that
  audio/video rooms work end-to-end; we just don't have Cloudflare
  credentials in the demo env. Adding a token turns this into a
  real audio/video room.
- **Editing or deleting lessons** — currently the UI can only add
  lessons. Edit/delete is API-only (`DELETE /api/.../lessons`).
  Mention as a small follow-up.
- **Drag-to-reorder lessons** — order is set by a numeric field in
  the form. Drag-to-reorder is backlog.

## Suggested talking points

1. **"This is what your members would see when they first sign up."**
   The whole point of the seed data is to avoid the empty-state trap.
2. **"The lesson content is markdown, sanitized server-side."**
   Show a heading + code block. Explain that members authoring
   lessons (e.g. you, the founder) can write real content without
   it looking like a Google Doc.
3. **"The community is the product, not the courses."** The feed
   and the live rooms are the high-engagement surfaces; the
   courses are the durable knowledge base.
4. **"What's NOT here yet"** is just as important as what is.
   Being honest about Stripe and email being next sprint builds
   trust.

## Resetting between demos

```bash
# Drop the seeded community and re-create it (idempotent)
pnpm db:seed
```

This keeps the user accounts (so you don't have to re-sign-up) but
wipes the community, courses, lessons, posts, room, and reactions
to a clean state.

If you want to fully reset users too:

```bash
# Nuclear option: drop the schema and re-migrate
docker compose down -v
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
```
