'use client'

import { use, useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  useAddStudentToClass,
  useClass,
  useRemoveStudentFromClass,
  useRoster,
  useSearchableStudents,
} from '@/lib/hooks/useClasses'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { InlineError } from '@/components/ui/shared/InlineError'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'

function attendanceColor(pct: number): string {
  if (pct >= 80) return '#166534'
  if (pct >= 60) return '#854D0E'
  return '#991B1B'
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function RosterPageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params)
  const router = useRouter()
  const {
    data: classData,
    isLoading: isClassLoading,
    isError: isClassError,
    error: classError,
    refetch: refetchClass,
  } = useClass(classId)
  const {
    data: roster = [],
    isLoading: isRosterLoading,
    isError: isRosterError,
    error: rosterError,
    refetch: refetchRoster,
  } = useRoster(classId)
  const addStudent = useAddStudentToClass(classId)
  const removeStudent = useRemoveStudentFromClass(classId)

  const toastIdRef = useRef<string | number | null>(null)
  const didSuccessRef = useRef(false)

  useEffect(() => {
    router.prefetch(`/admin/classes/${classId}/assignments`)
    router.prefetch(`/admin/classes/${classId}/attendance`)
    router.prefetch(`/admin/classes/${classId}/modules`)
  }, [classId, router])

  useEffect(() => {
    const isLoading = isClassLoading || isRosterLoading
    if (isLoading) {
      if (!toastIdRef.current) {
        toastIdRef.current = toast.loading('Loading roster...')
      }
    } else if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
      if (!didSuccessRef.current) {
        didSuccessRef.current = true
        toast.success('Roster loaded')
      }
    }
  }, [isClassLoading, isRosterLoading])

  const inviteCode = classData?.invite_code ?? ''
  const [copied, setCopied] = useState(false)
  const [rosterSearch, setRosterSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [addingStudentId, setAddingStudentId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null)
  const {
    data: searchableStudents = [],
    isFetching: isSearchingStudents,
  } = useSearchableStudents(classId, studentSearch)

  const handleCopyCode = () => {
    if (!inviteCode) return
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    toast.success('Class code copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredRoster = useMemo(() => {
    const query = rosterSearch.trim().toLowerCase()
    if (!query) return roster
    return roster.filter((entry) => {
      const name = entry.student.full_name.toLowerCase()
      const email = entry.student.email.toLowerCase()
      return name.includes(query) || email.includes(query)
    })
  }, [roster, rosterSearch])

  const handleAddStudent = async (studentId: string, studentName: string) => {
    setAddingStudentId(studentId)
    try {
      await addStudent.mutateAsync(studentId)
      setStudentSearch('')
      toast.success(`${studentName} added to roster`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to add student')
    } finally {
      setAddingStudentId(null)
    }
  }

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    setRemovingStudentId(studentId)
    try {
      await removeStudent.mutateAsync(studentId)
      setConfirmRemoveId(null)
      toast.success(`${studentName} removed from roster`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to remove student')
    } finally {
      setRemovingStudentId(null)
    }
  }

  // Calculate summary stats
  const avgAttendance = roster.length > 0
    ? Math.round(roster.reduce((sum, r) => sum + r.attendance_pct, 0) / roster.length)
    : null

  const totalSubmissions = roster.reduce((sum, r) => sum + (r.submission_count || 0), 0)

  const summaryStats = [
    { label: 'Members', value: roster.length.toString() },
    {
      label: 'Avg Attendance',
      value: avgAttendance === null ? '—' : `${avgAttendance}%`,
      accentColor: '#8B1A2F'
    },
    {
      label: 'Total Submissions',
      value: totalSubmissions.toString(),
      accentColor: '#8B1A2F'
    },
  ]

  return (
    <div className="p-4 sm:p-8">
      <nav className="flex items-center gap-2 text-[12px] text-[#9CA3AF] mb-6">
        <button
          onClick={() => router.push('/admin/classes')}
          onMouseEnter={() => router.prefetch('/admin/classes')}
          className="hover:text-[#111] transition-colors"
        >
          Classes
        </button>
        <span>/</span>
        <button
          onClick={() => router.push(`/admin/classes/${classId}/modules`)}
          onMouseEnter={() => router.prefetch(`/admin/classes/${classId}/modules`)}
          className="hover:text-[#111] transition-colors"
        >
          {isClassLoading ? (
            <span className="inline-block w-24 h-3 bg-[#E5E5E5] rounded animate-pulse align-middle" />
          ) : (
            classData?.title ?? '...'
          )}
        </button>
        <span>/</span>
        <span className="text-[#111]">Roster</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-medium text-[#111]">Roster</h1>
        <span className="text-[13px] text-[#9CA3AF]">{roster.length} students</span>
      </div>

      {inviteCode && (
        <div className="flex items-center justify-between bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-5 py-4 mb-8">
          <div>
            <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wider mb-0.5">Invite Code</p>
            <p className="text-[22px] font-mono font-medium text-[#111] tracking-[0.15em]">{inviteCode}</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 h-9 px-4 text-[13px] border border-[#E5E5E5] rounded-lg hover:border-[#8B1A2F] hover:text-[#8B1A2F] transition-colors text-[#6B7280]"
          >
            {copied ? <><CheckIcon /><span>Copied</span></> : <><CopyIcon /><span>Copy code</span></>}
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr] mb-8">
        <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-[#F8F8F8] border-b border-[#E5E5E5]">
            <p className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Search roster</p>
          </div>
          <div className="p-4">
            <input
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full h-9 rounded-lg border border-[#E5E5E5] bg-white px-3 text-[13px] text-[#111] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#8B1A2F]"
            />
            <p className="mt-2 text-[12px] text-[#9CA3AF]">
              {rosterSearch.trim()
                ? `${filteredRoster.length} of ${roster.length} students shown`
                : 'Filter the current class roster.'}
            </p>
          </div>
        </div>

        <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-[#F8F8F8] border-b border-[#E5E5E5]">
            <p className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wider">Add student</p>
          </div>
          <div className="p-4 space-y-3">
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search registered students"
              className="w-full h-9 rounded-lg border border-[#E5E5E5] bg-white px-3 text-[13px] text-[#111] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#8B1A2F]"
            />

            {studentSearch.trim().length < 2 ? (
              <p className="text-[12px] text-[#9CA3AF]">Type at least 2 characters to find students not yet enrolled.</p>
            ) : isSearchingStudents ? (
              <p className="text-[12px] text-[#9CA3AF]">Searching students...</p>
            ) : searchableStudents.length === 0 ? (
              <p className="text-[12px] text-[#9CA3AF]">No available students match your search.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-[#E5E5E5]">
                {searchableStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 border-b border-[#F3F4F6] last:border-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#F5E6EA] flex items-center justify-center text-[10px] font-medium text-[#8B1A2F] shrink-0">
                        {student.avatar_initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-[#111]">{student.full_name}</p>
                        <p className="truncate text-[11px] text-[#9CA3AF]">{student.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddStudent(student.id, student.full_name)}
                      disabled={addingStudentId === student.id}
                      className="h-8 shrink-0 rounded-lg bg-[#111] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#8B1A2F] disabled:opacity-50"
                    >
                      {addingStudentId === student.id ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {summaryStats.map((stat, i) => (
          <div
            key={i}
            className="bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-4 py-4"
          >
            <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wider mb-2">
              {stat.label}
            </p>
            <p
              className="text-[24px] font-medium"
              style={{ color: stat.accentColor || '#111111' }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {(isClassError || isRosterError) && (
        <InlineError
          message={
            (classError || rosterError) instanceof ApiError
              ? (classError || rosterError as ApiError).message
              : 'Unable to load roster'
          }
          onRetry={() => {
            refetchClass()
            refetchRoster()
          }}
        />
      )}

      {(isClassLoading || isRosterLoading) && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}
        </div>
      )}

      {!(isClassLoading || isRosterLoading) && roster.length === 0 && (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          title="No students yet"
          description="Share the invite code with your students to get started"
        />
      )}

      {!(isClassLoading || isRosterLoading) && roster.length > 0 && (
        <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr] sm:grid-cols-[1fr_80px_80px_96px] gap-4 px-5 py-3 bg-[#F8F8F8] border-b border-[#E5E5E5]">
            <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">Member</span>
            <span className="hidden sm:block text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider text-right">Attendance</span>
            <span className="hidden sm:block text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider text-right">Submitted</span>
            <span className="hidden sm:block text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider text-right">Action</span>
          </div>

          {filteredRoster.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-[#9CA3AF]">
              No students match your search.
            </p>
          ) : filteredRoster.map((entry, i) => (
            <div
              key={entry.student.id}
              className={`grid grid-cols-[1fr] sm:grid-cols-[1fr_80px_80px_96px] gap-4 px-5 py-3.5 items-center ${
                i < filteredRoster.length - 1 ? 'border-b border-[#F3F4F6]' : ''
              } hover:bg-[#FAFAFA] transition-colors`}
            >
              {/* Member identity */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#F5E6EA] flex items-center justify-center text-[11px] font-medium text-[#8B1A2F] shrink-0">
                  {entry.student.avatar_initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#111] truncate">{entry.student.full_name}</p>
                  <p className="text-[11px] text-[#9CA3AF] truncate">{entry.student.email}</p>
                </div>
              </div>

              {/* Attendance percentage */}
              <div className="hidden sm:block text-right">
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: attendanceColor(entry.attendance_pct),
                  }}
                >
                  {Math.round(entry.attendance_pct)}%
                </span>
              </div>

              {/* Submission count */}
              <div className="hidden sm:block text-right">
                <span className="text-[13px] text-[#111]">
                  {entry.submission_count}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2">
                {confirmRemoveId === entry.student.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleRemoveStudent(entry.student.id, entry.student.full_name)}
                      disabled={removingStudentId === entry.student.id}
                      className="h-7 rounded-md bg-[#8B1A2F] px-2.5 text-[11px] font-medium text-white disabled:opacity-50"
                    >
                      {removingStudentId === entry.student.id ? 'Removing...' : 'Yes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveId(null)}
                      disabled={removingStudentId === entry.student.id}
                      className="h-7 rounded-md border border-[#E5E5E5] px-2.5 text-[11px] text-[#6B7280] transition-colors hover:bg-[#F8F8F8] disabled:opacity-50"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveId(entry.student.id)}
                    className="h-7 rounded-md border border-[#E5E5E5] px-2.5 text-[11px] text-[#6B7280] transition-colors hover:border-[#8B1A2F] hover:text-[#8B1A2F]"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
