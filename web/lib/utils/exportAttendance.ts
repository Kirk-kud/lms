import { format } from 'date-fns'
import type { AttendanceSession, SessionRecords, StudentAttendanceSummary } from '../hooks/useAttendance'

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;color:#111;background:#fff;padding:48px;max-width:860px;margin:0 auto}
@page{size:A4;margin:15mm 18mm}
@media print{body{padding:0}.no-print{display:none!important}}

.kicker{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#8B1A2F;margin-bottom:10px}
.report-title{font-size:24px;font-weight:600;line-height:1.2}
.report-sub{font-size:13px;color:#6B7280;margin-top:5px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;margin-bottom:28px;border-bottom:.5px solid #E5E5E5}
.ts{font-size:11px;color:#9CA3AF;text-align:right;line-height:1.7}

.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#E5E5E5;border:.5px solid #E5E5E5;border-radius:10px;overflow:hidden;margin-bottom:28px}
.stat{background:#fff;padding:16px 20px}
.sv{font-size:26px;font-weight:600;line-height:1}
.sl{font-size:11px;color:#6B7280;margin-top:4px}
.sp .sv{color:#166534}
.sa .sv{color:#991B1B}

.prog-wrap{margin-bottom:28px}
.prog-meta{display:flex;justify-content:space-between;font-size:12px;color:#6B7280;margin-bottom:7px}
.prog-track{height:5px;background:#F3F4F6;border-radius:3px;overflow:hidden}
.prog-fill{height:100%;background:#8B1A2F;border-radius:3px}

/* Session detail columns */
.cols{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.col-hd{display:flex;align-items:center;gap:7px;padding-bottom:10px;border-bottom:.5px solid #E5E5E5;margin-bottom:12px}
.dot{width:7px;height:7px;border-radius:50%}
.dot-p{background:#166534}.dot-a{background:#991B1B}
.col-lbl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em}
.lbl-p{color:#166534}.lbl-a{color:#991B1B}
.col-ct{font-size:11px;color:#9CA3AF;margin-left:auto}
.stud{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:.5px solid #F9FAFB}
.stud:last-child{border-bottom:none}
.av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:600;flex-shrink:0}
.av-p{background:#DCFCE7;color:#166534}
.av-a{background:#FEE2E2;color:#991B1B}
.si{flex:1;min-width:0}
.sn{font-size:12px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.st{font-size:10px;color:#9CA3AF;margin-top:1px}
.empty{font-size:12px;color:#9CA3AF;padding:4px 0}

/* Tables */
table{width:100%;border-collapse:collapse;font-size:13px}
.tbl-wrap{margin-bottom:32px}
.tbl-title{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;margin-bottom:12px}
thead tr{border-bottom:.5px solid #E5E5E5}
th{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#9CA3AF;padding:0 12px 10px 0;text-align:left;white-space:nowrap}
th:last-child,td:last-child{text-align:right;padding-right:0}
td{padding:10px 12px 10px 0;border-bottom:.5px solid #F3F4F6;vertical-align:middle}
tr:last-child td{border-bottom:none}
.pill{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
.pill-p{background:#DCFCE7;color:#166534}.pill-a{background:#FEE2E2;color:#991B1B}
.rate{font-weight:600}
.r-hi{color:#166534}.r-md{color:#B45309}.r-lo{color:#991B1B}
.totals td{font-weight:600;border-top:.5px solid #E5E5E5;border-bottom:none;padding-top:14px}

/* Bar in student table */
.bar-wrap{display:flex;align-items:center;gap:8px}
.bar-track{flex:1;height:4px;background:#F3F4F6;border-radius:2px;overflow:hidden;min-width:60px}
.bar-fill{height:100%;background:#8B1A2F;border-radius:2px}

.section-gap{margin-top:36px}
.footer{margin-top:36px;padding-top:14px;border-top:.5px solid #E5E5E5;display:flex;justify-content:space-between;font-size:11px;color:#9CA3AF}
.print-fab{position:fixed;bottom:28px;right:28px;display:flex;align-items:center;gap:7px;padding:10px 18px;background:#111;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer}
.print-fab:hover{background:#8B1A2F}
`

const FAB = `<button class="print-fab no-print" onclick="window.print()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Save as PDF</button>`

function rateClass(pct: number) {
  return pct >= 75 ? 'r-hi' : pct >= 50 ? 'r-md' : 'r-lo'
}

function open(html: string) {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
}

function wrap(title: string, body: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(title)}</title><style>${CSS}</style></head><body>${FAB}${body}</body></html>`
}

// ─── Single session ────────────────────────────────────────────────────────────

export function exportSingleSession(
  session: AttendanceSession,
  classTitle: string,
  records: SessionRecords,
  selectedStudentIds?: Set<string>,
) {
  const present = selectedStudentIds
    ? records.present.filter(r => selectedStudentIds.has(r.student.id))
    : records.present
  const absent = selectedStudentIds
    ? records.absent.filter(s => selectedStudentIds.has(s.id))
    : records.absent

  const total = present.length + absent.length
  const pct = total > 0 ? Math.round((present.length / total) * 100) : 0

  const sessionDate = format(new Date(session.started_at), 'EEEE, MMMM d, yyyy')
  const sessionTime = format(new Date(session.started_at), 'h:mm a')

  const presentRows = present.length
    ? present.map(r => `<div class="stud"><div class="av av-p">${esc(r.student.avatar_initials)}</div><div class="si"><div class="sn">${esc(r.student.full_name)}</div>${r.checked_in_at ? `<div class="st">Checked in ${format(new Date(r.checked_in_at), 'h:mm a')}</div>` : ''}</div></div>`).join('')
    : '<div class="empty">No one checked in</div>'

  const absentRows = absent.length
    ? absent.map(s => `<div class="stud"><div class="av av-a">${esc(s.avatar_initials)}</div><div class="si"><div class="sn">${esc(s.full_name)}</div></div></div>`).join('')
    : '<div class="empty">Everyone was present</div>'

  const studentNote = selectedStudentIds
    ? `<span style="font-size:11px;color:#9CA3AF"> — ${selectedStudentIds.size} selected student${selectedStudentIds.size !== 1 ? 's' : ''}</span>`
    : ''

  const body = `
<div class="hdr">
  <div>
    <div class="kicker">Love Inc LMS</div>
    <div class="report-title">${esc(classTitle)}${studentNote}</div>
    <div class="report-sub">Attendance Report &nbsp;·&nbsp; ${sessionDate} &nbsp;·&nbsp; ${sessionTime}</div>
  </div>
  <div class="ts">Exported<br/>${format(new Date(), 'MMM d, yyyy · h:mm a')}</div>
</div>
<div class="stats">
  <div class="stat sp"><div class="sv">${present.length}</div><div class="sl">Present</div></div>
  <div class="stat sa"><div class="sv">${absent.length}</div><div class="sl">Absent</div></div>
  <div class="stat"><div class="sv">${pct}%</div><div class="sl">Attendance rate</div></div>
  <div class="stat"><div class="sv">${total}</div><div class="sl">Students</div></div>
</div>
<div class="prog-wrap">
  <div class="prog-meta"><span>Attendance rate</span><span>${present.length} of ${total} students</span></div>
  <div class="prog-track"><div class="prog-fill" style="width:${pct}%"></div></div>
</div>
<div class="cols">
  <div>
    <div class="col-hd"><div class="dot dot-p"></div><div class="col-lbl lbl-p">Present</div><div class="col-ct">${present.length}</div></div>
    ${presentRows}
  </div>
  <div>
    <div class="col-hd"><div class="dot dot-a"></div><div class="col-lbl lbl-a">Absent</div><div class="col-ct">${absent.length}</div></div>
    ${absentRows}
  </div>
</div>
<div class="footer"><span>Love Inc LMS &nbsp;·&nbsp; Attendance Report</span><span>${sessionDate}</span></div>`

  open(wrap(`Attendance — ${classTitle}`, body))
}

// ─── Multi-session range ───────────────────────────────────────────────────────

export function exportMultiSession(
  sessions: AttendanceSession[],
  studentSummary: StudentAttendanceSummary[],
  classTitle: string,
  rangeLabel: string,
  selectedStudentIds?: Set<string>,
) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  )

  const filteredStudents = selectedStudentIds
    ? studentSummary.filter(s => selectedStudentIds.has(s.student.id))
    : studentSummary

  const totalPresent = sorted.reduce((s, x) => s + (x.present_count ?? 0), 0)
  const totalAbsent = sorted.reduce((s, x) => s + (x.absent_count ?? 0), 0)
  const totalAll = totalPresent + totalAbsent
  const overallPct = totalAll > 0 ? Math.round((totalPresent / totalAll) * 100) : 0

  const sessionRows = sorted.map(s => {
    const p = s.present_count ?? 0
    const a = s.absent_count ?? 0
    const total = p + a
    const pct = total > 0 ? Math.round((p / total) * 100) : 0
    return `<tr>
      <td>${format(new Date(s.started_at), 'EEE, MMM d, yyyy')}</td>
      <td>${format(new Date(s.started_at), 'h:mm a')}</td>
      <td><span class="pill pill-p">${p}</span></td>
      <td><span class="pill pill-a">${a}</span></td>
      <td class="rate ${rateClass(pct)}">${pct}%</td>
    </tr>`
  }).join('')

  const studentRows = filteredStudents.map(({ student, sessions_attended, sessions_total, rate }) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:9px">
          <div class="av" style="background:${rate >= 75 ? '#DCFCE7' : rate >= 50 ? '#FEF3C7' : '#FEE2E2'};color:${rate >= 75 ? '#166534' : rate >= 50 ? '#92400E' : '#991B1B'}">${esc(student.avatar_initials)}</div>
          <span>${esc(student.full_name)}</span>
        </div>
      </td>
      <td>${sessions_attended} / ${sessions_total}</td>
      <td>
        <div class="bar-wrap">
          <div class="bar-track"><div class="bar-fill" style="width:${rate}%"></div></div>
          <span class="rate ${rateClass(rate)}">${rate}%</span>
        </div>
      </td>
    </tr>`).join('')

  const studentNote = selectedStudentIds
    ? ` — ${selectedStudentIds.size} selected student${selectedStudentIds.size !== 1 ? 's' : ''}`
    : ''

  const body = `
<div class="hdr">
  <div>
    <div class="kicker">Love Inc LMS</div>
    <div class="report-title">${esc(classTitle)}${esc(studentNote)}</div>
    <div class="report-sub">Attendance Report &nbsp;·&nbsp; ${esc(rangeLabel)}</div>
  </div>
  <div class="ts">Exported<br/>${format(new Date(), 'MMM d, yyyy · h:mm a')}</div>
</div>
<div class="stats">
  <div class="stat"><div class="sv">${sorted.length}</div><div class="sl">Sessions</div></div>
  <div class="stat sp"><div class="sv">${totalPresent}</div><div class="sl">Total present</div></div>
  <div class="stat sa"><div class="sv">${totalAbsent}</div><div class="sl">Total absent</div></div>
  <div class="stat"><div class="sv">${overallPct}%</div><div class="sl">Overall rate</div></div>
</div>
<div class="prog-wrap">
  <div class="prog-meta"><span>Overall attendance rate</span><span>${sorted.length} session${sorted.length !== 1 ? 's' : ''}</span></div>
  <div class="prog-track"><div class="prog-fill" style="width:${overallPct}%"></div></div>
</div>

<div class="tbl-wrap">
  <div class="tbl-title">Sessions</div>
  <table>
    <thead><tr><th>Date</th><th>Time</th><th>Present</th><th>Absent</th><th>Rate</th></tr></thead>
    <tbody>
      ${sessionRows}
      <tr class="totals">
        <td colspan="2">Total (${sorted.length} session${sorted.length !== 1 ? 's' : ''})</td>
        <td><span class="pill pill-p">${totalPresent}</span></td>
        <td><span class="pill pill-a">${totalAbsent}</span></td>
        <td class="rate ${rateClass(overallPct)}">${overallPct}%</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="tbl-wrap section-gap">
  <div class="tbl-title">Student attendance</div>
  <table>
    <thead><tr><th>Student</th><th>Sessions</th><th>Attendance rate</th></tr></thead>
    <tbody>${studentRows}</tbody>
  </table>
</div>

<div class="footer"><span>Love Inc LMS &nbsp;·&nbsp; Attendance Report</span><span>${esc(rangeLabel)}</span></div>`

  open(wrap(`Attendance Report — ${classTitle}`, body))
}
