'use client'

import { useState } from 'react'
import { format, isPast } from 'date-fns'
import { toast } from 'sonner'
import { useTutorClass } from '@/lib/contexts/TutorClassContext'
import {
  useAssignments,
  useAssignmentSubmissions,
  useSubmissionViewUrl,
  useGradeSubmission,
  Assignment,
  type SubmissionRow,
} from '@/lib/hooks/useAssignments'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'
import { ApiError } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  const [grade, setGrade] = useState<string>(
    row.submission?.grade !== null && row.submission?.grade !== undefined ? String(row.submission.grade) : '',
  )
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
          <div style={{ flex: 1, background: '#F8F8F8', position: 'relative', overflow: 'hidden' }}>
            {!submissionId ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: '13px' }}>No submission</div>
            ) : urlLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: '#9CA3AF', fontSize: '13px' }}>
                <LoadingSpinner /> Loading file…
              </div>
            ) : urlData?.signed_url ? (
              <iframe src={urlData.signed_url} style={{ width: '100%', height: '100%', border: 'none' }} title={`Submission by ${row.student.full_name}`} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', fontSize: '13px' }}>Unable to load file</div>
            )}
          </div>

          <div style={{ width: '300px', flexShrink: 0, borderLeft: '0.5px solid #E5E5E5', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Grade (0–100)</label>
              <input
                type="number" min={0} max={100} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 85"
                style={{ width: '100%', height: '36px', border: '0.5px solid #E5E5E5', borderRadius: '8px', fontSize: '20px', fontWeight: 600, padding: '0 10px', outline: 'none', boxSizing: 'border-box', color: '#111', textAlign: 'center' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Feedback</label>
              <textarea
                value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={6} placeholder="Leave feedback for the student…"
                style={{ width: '100%', border: '0.5px solid #E5E5E5', borderRadius: '8px', fontSize: '12px', padding: '8px 10px', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
              />
            </div>
            <button
              onClick={handleSave} disabled={gradeSubmission.isPending || !grade}
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

function SubmissionRowItem({ row, assignmentId }: { row: SubmissionRow; assignmentId: string }) {
  const [reviewOpen, setReviewOpen] = useState(false)
  const hasSubmission = !!row.submission?.file_url
  const graded = row.submission?.grade !== null && row.submission?.grade !== undefined

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #F3F4F6' }}>
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
        {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
      </div>
    )
  }

  return (
    <div style={{ marginTop: '12px', borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
      {rows.map((row) => (
        <SubmissionRowItem key={row.student.id} row={row} assignmentId={assignmentId} />
      ))}
    </div>
  )
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const [expanded, setExpanded] = useState(false)
  const submittedCount = assignment.submission_count ?? 0

  return (
    <div
      style={{ border: '1px solid #E5E5E5', borderRadius: '12px', padding: '16px 20px', transition: 'border-color 150ms', position: 'relative' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(139,26,47,0.3)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#111' }}>{assignment.title}</p>
          {assignment.description && (
            <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{assignment.description}</p>
          )}
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>
            Due {format(new Date(assignment.due_date), 'MMM d, h:mm a')}
            {isPast(new Date(assignment.due_date)) && (
              <span style={{ marginLeft: '6px', color: '#991B1B' }}>· Closed</span>
            )}
          </p>
        </div>
        {submittedCount > 0 && (
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#111', flexShrink: 0 }}>
            {submittedCount}
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}> submitted</span>
          </span>
        )}
      </div>

      {submittedCount > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ fontSize: '12px', color: '#8B1A2F', marginTop: '12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', padding: '0' }}
        >
          {expanded ? 'Hide submissions' : `View ${submittedCount} submission${submittedCount !== 1 ? 's' : ''}`}
        </button>
      )}

      {expanded && <SubmissionsList assignmentId={assignment.id} />}
    </div>
  )
}

export default function TutorAssignmentsClient() {
  const { selectedClass } = useTutorClass()
  const classId = selectedClass?.id ?? ''
  const cohortName = selectedClass?.cohort_name ?? 'My Cohort'

  const { data: assignments = [], isLoading } = useAssignments(classId)
  const [activeTab, setActiveTab] = useState<'All' | 'Needs review'>('All')

  const needsReview = (a: Assignment) => (a.submission_count ?? 0) > 0
  const needsReviewCount = assignments.filter(needsReview).length
  const filtered = activeTab === 'Needs review' ? assignments.filter(needsReview) : assignments

  if (isLoading) {
    return <div className="p-6"><SkeletonCard lines={4} /></div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF] mb-1">{cohortName}</p>
        <h1 className="text-[28px] font-semibold text-[#111111]">Assignments</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">{assignments.length} total</p>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/></svg>}
          title="No assignments yet"
          description="The admin hasn't posted any assignments for this class."
        />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 0, border: '1px solid #E5E5E5', borderRadius: '8px', overflow: 'hidden', width: 'fit-content', marginBottom: '24px' }}>
            {(['All', 'Needs review'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ height: '32px', padding: '0 16px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', background: activeTab === tab ? '#111' : '#fff', color: activeTab === tab ? '#fff' : '#6B7280', transition: 'all 150ms' }}
              >
                {tab}
                {tab === 'Needs review' && needsReviewCount > 0 && (
                  <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 500, background: activeTab === tab ? 'rgba(255,255,255,0.2)' : '#F5E6EA', color: activeTab === tab ? '#fff' : '#8B1A2F', padding: '1px 6px', borderRadius: '9999px', display: 'inline-block' }}>
                    {needsReviewCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: '13px' }}>No assignments need review</div>
            ) : (
              filtered
                .sort((a, b) => a.week_number - b.week_number)
                .map((a) => <AssignmentCard key={a.id} assignment={a} />)
            )}
          </div>
        </>
      )}
    </div>
  )
}
