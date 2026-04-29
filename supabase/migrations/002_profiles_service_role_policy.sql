-- Allow server-side writes (service role) while preserving self-service rules.
-- This fixes: "new row violates row-level security policy for table profiles"

-- Drop and recreate policies to include service role access
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;

create policy "profiles_insert" on public.profiles
for insert
with check (
  auth.uid() = id
  or auth.role() = 'service_role'
);

create policy "profiles_update" on public.profiles
for update
using (
  auth.uid() = id
  or auth.role() = 'service_role'
);

