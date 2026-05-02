# Supabase Setup

Follow these steps in order to get the database, storage, and realtime features running.

---

## 1. Create a new Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New project**.
3. Choose your organisation, give the project a name (e.g. `love-inc-lms`), set a strong database password, and pick the region closest to your users.
4. Click **Create new project** and wait for provisioning to finish (~2 minutes).

---

## 2. Run the migration

1. In your project dashboard, open the **SQL Editor** (left sidebar → SQL Editor).
2. Click **New query**.
3. Open `supabase/migrations/001_initial_schema.sql` in this repo, copy the entire contents, and paste it into the editor.
4. Click **Run** (or press `Ctrl/Cmd + Enter`).
5. Confirm there are no errors in the output panel. All tables, RLS policies, and the storage bucket will be created.

---

## 3. Run the seed data

> Only do this for development or testing — never run the seed against a production project with real users.

1. In the **SQL Editor**, open another **New query**.
2. Open `supabase/seed.sql`, copy the entire contents, and paste it into the editor.
3. **Important:** The seed file inserts profiles with fixed UUIDs that must match rows in `auth.users`. Before running, create the five users in the dashboard first:
   - Go to **Authentication → Users → Add user** for each person below.
   - After creating each user, copy the UUID Supabase assigned and replace the corresponding fixed UUID in `seed.sql`.

   | Name | Email | Role | Fixed UUID in seed.sql |
   |------|-------|------|------------------------|
   | Kwami Asante | kwami@loveinc.org | tutor | `00000000-0000-0000-0000-000000000001` |
   | Ama Mensah | ama@loveinc.org | student | `00000000-0000-0000-0000-000000000002` |
   | Kofi Boateng | kofi@loveinc.org | student | `00000000-0000-0000-0000-000000000003` |
   | Efua Asante | efua@loveinc.org | student | `00000000-0000-0000-0000-000000000004` |
   | James Yaw | james@loveinc.org | student | `00000000-0000-0000-0000-000000000005` |

4. After updating the UUIDs, click **Run** in the SQL Editor.

---

## 4. Enable Realtime

Realtime must be enabled per-table in the Supabase dashboard.

1. Go to **Database → Replication** (left sidebar).
2. Under **Supabase Realtime**, click **0 tables** (or the current table count) next to the `supabase_realtime` publication.
3. Toggle on the following two tables:
   - `attendance_sessions`
   - `attendance_records`
4. Click **Save**.

The app uses these channels to show live attendance updates when a tutor starts a session and students check in.

---

## 5. Verify the storage buckets

The migration scripts create the `submissions` and `modules` buckets automatically. To confirm:

1. Go to **Storage** in the left sidebar.
2. You should see a bucket named **submissions** with **Private** access and a bucket named **modules** with **Public** access.
3. Click the `submissions` bucket, then open the **Policies** tab and confirm three policies exist:
   - `students_upload` — INSERT
   - `students_read_own` — SELECT (own folder)
   - `tutors_read_submissions` — SELECT (all)

If the `submissions` bucket is missing (some Supabase plans restrict storage DDL in the SQL editor), create it manually:
1. Click **New bucket**, name it `submissions`, leave **Public** unchecked, and click **Save**.
2. Then add the three policies above via **Storage → Policies → New policy** using the SQL from the migration file.

If the `modules` bucket is missing, create it manually:
1. Click **New bucket**, name it `modules`, enable **Public bucket**, and click **Save**.
2. Set the file size limit to 25 MB and restrict allowed MIME types to `application/pdf`.

---

## 6. Copy your API keys

Your app needs three values from the project settings.

1. Go to **Project Settings → API** (gear icon in the left sidebar).
2. Copy the following and add them to your `.env` file (never commit this file):

| Key | Where to find it | `.env` variable |
|-----|-----------------|-----------------|
| Project URL | **Project URL** box at the top | `SUPABASE_URL` |
| Anon / public key | **Project API keys → anon public** | `SUPABASE_ANON_KEY` |
| Service role key | **Project API keys → service_role** (click reveal) | `SUPABASE_SERVICE_ROLE_KEY` |
| JWT secret | **Project Settings → API → JWT Settings → JWT Secret** (click reveal) | `SUPABASE_JWT_SECRET` |

> **Security note:** The `service_role` key and JWT secret bypass RLS and must only be used in trusted server-side code (e.g. your API). Never expose them in client-side code or commit them to version control.

Example `.env` structure:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
```
