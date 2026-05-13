// Seed script — Discipleship Academy 101
// Run from anywhere:  node supabase/seed.js   (from repo root)
//                 or  node ../supabase/seed.js (from api/)

const path = require('path');
const apiDir = path.resolve(__dirname, '../api');
require(path.join(apiDir, 'node_modules/dotenv')).config({ path: path.join(apiDir, '.env') });
const { createClient } = require(path.join(apiDir, 'node_modules/@supabase/supabase-js'));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// All seeded accounts use this domain so the delete script can find them
const SEED_DOMAIN = '@seed.loveinc.test';
const SEED_PASSWORD = 'SeedPass#2026!'; // not meant for login, just satisfies policy

// ── Data definitions ──────────────────────────────────────────────────────────

const ADMIN = { email: `sirpy${SEED_DOMAIN}`, full_name: 'Prof. Peter Yaw Sarpong', role: 'admin' };

const TUTORS = [
  { email: `tutor.a${SEED_DOMAIN}`, full_name: 'Emmanuel Boateng', role: 'tutor', cohort: 'A' },
  { email: `tutor.b${SEED_DOMAIN}`, full_name: 'Grace Antwi',       role: 'tutor', cohort: 'B' },
  { email: `tutor.c${SEED_DOMAIN}`, full_name: 'Daniel Osei',       role: 'tutor', cohort: 'C' },
  { email: `tutor.d${SEED_DOMAIN}`, full_name: 'Priscilla Mensah',  role: 'tutor', cohort: 'D' },
  { email: `tutor.e${SEED_DOMAIN}`, full_name: 'Samuel Kwarteng',   role: 'tutor', cohort: 'E' },
];

const STUDENTS = [
  // Cohort A
  { email: `kofi.mensah${SEED_DOMAIN}`,     full_name: 'Kofi Mensah',      cohort: 'A' },
  { email: `ama.asante${SEED_DOMAIN}`,      full_name: 'Ama Asante',       cohort: 'A' },
  { email: `kwabena.boateng${SEED_DOMAIN}`, full_name: 'Kwabena Boateng',  cohort: 'A' },
  { email: `akua.darko${SEED_DOMAIN}`,      full_name: 'Akua Darko',       cohort: 'A' },
  { email: `nana.osei${SEED_DOMAIN}`,       full_name: 'Nana Osei',        cohort: 'A' },
  // Cohort B
  { email: `yaw.owusu${SEED_DOMAIN}`,       full_name: 'Yaw Owusu',        cohort: 'B' },
  { email: `abena.acheampong${SEED_DOMAIN}`,full_name: 'Abena Acheampong', cohort: 'B' },
  { email: `kojo.adomako${SEED_DOMAIN}`,    full_name: 'Kojo Adomako',     cohort: 'B' },
  { email: `efua.amponsah${SEED_DOMAIN}`,   full_name: 'Efua Amponsah',    cohort: 'B' },
  { email: `kwame.afriyie${SEED_DOMAIN}`,   full_name: 'Kwame Afriyie',    cohort: 'B' },
  // Cohort C
  { email: `adjoa.asare${SEED_DOMAIN}`,     full_name: 'Adjoa Asare',      cohort: 'C' },
  { email: `kofi.atta${SEED_DOMAIN}`,       full_name: 'Kofi Atta',        cohort: 'C' },
  { email: `maame.biney${SEED_DOMAIN}`,     full_name: 'Maame Biney',      cohort: 'C' },
  { email: `kweku.frimpong${SEED_DOMAIN}`,  full_name: 'Kweku Frimpong',   cohort: 'C' },
  { email: `adwoa.gyamfi${SEED_DOMAIN}`,    full_name: 'Adwoa Gyamfi',     cohort: 'C' },
  // Cohort D
  { email: `kwesi.boahene${SEED_DOMAIN}`,   full_name: 'Kwesi Boahene',    cohort: 'D' },
  { email: `esi.nyarko${SEED_DOMAIN}`,      full_name: 'Esi Nyarko',       cohort: 'D' },
  { email: `nana.bonsu${SEED_DOMAIN}`,      full_name: 'Nana Bonsu',       cohort: 'D' },
  { email: `akosua.tetteh${SEED_DOMAIN}`,   full_name: 'Akosua Tetteh',    cohort: 'D' },
  { email: `paakwesi.duodu${SEED_DOMAIN}`,  full_name: 'Paa Kwesi Duodu',  cohort: 'D' },
  // Cohort E
  { email: `yaa.amoah${SEED_DOMAIN}`,       full_name: 'Yaa Amoah',        cohort: 'E' },
  { email: `kwadwo.asiedu${SEED_DOMAIN}`,   full_name: 'Kwadwo Asiedu',    cohort: 'E' },
  { email: `ama.kyei${SEED_DOMAIN}`,        full_name: 'Ama Kyei',         cohort: 'E' },
  { email: `kofi.ntim${SEED_DOMAIN}`,       full_name: 'Kofi Ntim',        cohort: 'E' },
  { email: `abena.owusu${SEED_DOMAIN}`,     full_name: 'Abena Owusu',      cohort: 'E' },
];

