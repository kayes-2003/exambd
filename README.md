# ExamBD — Monorepo Scaffold

Companion codebase to `mcq-exam-platform-architecture.md`. This is a **working scaffold**, not a
finished product: the structure, security-critical logic (shuffling, autosave, scoring, RLS), and
module wiring are real and functional; supporting CRUD (users, subjects, notifications, analytics
dashboards) is stubbed and needs to be filled in following the same patterns.

## Stack
- **apps/web** — Next.js 14 (App Router) + Tailwind + TanStack Query
- **apps/api** — NestJS + Prisma, verifies Supabase Auth JWTs, RBAC via `@Roles()`
- **apps/worker** — BullMQ-style background worker (autosubmit sweeper is implemented; scoring/notification queues are stubbed)
- **packages/shared-types** — Zod schemas shared between frontend and backend (single source of truth for validation)
- **supabase/migrations** — RLS policies, triggers, and the `auth.users → public.users` sync trigger that Prisma doesn't manage

## What's actually implemented end-to-end
This scaffold prioritizes depth on the **highest-risk vertical slice** over broad shallow coverage:
1. `POST /exams/:id/attempts` — builds a shuffled question set + shuffled option labels per student (`ShuffleService`, seeded PRNG so a refresh doesn't reshuffle)
2. `PATCH /attempts/:id/answers/:questionId` — validated autosave (rejects option IDs that don't belong to that student's shuffled set)
3. `POST /attempts/:id/submit` + `ScoringService` — resolves correctness via `option_id`, never a label, computes negative marking + rank/percentile
4. `apps/worker`'s autosubmit sweeper — force-submits any attempt past its server-computed deadline, so the timer can't be defeated client-side
5. Supabase RLS policies that block direct client reads of `question_options` (the table with `is_correct`)

## Getting started

```bash
pnpm install

# 1. Create a Supabase project, then push the migration:
supabase link --project-ref your-project-ref
supabase db push   # runs supabase/migrations/0001_init.sql

# 2. Point Prisma at the same project and create the app tables:
cp .env.example .env   # fill in DATABASE_URL, DIRECT_URL, SUPABASE_* keys
pnpm --filter @exambd/api prisma migrate dev --name init

# 3. Run everything
pnpm dev   # turbo runs web (:3000), api (:4000), worker in parallel
```

## What's NOT built yet (by design, to keep this a scaffold not a black box)
- Super Admin console pages (users/settings/analytics/backups) — routes exist, content doesn't
- Bulk CSV/XLSX import, question media upload to Supabase Storage
- Practice mode endpoints, bookmarks, notifications delivery
- Result/analytics charts (Recharts is installed, no chart components yet)
- BullMQ queue wiring in the worker (the autosubmit loop is a plain `setInterval` for scaffold simplicity; swap for a BullMQ repeatable job before production)
- Tests

See `mcq-exam-platform-architecture.md` §20 (Future Roadmap) for what comes after these.
