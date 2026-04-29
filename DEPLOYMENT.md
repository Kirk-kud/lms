## Deployment overview

This repo deploys as two services:

- **API (`/api`)**: NestJS deployed to **Render** via Dockerfile
- **Web (`/web`)**: Next.js deployed to **Vercel**

The web app talks to the API via `NEXT_PUBLIC_API_URL`, and both API + web use Supabase.

---

## Render (API)

### Service settings

- **Root directory**: `api`
- **Runtime**: Docker (see `api/Dockerfile`)
- **Healthcheck path**: `/api/auth/me` (returns 200 even without auth)
- **Port**: Render injects `PORT` automatically

### Environment variables (Render)

Set these in the Render service:

- **`PORT`**: (optional) Render injects this automatically
- **`CORS_ORIGINS`**: comma-separated allowed web origins
  - Example: `https://your-vercel-domain.vercel.app`
- **`SUPABASE_URL`**: Supabase project URL
- **`SUPABASE_ANON_KEY`**: Supabase anon/public key
- **`SUPABASE_SERVICE_ROLE_KEY`**: Supabase service role key (server-only)
- **`SUPABASE_JWT_SECRET`**: Supabase JWT secret (from Supabase dashboard)

---

## Vercel (Web)

### Project settings

- **Root directory**: `web`

### Environment variables (Vercel)

Set these in Vercel (Production + Preview as needed):

- **`NEXT_PUBLIC_API_URL`**: Base API URL **including `/api`**
  - Example: `https://your-render-service.onrender.com/api`
- **`NEXT_PUBLIC_SUPABASE_URL`**: Supabase project URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Supabase anon/public key

---

## Supabase prerequisites (both)

You will need:

- **Project URL**
- **Anon (public) key**
- **Service role key** (API only)
- **JWT secret** (API only)

Also ensure your Supabase auth settings and RLS policies match your app’s expected access patterns.

