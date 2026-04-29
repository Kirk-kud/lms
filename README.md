## Love Inc LMS

Love Inc LMS is a discipleship learning management system with:

- **Web app** (`/web`): Next.js (App Router) + Supabase auth client
- **API** (`/api`): NestJS REST API backed by Supabase (profiles/classes/modules/assignments/attendance)

---

## Monorepo structure

- `api/` — NestJS API (Render)
- `web/` — Next.js frontend (Vercel)
- `supabase/` — Supabase-related assets/config (if applicable)

---

## Local development setup

### 1) Prerequisites

- Node.js **20.x**
- npm **(comes with Node)**
- A Supabase project (URL + keys)
- Apply Supabase migrations in `supabase/migrations/`

### 2) Environment variables

Create these env vars in your shell (or in your own local env manager).

#### API (`/api`)

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `CORS_ORIGINS` (optional, default: `http://localhost:3000`)
- `PORT` (optional, default: `3001`)

#### Web (`/web`)

- `NEXT_PUBLIC_API_URL` (example: `http://localhost:3001/api`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3) Install dependencies

From the repo root:

- API:
  - `cd api`
  - `npm ci`
- Web:
  - `cd ../web`
  - `npm ci`

### 4) Run the API

In one terminal:

- `cd api`
- `npm run start:dev`

The API listens on:

- `http://localhost:3001/api`

### 5) Run the web app

In another terminal:

- `cd web`
- `npm run dev`

The web app runs on:

- `http://localhost:3000`

---

## Environment variables reference

### API (Render)

- **`SUPABASE_URL`**: Supabase project URL
- **`SUPABASE_ANON_KEY`**: Supabase anon/public key
- **`SUPABASE_SERVICE_ROLE_KEY`**: Supabase service role key (server-only)
- **`SUPABASE_JWT_SECRET`**: Supabase JWT secret
- **`CORS_ORIGINS`**: Comma-separated list of allowed web origins
- **`PORT`**: Port to bind (Render typically injects this)

### Web (Vercel)

- **`NEXT_PUBLIC_API_URL`**: Base API URL **including `/api`**
- **`NEXT_PUBLIC_SUPABASE_URL`**: Supabase project URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Supabase anon/public key

---

## Deployment

See `DEPLOYMENT.md` for the exact Render + Vercel dashboard settings and environment variables.

