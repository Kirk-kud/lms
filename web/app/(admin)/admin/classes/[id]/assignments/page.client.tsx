'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format, isPast } from 'date-fns'
import {
  useAssignments,
  useCreateAssignment,
  useDeleteAssignment,
  useAssignmentSubmissions,
  Assignment,
} from '@/lib/hooks/useAssignments'
import { useClass } from '@/lib/hooks/useClasses'
import { StatusBadge } from '@/components/ui/shared/Badge'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { InlineError } from '@/components/ui/shared/InlineError'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

function CreateAssignmentModal({
  classId,
  open,
  onClose,
  nextWeek,
}: {
  classId: string
  open: boolean
  onClose: () => void
  nextWeek: number
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [weekNumber, setWeekNumber] = useState(nextWeek)
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [calOpen, setCalOpen] = useState(false)
  const createAssignment = useCreateAssignment()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !dueDate) return
    try {
      await createAssignment.mutateAsync({
        class_id: classId,
        title: title.trim(),
        description: description.trim() || undefined,
        week_number: weekNumber,
        due_date: dueDate.toISOString(),
      })
      setTitle('')
      setDescription('')
      setDueDate(undefined)
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to create assignment')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '36px', borderRadius: '8px',
    border: '0.5px solid #E5E5E5', fontSize: '13px',
    padding: '0 10px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium">New assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">Title</label>
            <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')} />
          </div>
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">Description <span className="text-[#9CA3AF]">(optional)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'none' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-[#6B6B6B] mb-1">Week</label>
              <input type="number" min={1} required value={weekNumber} onChange={(e) => setWeekNumber(Number(e.target.value))} style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')} />
            </div>
            <div>
              <label className="block text-[12px] text-[#6B6B6B] mb-1">Due date</label>
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger
                  className="w-full h-9 px-3 text-[13px] text-left border border-[#E5E5E5] rounded-lg hover:border-[#8B1A2F] transition-colors"
                  style={{ color: dueDate ? '#111' : '#9CA3AF' }}
                >
                  {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Pick a date'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(d) => { setDueDate(d); setCalOpen(false) }}
                    disabled={(d) => d < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="h-9 px-4 text-[13px] text-[#6B7280] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors">Cancel</button>
            <button type="submit" disabled={createAssignment.isPending || !title.trim() || !dueDate} className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg disabled:opacity-50 hover:bg-black/90 transition-colors flex items-center gap-2">
              {createAssignment.isPending && <LoadingSpinner className="text-white" />}
              {createAssignment.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SubmissionsInbox({ assignmentId, enrolledCount }: { assignmentId: string; enrolledCount: number }) {
  const { data: rows = [], isLoading } = useAssignmentSubmissions(assignmentId)

  if (isLoading) {
    return (
      <div className="mt-3 border-t border-[#F3F4F6] pt-3 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-3 border-t border-[#F3F4F6] pt-3">
      <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wider mb-2">
        Submissions ({rows.filter(r => r.status !== 'missing').length} / {enrolledCount})
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {rows.map((row) => (
          <div key={row.student.id} className="flex items-center gap-2.5 py-1.5">
            <div className="w-7 h-7 rounded-full bg-[#F5E6EA] flex items-center justify-center text-[10px] font-medium text-[#8B1A2F] shrink-0">
              {row.student.avatar_initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-[#111] truncate">{row.student.full_name}</p>
            </div>
            <StatusBadge
              variant={row.status === 'submitted' ? 'success' : row.status === 'late' ? 'warning' : 'gray'}
              label={row.status === 'submitted' ? 'Submitted' : row.status === 'late' ? 'Late' : 'Missing'}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function AssignmentCard({
  assignment,
  onDelete,
}: {
  assignment: Assignment
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const totalEnrolled = (assignment.submission_count ?? 0) + (assignment.missing_count ?? 0)
  const submittedCount = assignment.submission_count ?? 0
  const progressPct = totalEnrolled > 0 ? (submittedCount / totalEnrolled) * 100 : 0
  const overdue = isPast(new Date(assignment.due_date))

  return (
    <div className="border border-[#E5E5E5] rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-medium text-[#111]">{assignment.title}</h3>
            <span className="text-[11px] text-[#9CA3AF]">Week {assignment.week_number}</span>
            {overdue && <StatusBadge variant="danger" label="Overdue" />}
          </div>
          {assignment.description && (
            <p className="text-[12px] text-[#6B7280] mt-1">{assignment.description}</p>
          )}
          <p className="text-[11px] text-[#9CA3AF] mt-1">
            Due {format(new Date(assignment.due_date), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="h-8 px-3 text-[12px] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors text-[#6B7280]"
          >
            {expanded ? 'Hide' : 'Submissions'}
          </button>
          <button
            onClick={onDelete}
            className="h-8 w-8 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors text-[#9CA3AF] hover:text-red-500"
            title="Delete assignment"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-[#9CA3AF]">{submittedCount} of {totalEnrolled} submitted</span>
          <span className="text-[11px] text-[#9CA3AF]">{Math.round(progressPct)}%</span>
        </div>
        <div className="w-full bg-[#F3F4F6] rounded-full h-[4px] overflow-hidden">
          <div
            className="h-full bg-[#8B1A2F] rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {expanded && (
        <SubmissionsInbox assignmentId={assignment.id} enrolledCount={totalEnrolled} />
      )}
    </div>
  )
}

export default function AssignmentsPageClient({ params }: { params: Promise<{ id: string }> }) {
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
    data: assignments = [],
    isLoading: isAssignmentsLoading,
    isError: isAssignmentsError,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useAssignments(classId)
  const deleteAssignment = useDeleteAssignment()
  const [showCreate, setShowCreate] = useState(false)

  const toastIdRef = useRef<string | number | null>(null)
  const didSuccessRef = useRef(false)

  useEffect(() => {
    router.prefetch(`/admin/classes/${classId}/attendance`)
    router.prefetch(`/admin/classes/${classId}/roster`)
    router.prefetch(`/admin/classes/${classId}/modules`)
  }, [classId, router])

  useEffect(() => {
    const isLoading = isClassLoading || isAssignmentsLoading
    if (isLoading) {
      if (!toastIdRef.current) {
        toastIdRef.current = toast.loading('Loading assignments...')
      }
    } else if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
      if (!didSuccessRef.current) {
        didSuccessRef.current = true
        toast.success('Assignments loaded')
      }
    }
  }, [isClassLoading, isAssignmentsLoading])

  const nextWeek = assignments.length > 0
    ? Math.max(...assignments.map((a) => a.week_number)) + 1
    : 1

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
        <span className="text-[#111]">Assignments</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-medium text-[#111]">Assignments</h1>
        <button onClick={() => setShowCreate(true)} className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg hover:bg-black/90 transition-colors">
          + New assignment
        </button>
      </div>

      {(isClassError || isAssignmentsError) && (
        <InlineError
          message={
            (classError || assignmentsError) instanceof ApiError
              ? (classError || assignmentsError as ApiError).message
              : 'Unable to load assignments'
          }
          onRetry={() => {
            refetchClass()
            refetchAssignments()
          }}
        />
      )}

      {(isClassLoading || isAssignmentsLoading) && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      )}

      {!(isClassLoading || isAssignmentsLoading) && assignments.length === 0 && (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
          title="No assignments yet"
          description="Create an assignment for your students"
          actionLabel="Create assignment"
          onAction={() => setShowCreate(true)}
        />
      )}

      {!(isClassLoading || isAssignmentsLoading) && assignments.length > 0 && (
        <div className="space-y-4">
          {assignments
            .sort((a, b) => a.week_number - b.week_number)
            .map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                onDelete={async () => {
                  try {
                    await deleteAssignment.mutateAsync({ assignmentId: a.id, classId })
                  } catch (err) {
                    toast.error(err instanceof ApiError ? err.message : 'Unable to delete assignment')
                  }
                }}
              />
            ))}
        </div>
      )}

      <CreateAssignmentModal
        classId={classId}
        open={showCreate}
        onClose={() => setShowCreate(false)}
        nextWeek={nextWeek}
      />
    </div>
  )
}