const MODULES = [
  {
    title: 'Week 1 — Who Is a Disciple?',
    order_index: 0,
    items: [
      {
        title: 'What Is Discipleship?',
        type: 'text',
        content_text:
          'A disciple is one who follows Jesus, learns from Him, and reflects His character to the world. In Matthew 28:19-20, Jesus commands us to "go and make disciples of all nations, baptising them in the name of the Father and of the Son and of the Holy Spirit." Discipleship is not a programme — it is a way of life.',
        order_index: 0,
      },
      {
        title: 'Further Reading',
        type: 'link',
        content_url: 'https://www.gotquestions.org/what-is-a-disciple.html',
        order_index: 1,
      },
    ],
  },
  {
    title: 'Week 2 — The Example of Christ',
    order_index: 1,
    items: [
      {
        title: 'Servant Leadership in John 13',
        type: 'text',
        content_text:
          'Jesus modelled servant leadership in the most striking way — by washing His disciples\' feet (John 13:1-17), a task reserved for the lowest servant. He said, "I have set you an example that you should do as I have done for you." True leadership in the Kingdom is measured not by authority but by service.',
        order_index: 0,
      },
      {
        title: 'John 13 (NIV)',
        type: 'link',
        content_url: 'https://www.biblegateway.com/passage/?search=john+13&version=NIV',
        order_index: 1,
      },
    ],
  },
  {
    title: 'Week 3 — Prayer and Fasting',
    order_index: 2,
    items: [
      {
        title: 'The Lord\'s Prayer and Its Meaning',
        type: 'text',
        content_text:
          'In Matthew 6:9-13, Jesus gave us a model for prayer — not a formula but a framework: worship, surrender, petition, forgiveness, protection. Fasting accompanies prayer as a discipline that quiets the body\'s demands and heightens spiritual sensitivity. Together they are among the most powerful tools in the believer\'s life.',
        order_index: 0,
      },
      {
        title: 'Spiritual Disciplines Overview',
        type: 'link',
        content_url: 'https://www.gotquestions.org/spiritual-disciplines.html',
        order_index: 1,
      },
    ],
  },
  {
    title: 'Week 4 — Scripture: The Word of God',
    order_index: 3,
    items: [
      {
        title: '2 Timothy 3:16-17 — Why Scripture Matters',
        type: 'text',
        content_text:
          '"All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness, so that the servant of God may be thoroughly equipped for every good work." (2 Tim 3:16-17). A disciple who does not know the Word cannot accurately follow the One the Word reveals.',
        order_index: 0,
      },
      {
        title: 'Beginner Reading Plan',
        type: 'text',
        content_text:
          'Start here: Gospel of John → Romans → Ephesians → Psalms → Proverbs → Genesis. Read one chapter each morning. Highlight one verse per chapter that speaks directly to you.',
        order_index: 1,
      },
    ],
  },
  {
    title: 'Week 5 — Community and the Body of Christ',
    order_index: 4,
    items: [
      {
        title: 'Acts 2:42-47 — Life Together',
        type: 'text',
        content_text:
          'The early church "devoted themselves to the apostles\' teaching and to fellowship, to the breaking of bread and to prayer." Biblical community is not optional — it is the context in which growth, accountability, and mission happen. We are not designed to follow Christ alone.',
        order_index: 0,
      },
      {
        title: 'Acts 2:42-47 (NIV)',
        type: 'link',
        content_url:
          'https://www.biblegateway.com/passage/?search=acts+2%3A42-47&version=NIV',
        order_index: 1,
      },
    ],
  },
  {
    title: 'Week 6 — Sharing Your Faith',
    order_index: 5,
    items: [
      {
        title: 'Your Story Is Your Testimony',
        type: 'text',
        content_text:
          '1 Peter 3:15 — "Always be prepared to give an answer to everyone who asks you to give the reason for the hope that you have. But do this with gentleness and respect." Your personal story of encountering Jesus is your most credible evangelistic tool. No one can argue with what God has done in your life.',
        order_index: 0,
      },
      {
        title: 'The Bridge to Life — Simple Gospel Outline',
        type: 'link',
        content_url: 'https://www.navigators.org/resource/the-bridge-to-life/',
        order_index: 1,
      },
    ],
  },
];

