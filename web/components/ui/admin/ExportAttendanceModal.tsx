'use client'

import { useState, useMemo } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'sonner'
import {
  useStudentAttendanceSummary,
  useSessionRecords,
  AttendanceSession,
} from '@/lib/hooks/useAttendance'
import { exportSingleSession, exportMultiSession } from '@/lib/utils/exportAttendance'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'
import { ApiError } from '@/lib/api'

type Range = 'session' | 'week' | 'month' | 'all'

interface RosterStudent {
  id: string
  full_name: string
  avatar_initials: string
}

interface Props {
  classId: string
  classTitle: string
  sessions: AttendanceSession[]
  roster: RosterStudent[]
  onClose: () => void
}

const RANGES: { id: Range; label: string }[] = [
  { id: 'session', label: 'Session' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
]

function getRangeDates(range: Range): { from?: string; to?: string; label: string } {
  const now = new Date()
  if (range === 'week') {
    const from = startOfWeek(now, { weekStartsOn: 1 }).toISOString()
    const to = endOfWeek(now, { weekStartsOn: 1 }).toISOString()
    return { from, to, label: `Week of ${format(startOfWeek(now, { weekStartsOn: 1 }), 'MMM d, yyyy')}` }
  }
  if (range === 'month') {
    const from = startOfMonth(now).toISOString()
    const to = endOfMonth(now).toISOString()
    return { from, to, label: format(now, 'MMMM yyyy') }
  }
  return { label: 'All time' }
}

// Sub-component to fetch records for a specific session export
function SessionExporter({
  sessionId,
  classTitle,
  session,
  selectedStudentIds,
  onDone,
}: {
  sessionId: string
  classTitle: string
  session: AttendanceSession
  selectedStudentIds?: Set<string>
  onDone: () => void
}) {
  const { data: records, isLoading, isError } = useSessionRecords(sessionId)

  if (isError) {
    toast.error('Failed to load session records')
    onDone()
    return null
  }

  if (!isLoading && records) {
    exportSingleSession(session, classTitle, records, selectedStudentIds)
    onDone()
  }

  return null
}

export default function ExportAttendanceModal({
  classId,
  classTitle,
  sessions,
  roster,
  onClose,
}: Props) {
  const [range, setRange] = useState<Range>('session')
  const [selectedSessionId, setSelectedSessionId] = useState(
    sessions.find(s => !s.is_active)?.id ?? '',
  )
  const [studentFilter, setStudentFilter] = useState<'all' | 'select'>('all')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [generating, setGenerating] = useState(false)
  const [fetchingSession, setFetchingSession] = useState(false)

  const pastSessions = useMemo(
    () =>
      sessions
        .filter(s => !s.is_active)
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()),
    [sessions],
  )

  const { from, to, label: rangeLabel } = getRangeDates(range)

  const filteredSessions = useMemo(() => {
    if (range === 'all') return pastSessions
    if (range === 'session') return pastSessions
    return pastSessions.filter(s => {
      const t = new Date(s.started_at).getTime()
      return (!from || t >= new Date(from).getTime()) && (!to || t <= new Date(to).getTime())
    })
  }, [range, pastSessions, from, to])

  const { data: summary, isLoading: summaryLoading } = useStudentAttendanceSummary(classId, {
    from,
    to,
    enabled: range !== 'session',
  })

  const filteredRoster = useMemo(
    () => roster.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase())),
    [roster, search],
  )

  function toggleStudent(id: string) {
    setSelectedStudentIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedStudentIds.size === roster.length) {
      setSelectedStudentIds(new Set())
    } else {
      setSelectedStudentIds(new Set(roster.map(s => s.id)))
    }
  }

  const handleGenerate = async () => {
    const studentFilter_ = studentFilter === 'all' ? undefined : selectedStudentIds
    if (studentFilter === 'select' && selectedStudentIds.size === 0) {
      toast.error('Select at least one student')
      return
    }

    if (range === 'session') {
      if (!selectedSessionId) {
        toast.error('Select a session')
        return
      }
      setFetchingSession(true)
      return
    }

    // Range report
    setGenerating(true)
    try {
      if (!summary) {
        toast.error('Summary data not ready — try again')
        return
      }
      exportMultiSession(filteredSessions, summary.students, classTitle, rangeLabel, studentFilter_)
      onClose()
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const selectedSession = pastSessions.find(s => s.id === selectedSessionId)

  return (
    <>
      {/* Records fetcher — mounts only when needed */}
      {fetchingSession && selectedSession && (
        <SessionExporter
          sessionId={selectedSessionId}
          classTitle={classTitle}
          session={selectedSession}
          selectedStudentIds={studentFilter === 'select' ? selectedStudentIds : undefined}
          onDone={() => {
            setFetchingSession(false)
            onClose()
          }}
        />
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
            <div>
              <p className="text-[14px] font-medium text-[#111]">Export Attendance</p>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">{classTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F8F8F8] text-[#9CA3AF] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
            {/* Time range */}
            <div>
              <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">Time range</p>
              <div className="grid grid-cols-4 gap-1.5">
                {RANGES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRange(r.id)}
                    className={`h-9 rounded-lg text-[12px] font-medium transition-colors ${
                      range === r.id
                        ? 'bg-[#111] text-white'
                        : 'bg-[#F8F8F8] text-[#6B7280] hover:bg-[#F0F0F0]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Session picker */}
            {range === 'session' && (
              <div>
                <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">Session</p>
                {pastSessions.length === 0 ? (
                  <p className="text-[13px] text-[#9CA3AF]">No past sessions</p>
                ) : (
                  <select
                    value={selectedSessionId}
                    onChange={e => setSelectedSessionId(e.target.value)}
                    className="w-full h-9 border border-[#E5E5E5] rounded-lg px-3 text-[13px] text-[#111] bg-white focus:outline-none focus:border-[#111]"
                  >
                    {pastSessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {format(new Date(s.started_at), 'EEE, MMM d, yyyy · h:mm a')}
                        {` — ${s.present_count ?? 0} present`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Range summary */}
            {range !== 'session' && (
              <div className="flex items-center gap-3 px-3 py-2.5 bg-[#F8F8F8] rounded-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-[12px] text-[#6B7280]">
                  {summaryLoading
                    ? 'Loading sessions…'
                    : `${filteredSessions.length} session${filteredSessions.length !== 1 ? 's' : ''} · ${rangeLabel}`}
                </span>
              </div>
            )}

            {/* Student filter */}
            <div>
              <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">Students</p>
              <div className="flex gap-2 mb-3">
                {(['all', 'select'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStudentFilter(f)}
                    className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors ${
                      studentFilter === f
                        ? 'bg-[#111] text-white'
                        : 'bg-[#F8F8F8] text-[#6B7280] hover:bg-[#F0F0F0]'
                    }`}
                  >
                    {f === 'all' ? 'All students' : 'Select students'}
                  </button>
                ))}
              </div>

              {studentFilter === 'select' && (
                <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
                  {/* Search + select-all row */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5E5E5] bg-white sticky top-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="flex-1 text-[13px] outline-none text-[#111] placeholder-[#9CA3AF] min-w-0"
                    />
                    <button
                      onClick={toggleAll}
                      className="text-[11px] text-[#6B7280] hover:text-[#111] transition-colors whitespace-nowrap"
                    >
                      {selectedStudentIds.size === roster.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto">
                    {filteredRoster.length === 0 ? (
                      <p className="text-[12px] text-[#9CA3AF] px-3 py-3">No students match</p>
                    ) : (
                      filteredRoster.map(s => (
                        <div
                          key={s.id}
                          onClick={() => toggleStudent(s.id)}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F8F8F8] cursor-pointer transition-colors"
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                              selectedStudentIds.has(s.id)
                                ? 'bg-[#111] border-[#111]'
                                : 'border-[#D1D5DB]'
                            }`}
                          >
                            {selectedStudentIds.has(s.id) && (
                              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <div className="w-7 h-7 rounded-full bg-[#F8F8F8] flex items-center justify-center text-[10px] font-medium text-[#111] flex-shrink-0">
                            {s.avatar_initials}
                          </div>
                          <span className="text-[13px] text-[#111] truncate">{s.full_name}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {selectedStudentIds.size > 0 && (
                    <div className="px-3 py-2 border-t border-[#E5E5E5] bg-[#F8F8F8]">
                      <span className="text-[11px] text-[#6B7280]">
                        {selectedStudentIds.size} student{selectedStudentIds.size !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#E5E5E5]">
            <button
              onClick={handleGenerate}
              disabled={
                generating ||
                fetchingSession ||
                summaryLoading ||
                (range === 'session' && !selectedSessionId) ||
                (studentFilter === 'select' && selectedStudentIds.size === 0)
              }
              className="w-full h-10 bg-[#111] text-white rounded-lg text-[13px] font-medium hover:bg-[#8B1A2F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {(generating || fetchingSession) && <LoadingSpinner className="text-white" />}
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
