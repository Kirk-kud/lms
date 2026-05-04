# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Love Inc LMS is a discipleship learning management system for university campus church communities (Ashesi, KNUST, UMaT, Legon). It is a role-based platform — **tutors** manage classes and curriculum, **students** enroll and submit work.

## Monorepo Structure

```
lms/
├── web/          Next.js 16 frontend (App Router, Tailwind 4, Supabase SSR)
├── api/          NestJS 11 REST API (Supabase, Passport JWT)
└── supabase/     Migrations and seed data
```

The web and api are independent Node projects — run commands from their respective directories.

## Development Commands

### Web (`cd web`)
```bash
npm run dev      # localhost:3000
npm run build
npm run lint
```

### API (`cd api`)
```bash
npm run start:dev   # localhost:3001, watch mode
npm run build       # compiles to dist/
npm run lint
npm run test        # Jest unit tests
npm run test:e2e
npm run test:cov
```

## Environment Variables

**`api/.env`**
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
CORS_ORIGINS=http://localhost:3000
```

**`web/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

### Auth Flow
- Supabase Auth handles login/register; user role (`tutor` | `student`) is stored in `user_metadata`.
- `web/middleware.ts` guards all routes: unauthenticated → `/login`; cross-role access → role's own dashboard.
- The API uses `SUPABASE_JWT_SECRET` to verify Supabase-issued JWTs via Passport (`JwtAuthGuard`). The `@Public()` decorator exempts routes from the guard.
- The API uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) for server-side DB operations; the web client uses the anon key (respects RLS).

### Web App Router Layout
- `/(auth)` — public routes (login, register)
- `/(student)` — student dashboard, class detail, profile
- `/(tutor)` — tutor dashboard, class management
- `/join` — invite-code enrollment (open to any authenticated role)

### API Modules
Each resource (`classes`, `assignments`, `course-modules`, `attendance`) follows NestJS module/controller/service pattern. All share the `SupabaseService` from `src/supabase/`.

### Database
PostgreSQL via Supabase. Core tables: `profiles`, `classes`, `enrollments`, `course_modules`, `assignments`, `attendance_sessions`, `attendance_records`. Full schema in `public_schema.sql`. Migrations in `supabase/migrations/`. Enable Realtime on `attendance_sessions` and `attendance_records` for live attendance features.

## Next.js 16 Warning

This uses Next.js 16 which has breaking changes from prior versions. Before writing any Next.js code, read the relevant guide in `web/node_modules/next/dist/docs/`. APIs, conventions, and file structure may differ from training data.

## Design System

The full spec is in `DESIGN.md` and `DESIGN.json`. Rules that affect implementation:

- **Font**: Inter only — weights 400, 500, 600. No italics.
- **Colors**: Ink Black `#111111` (primary), Fellowship Burgundy `#8B1A2F` (single accent, max 3× per screen), Archive Gray `#F8F8F8` (surfaces), Rule Line `#E5E5E5` (borders, 0.5px).
- **No box-shadows** — use tonal backgrounds for depth.
- **Active nav**: `bg-white` + `font-medium` text, no left-border stripe.
- **Buttons**: default `bg-[#111111] text-white`, hover → `bg-[#8B1A2F]`. Height 36px, `rounded-md`.
- **Borders**: 0.5px `border-[#E5E5E5]` only — never thicker decorative borders.
