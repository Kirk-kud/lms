// Delete script — removes exactly what seed.js created
// Run from anywhere:  node supabase/seed-delete.js   (from repo root)
//                 or  node ../supabase/seed-delete.js (from api/)

const path = require('path');
const apiDir = path.resolve(__dirname, '../api');
require(path.join(apiDir, 'node_modules/dotenv')).config({ path: path.join(apiDir, '.env') });
const { createClient } = require(path.join(apiDir, 'node_modules/@supabase/supabase-js'));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SEED_DOMAIN = '@seed.loveinc.test';
const CLASS_TITLE = 'Discipleship Academy 101';

function log(msg) {
  process.stdout.write(`  ${msg}\n`);
}

async function main() {
  console.log('\n🗑️   Deleting seeded data...\n');

  // 1. Find all seeded auth user IDs (by email domain)
  log('Looking up seeded accounts…');
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, email')
    .like('email', `%${SEED_DOMAIN}`);
  if (profErr) throw new Error(`profiles lookup: ${profErr.message}`);

  if (!profiles || profiles.length === 0) {
    console.log('\n  Nothing to delete — no seeded accounts found.\n');
    return;
  }

  const seededIds = profiles.map((p) => p.id);
  log(`Found ${profiles.length} seeded account(s).`);

  // 2. Find the seeded class (owned by the seeded admin)
  log('Looking up seeded class…');
  const { data: classes } = await supabase
    .from('classes')
    .select('id')
    .eq('title', CLASS_TITLE)
    .in('tutor_id', seededIds);

  const classIds = (classes ?? []).map((c) => c.id);

  if (classIds.length > 0) {
    // 3. Delete attendance records → sessions (cascade handles records)
    log('Deleting attendance sessions…');
    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('id')
      .in('class_id', classIds);

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map((s) => s.id);
      await supabase.from('attendance_records').delete().in('session_id', sessionIds);
      await supabase.from('attendance_sessions').delete().in('id', sessionIds);
    }

    // 4. Delete submissions → assignments (need to find assignment IDs first)
    log('Deleting assignments and submissions…');
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id')
      .in('class_id', classIds);

    if (assignments && assignments.length > 0) {
      const assignmentIds = assignments.map((a) => a.id);
      await supabase.from('submissions').delete().in('assignment_id', assignmentIds);
      await supabase.from('assignments').delete().in('id', assignmentIds);
    }

    // 5. Delete module items → modules
    log('Deleting modules…');
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .in('class_id', classIds);

    if (modules && modules.length > 0) {
      const moduleIds = modules.map((m) => m.id);
      await supabase.from('module_items').delete().in('module_id', moduleIds);
      await supabase.from('modules').delete().in('id', moduleIds);
    }

    // 6. Delete enrollments
    log('Deleting enrollments…');
    await supabase.from('enrollments').delete().in('class_id', classIds);

    // 7. Delete cohorts
    log('Deleting cohorts…');
    await supabase.from('cohorts').delete().in('class_id', classIds);

    // 8. Delete the class itself
    log('Deleting class…');
    await supabase.from('classes').delete().in('id', classIds);
  } else {
    log('No matching class found — skipping class-related data.');
  }

  // 9. Delete auth users (cascades to profiles)
  log('Deleting auth accounts…');
  for (const id of seededIds) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) console.warn(`  ⚠  Could not delete user ${id}: ${error.message}`);
  }

  console.log('\n✅  All seeded data removed.\n');
}

main().catch((err) => {
  console.error('\n❌  Delete failed:', err.message);
  process.exit(1);
});
