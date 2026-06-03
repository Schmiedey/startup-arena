# Likelyr

Likelyr is a Next.js 16 App Router app where people submit ideas, vote on head-to-head battles, and rank what is likelier to succeed with Elo-style scoring.

## Stack

- Next.js 16, React 19, TypeScript
- Auth.js / NextAuth with Google provider
- Vercel Postgres / Neon via `@vercel/postgres`
- Tailwind CSS 4 and shadcn-style UI primitives
- Vitest for focused unit tests

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in auth provider credentials and Postgres connection values in `.env.local`.

Apply the database schema from `supabase/schema.sql`, then optionally seed data from `supabase/seed.sql`, `supabase/seed-realistic.sql`, or the launch-focused `supabase/seed-growth.sql`.

## Commands

```bash
npm run dev
npm run lint
npm test
npm run build
```

Open [http://localhost:3000](http://localhost:3000) for local development.

## Notes

- Next.js 16 uses `src/proxy.ts`; do not reintroduce `middleware.ts`.
- Voting updates are transactional. Keep vote inserts, Elo changes, and battle counters in one transaction.
- Validate idea payloads server-side through `src/lib/validation.ts`; client form constraints are not enough.
- Admin-only APIs should use `requireAdmin()` from `src/lib/admin.ts`.