const now = new Date();
const weeksAgo = (n) => new Date(now - n * 7 * 24 * 60 * 60 * 1000).toISOString();
const daysAgo  = (n) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();
const daysFromNow = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000).toISOString();

const ASSIGNMENTS = [
  {
    title: 'Personal Faith Reflection',
    description:
      'Write a 500-word reflection on your faith journey. When did you first encounter Jesus? How has your understanding of discipleship evolved since then?',
    week_number: 1,
    due_date: weeksAgo(3),
  },
  {
    title: 'Servant Leadership Case Study',
    description:
      'Identify a leader in scripture or church history who exemplified servant leadership. Write a 400-word essay analysing how their example shapes your own approach to leadership.',
    week_number: 2,
    due_date: weeksAgo(2),
  },
  {
    title: 'Prayer Journal (7 Days)',
    description:
      'Keep a 7-day prayer journal. Document what you prayed for, how you structured your time with God, and any answers or impressions you received. Submit as a single PDF.',
    week_number: 3,
    due_date: weeksAgo(1),
  },
  {
    title: 'Evangelism Report',
    description:
      'Share the gospel with at least one person this week. Write a 300-word report: who you shared with, what you said, how they responded, and what you learned from the experience.',
    week_number: 4,
    due_date: daysFromNow(5),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createUser({ email, full_name, role }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { role, full_name },
  });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);

  const { error: profErr } = await supabase.from('profiles').insert({
    id: data.user.id,
    email,
    full_name,
    role,
  });
  if (profErr) throw new Error(`profile ${email}: ${profErr.message}`);

  return data.user.id;
}

