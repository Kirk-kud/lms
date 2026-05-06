'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format, isPast } from 'date-fns'
import {
  useAssignments,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  useAssignmentSubmissions,
  useSubmissionViewUrl,
  useGradeSubmission,
  Assignment,
  type SubmissionRow,
} from '@/lib/hooks/useAssignments'
import { useClass } from '@/lib/hooks/useClasses'
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

function EditAssignmentModal({
  assignment,
  classId,
  open,
  onClose,
}: {
  assignment: Assignment
  classId: string
  open: boolean
  onClose: () => void
}) {
  const [title, setTitle] = useState(assignment.title)
  const [description, setDescription] = useState(assignment.description ?? '')
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date(assignment.due_date))
  const [calOpen, setCalOpen] = useState(false)
  const updateAssignment = useUpdateAssignment()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !dueDate) return
    try {
      await updateAssignment.mutateAsync({
        assignmentId: assignment.id,
        classId,
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate.toISOString(),
      })
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to update assignment')
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
          <DialogTitle className="text-[15px] font-medium">Edit assignment</DialogTitle>
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
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="h-9 px-4 text-[13px] text-[#6B7280] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors">Cancel</button>
            <button type="submit" disabled={updateAssignment.isPending || !title.trim() || !dueDate} className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg disabled:opacity-50 hover:bg-black/90 transition-colors flex items-center gap-2">
              {updateAssignment.isPending && <LoadingSpinner className="text-white" />}
              {updateAssignment.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SubmissionIndicator({
  submitted,
  total,
  needsReview,
}: {
  submitted: number
  total: number
  needsReview: boolean
}) {
  if (submitted === 0) {
    return <span style={{ fontSize: '11px', color: '#9CA3AF' }}>No submissions</span>
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
      {needsReview && (
        <span
          style={{
            fontSize: '10px',
            fontWeight: 500,
            background: '#F5E6EA',
            color: '#8B1A2F',
            padding: '2px 8px',
            borderRadius: '9999px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Review
        </span>
      )}
      <span style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>
        {submitted}
        <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}>/{total}</span>
      </span>
    </div>
  )
}

function GradeModal({
  row,
  assignmentId,
  open,
  onClose,
}: {
  row: SubmissionRow
  assignmentId: string
  open: boolean
  onClose: () => void
}) {
  const submissionId = row.submission?.id ?? ''
  const { data: urlData, isLoading: urlLoading } = useSubmissionViewUrl(assignmentId, submissionId, open && !!submissionId)
  const gradeSubmission = useGradeSubmission()
  const [grade, setGrade] = useState<string>(row.submission?.grade !== null && row.submission?.grade !== undefined ? String(row.submission.grade) : '')
  const [feedback, setFeedback] = useState(row.submission?.feedback ?? '')

  const handleSave = async () => {
    const g = Number(grade)
    if (isNaN(g) || g < 0 || g > 100) {
      toast.error('Grade must be 0–100')
      return
    }
    try {
      await gradeSubmission.mutateAsync({ assignmentId, submissionId, grade: g, feedback: feedback.trim() || undefined })
      toast.success('Grade saved')
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to save grade')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent style={{ width: '95vw', maxWidth: '95vw', height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <DialogHeader style={{ padding: '16px 20px 12px', borderBottom: '0.5px solid #E5E5E5', flexShrink: 0 }}>
          <DialogTitle style={{ fontSize: '14px', fontWeight: 500 }}>
            {row.student.full_name}
            {row.submission?.submitted_at && (
              <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400, marginLeft: '8px' }}>
                Submitted {format(new Date(row.submission.submitted_at), 'MMM d, h:mm a')}
                {row.submission.status === 'late' && (
                  <span style={{ marginLeft: '6px', color: '#991B1B' }}>· Late</span>
                )}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* PDF viewer */}
          <div style={{ flex: 1, background: '#F8F8F8', position: 'relative', overflow: 'hidden' }}>
            {!submissionId ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: '13px' }}>
                No submission
              </div>
            ) : urlLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: '#9CA3AF', fontSize: '13px' }}>
                <LoadingSpinner />
                Loading file…
              </div>
            ) : urlData?.signed_url ? (
              <iframe
                src={urlData.signed_url}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={`Submission by ${row.student.full_name}`}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: '13px' }}>
                Unable to load file
              </div>
            )}
          </div>

          {/* Grade panel */}
          <div style={{ width: '300px', flexShrink: 0, borderLeft: '0.5px solid #E5E5E5', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Grade (0–100)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. 85"
                style={{ width: '100%', height: '36px', border: '0.5px solid #E5E5E5', borderRadius: '8px', fontSize: '20px', fontWeight: 600, padding: '0 10px', outline: 'none', boxSizing: 'border-box', color: '#111', textAlign: 'center' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={6}
                placeholder="Leave feedback for the student…"
                style={{ width: '100%', border: '0.5px solid #E5E5E5', borderRadius: '8px', fontSize: '12px', padding: '8px 10px', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={gradeSubmission.isPending || !grade}
              style={{ height: '36px', background: '#111111', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: (gradeSubmission.isPending || !grade) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {gradeSubmission.isPending && <LoadingSpinner className="text-white" />}
              {gradeSubmission.isPending ? 'Saving…' : 'Save grade'}
            </button>
            {row.submission?.graded_at && (
              <p style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center' }}>
                Last graded {format(new Date(row.submission.graded_at), 'MMM d, h:mm a')}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SubmissionRow({ row, assignmentId }: { row: SubmissionRow; assignmentId: string }) {
  const [reviewOpen, setReviewOpen] = useState(false)
  const hasSubmission = !!row.submission?.file_url
  const graded = row.submission?.grade !== null && row.submission?.grade !== undefined

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 0',
          borderTop: '1px solid #F3F4F6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F5E6EA', color: '#8B1A2F', fontSize: '11px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {row.student.avatar_initials}
          </div>
          <div>
            <p style={{ fontSize: '13px', color: '#111' }}>{row.student.full_name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <p style={{ fontSize: '11px', color: '#9CA3AF' }}>
                {row.submission?.submitted_at
                  ? `Submitted ${format(new Date(row.submission.submitted_at), 'MMM d, h:mm a')}`
                  : 'Not submitted'}
              </p>
              {row.submission?.status === 'late' && (
                <span style={{ fontSize: '10px', color: '#991B1B', fontWeight: 500 }}>Late</span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {graded && (
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>
              {row.submission!.grade}
              <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}>/100</span>
            </span>
          )}
          {hasSubmission && (
            <button
              onClick={() => setReviewOpen(true)}
              style={{ height: '28px', padding: '0 12px', background: graded ? '#F8F8F8' : '#8B1A2F', color: graded ? '#111' : '#fff', border: graded ? '0.5px solid #E5E5E5' : 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              {graded ? 'Edit grade' : 'Review'}
            </button>
          )}
        </div>
      </div>
      {reviewOpen && (
        <GradeModal row={row} assignmentId={assignmentId} open={reviewOpen} onClose={() => setReviewOpen(false)} />
      )}
    </>
  )
}

function SubmissionsList({ assignmentId }: { assignmentId: string }) {
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
    <div style={{ marginTop: '12px', borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
      {rows.map((row) => (
        <SubmissionRow key={row.student.id} row={row} assignmentId={assignmentId} />
      ))}
    </div>
  )
}

function AssignmentCard({
  assignment,
  classId,
  totalStudents,
  onDelete,
}: {
  assignment: Assignment
  classId: string
  totalStudents: number
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const submittedCount = assignment.submission_count ?? 0
  const needsReview = submittedCount > 0

  return (
    <>
    <div
      style={{
        border: '1px solid #E5E5E5',
        borderRadius: '12px',
        padding: '16px 20px',
        transition: 'border-color 150ms',
        position: 'relative',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(139,26,47,0.3)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        {/* Left: title + due date */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#111' }}>{assignment.title}</p>
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>
            Due {format(new Date(assignment.due_date), 'MMM d, h:mm a')}
            {isPast(new Date(assignment.due_date)) && (
              <span style={{ marginLeft: '6px', color: '#991B1B' }}>· Closed</span>
            )}
          </p>
        </div>

        {/* Right: submission indicator + action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <SubmissionIndicator submitted={submittedCount} total={totalStudents} needsReview={needsReview} />
          <button
            onClick={() => setEditOpen(true)}
            className="h-8 w-8 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors text-[#9CA3AF] hover:text-[#111] shrink-0"
            title="Edit assignment"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="h-8 w-8 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors text-[#9CA3AF] hover:text-red-500 shrink-0"
            title="Delete assignment"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expand toggle */}
      {submittedCount > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            fontSize: '12px',
            color: '#8B1A2F',
            marginTop: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            padding: '0',
          }}
        >
          {expanded
            ? 'Hide submissions'
            : `View ${submittedCount} submission${submittedCount !== 1 ? 's' : ''}`}
        </button>
      )}

      {/* Expandable: submission list */}
      {expanded && <SubmissionsList assignmentId={assignment.id} />}
    </div>
    {editOpen && (
      <EditAssignmentModal
        assignment={assignment}
        classId={classId}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    )}
    </>
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
  const [activeTab, setActiveTab] = useState<'All' | 'Needs review'>('All')

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

  const needsReview = (a: Assignment) => (a.submission_count ?? 0) > 0

  const needsReviewCount = assignments.filter(needsReview).length

  const filtered = activeTab === 'Needs review'
    ? assignments.filter(needsReview)
    : assignments

  const totalStudents = assignments.length > 0
    ? Math.max(
        ...(assignments
          .map((a) => (a.submission_count ?? 0) + (a.missing_count ?? 0))
          .filter((c) => c > 0) || [1])
      )
    : 0

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
        <>
          {/* Tab filter */}
          <div
            style={{
              display: 'flex',
              gap: 0,
              border: '1px solid #E5E5E5',
              borderRadius: '8px',
              overflow: 'hidden',
              width: 'fit-content',
              marginBottom: '24px',
            }}
          >
            {(['All', 'Needs review'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  height: '32px',
                  padding: '0 16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  background: activeTab === tab ? '#111' : '#fff',
                  color: activeTab === tab ? '#fff' : '#6B7280',
                  transition: 'all 150ms',
                }}
              >
                {tab}
                {tab === 'Needs review' && needsReviewCount > 0 && (
                  <span
                    style={{
                      marginLeft: '6px',
                      fontSize: '10px',
                      fontWeight: 500,
                      background: activeTab === tab ? 'rgba(255,255,255,0.2)' : '#F5E6EA',
                      color: activeTab === tab ? '#fff' : '#8B1A2F',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      display: 'inline-block',
                    }}
                  >
                    {needsReviewCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Assignments list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: '13px' }}>
                No assignments need review
              </div>
            ) : (
              filtered
                .sort((a, b) => a.week_number - b.week_number)
                .map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    classId={classId}
                    totalStudents={totalStudents}
                    onDelete={async () => {
                      try {
                        await deleteAssignment.mutateAsync({ assignmentId: a.id, classId })
                      } catch (err) {
                        toast.error(err instanceof ApiError ? err.message : 'Unable to delete assignment')
                      }
                    }}
                  />
                ))
            )}
          </div>
        </>
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