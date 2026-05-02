'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useRoster, useClass } from '@/lib/hooks/useClasses'
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

function attendanceBg(pct: number): string {
  if (pct >= 80) return '#DCFCE7'
  if (pct >= 60) return '#FEF9C3'
  return '#FEE2E2'
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
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)

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

  const handleCopyCode = () => {
    if (!inviteCode) return
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    toast.success('Class code copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = roster.filter((r) =>
    r.student.full_name.toLowerCase().includes(search.toLowerCase()) ||
    r.student.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-3xl">
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

      <h1 className="text-[20px] font-medium text-[#111] mb-5">Roster</h1>

      {inviteCode && (
        <div className="flex items-center justify-between bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl px-5 py-4 mb-6">
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

      <div className="relative mb-4">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 text-[13px] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#8B1A2F] transition-colors"
        />
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
          <div className="grid grid-cols-[1fr_120px_100px_100px] gap-4 px-5 py-3 bg-[#F8F8F8] border-b border-[#E5E5E5]">
            <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">Student</span>
            <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">Enrolled</span>
            <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider text-right">Attendance</span>
            <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider text-right">Submissions</span>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-[#9CA3AF]">No students match your search</div>
          ) : (
            filtered.map((entry, i) => (
              <div
                key={entry.student.id}
                className={`grid grid-cols-[1fr_120px_100px_100px] gap-4 px-5 py-3.5 items-center ${
                  i < filtered.length - 1 ? 'border-b border-[#F3F4F6]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#F5E6EA] flex items-center justify-center text-[11px] font-medium text-[#8B1A2F] shrink-0">
                    {entry.student.avatar_initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#111] truncate">{entry.student.full_name}</p>
                    <p className="text-[11px] text-[#9CA3AF] truncate">{entry.student.email}</p>
                  </div>
                </div>
                <span className="text-[12px] text-[#6B7280]">
                  {format(new Date(entry.enrolled_at), 'MMM d, yyyy')}
                </span>
                <div className="flex justify-end">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: attendanceBg(entry.attendance_pct),
                      color: attendanceColor(entry.attendance_pct),
                    }}
                  >
                    {Math.round(entry.attendance_pct)}%
                  </span>
                </div>
                <div className="flex justify-end">
                  <span className="text-[12px] text-[#6B7280]">{entry.submission_count}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