function log(msg) {
  process.stdout.write(`  ${msg}\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  Seeding Discipleship Academy 101...\n');

  // 1. Admin
  log('Creating admin…');
  const adminId = await createUser(ADMIN);

  // 2. Tutors
  log('Creating tutors…');
  const tutorIds = {};
  for (const t of TUTORS) {
    tutorIds[t.cohort] = await createUser(t);
  }

  // 3. Students
  log('Creating students…');
  const studentIds = {}; // { cohortLetter: [id, ...] }
  for (const s of STUDENTS) {
    const id = await createUser({ ...s, role: 'student' });
    if (!studentIds[s.cohort]) studentIds[s.cohort] = [];
    studentIds[s.cohort].push(id);
  }

  // 4. Class
  log('Creating class…');
  const { data: cls, error: clsErr } = await supabase
    .from('classes')
    .insert({
      tutor_id: adminId,
      title: 'Discipleship Academy 101',
      description:
        'A six-week foundational discipleship programme for university students. Covers identity in Christ, spiritual disciplines, community, and evangelism.',
    })
    .select()
    .single();
  if (clsErr) throw new Error(`class: ${clsErr.message}`);
  const classId = cls.id;

  // 5. Cohorts
  log('Creating cohorts A–E…');
  const cohortIds = {};
  for (const letter of ['A', 'B', 'C', 'D', 'E']) {
    const { data: cohort, error: cohortErr } = await supabase
      .from('cohorts')
      .insert({
        class_id: classId,
        ta_id: tutorIds[letter],
        name: `Cohort ${letter}`,
      })
      .select()
      .single();
    if (cohortErr) throw new Error(`cohort ${letter}: ${cohortErr.message}`);
    cohortIds[letter] = cohort.id;
  }

  // 6. Enrollments
  log('Enrolling students…');
  const enrollmentRows = [];
  for (const letter of ['A', 'B', 'C', 'D', 'E']) {
    for (const studentId of studentIds[letter]) {
      enrollmentRows.push({
        student_id: studentId,
        class_id: classId,
        cohort_id: cohortIds[letter],
      });
    }
  }
  const { error: enrollErr } = await supabase.from('enrollments').insert(enrollmentRows);
  if (enrollErr) throw new Error(`enrollments: ${enrollErr.message}`);

  // 7. Modules + items
  log('Creating modules…');
  for (const mod of MODULES) {
    const { data: m, error: mErr } = await supabase
      .from('modules')
      .insert({ class_id: classId, title: mod.title, order_index: mod.order_index })
      .select()
      .single();
    if (mErr) throw new Error(`module "${mod.title}": ${mErr.message}`);

    const items = mod.items.map((item) => ({ ...item, module_id: m.id }));
    const { error: itemErr } = await supabase.from('module_items').insert(items);
    if (itemErr) throw new Error(`items for "${mod.title}": ${itemErr.message}`);
  }

  // 8. Assignments
  log('Creating assignments…');
  const assignmentRows = ASSIGNMENTS.map((a) => ({ ...a, class_id: classId }));
  const { error: aErr } = await supabase.from('assignments').insert(assignmentRows);
  if (aErr) throw new Error(`assignments: ${aErr.message}`);

  // 9. Past attendance sessions with records
  log('Creating attendance sessions…');
  const sessions = [
    { started_at: weeksAgo(3), pin_code: '7241', expires_at: weeksAgo(3) },
    { started_at: weeksAgo(2), pin_code: '3819', expires_at: weeksAgo(2) },
    { started_at: daysAgo(6),  pin_code: '5504', expires_at: daysAgo(6)  },
  ];

  for (const sess of sessions) {
    const { data: s, error: sErr } = await supabase
      .from('attendance_sessions')
      .insert({ class_id: classId, is_active: false, ...sess })
      .select()
      .single();
    if (sErr) throw new Error(`session: ${sErr.message}`);

    // 80% attendance — skip the last student in each cohort
    const records = [];
    for (const letter of ['A', 'B', 'C', 'D', 'E']) {
      const cohortStudents = studentIds[letter];
      for (let i = 0; i < cohortStudents.length - 1; i++) {
        records.push({
          session_id: s.id,
          student_id: cohortStudents[i],
          checked_in_at: new Date(
            new Date(sess.started_at).getTime() + (5 + i * 3) * 60 * 1000
          ).toISOString(),
        });
      }
    }
    const { error: rErr } = await supabase.from('attendance_records').insert(records);
    if (rErr) throw new Error(`records: ${rErr.message}`);
  }

  console.log('\n✅  Seed complete.\n');
  console.log('   Class:    Discipleship Academy 101');
  console.log('   Cohorts:  A, B, C, D, E (5 students each)');
  console.log('   Modules:  6 (Weeks 1–6)');
  console.log('   Assign.:  4');
  console.log('   Sessions: 3 past (80% attendance)\n');
  console.log('   To remove all seeded data run:  node ../supabase/seed-delete.js\n');
}

main().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
