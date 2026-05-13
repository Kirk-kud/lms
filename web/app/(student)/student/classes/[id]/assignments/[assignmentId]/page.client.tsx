'use client'

import { use, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import {
  useAssignments,
  Assignment,
  type ExpectedSubmissionType,
} from '@/lib/hooks/useAssignments'
import { useClass } from '@/lib/hooks/useClasses'
import { useUser } from '@/lib/hooks/useUser'
import AssignmentUpload from '@/components/ui/student/AssignmentUpload'
import type {
  AssignmentMaterialsBlock,
  SubmitPayload,
} from '@/components/ui/student/AssignmentUpload'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { InlineError } from '@/components/ui/shared/InlineError'
import { ApiError, getApiBaseUrl } from '@/lib/api'

function deriveExpectedType(row: Assignment): ExpectedSubmissionType {
  return row.expected_submission_type ?? 'pdf_file'
}

function deriveMaterials(row: Assignment): AssignmentMaterialsBlock {
  return {
    instructionPdfSignedUrl: row.instruction_file_signed_url ?? null,
    instructionPdfFileName: row.instruction_file_name ?? null,
    instructionLink: row.instruction_link_url ?? null,
    instructionLinkLabel: row.instruction_link_label ?? null,
    instructionText: row.instruction_text ?? null,
  }
}

/** Infer how the student handed work in — older rows assume PDF-only. */
function deriveSubmissionPresentation(row: Assignment) {
  const s = row.submission
  if (!s) return null

  const linkTrim = (s.submission_link_url ?? '').trim()
  const textTrim = (s.submission_text ?? '').trim()
  let kind: ExpectedSubmissionType = deriveExpectedType(row)
  if (linkTrim.length > 0) kind = 'link'
  else if (textTrim.length > 0) kind = 'text'
  else if ((s.file_name ?? '').length > 0 || (s.file_url ?? '').length > 0) kind = 'pdf_file'

  return {
    submitted_at: new Date(s.submitted_at),
    kind,
    file_display_name: s.file_name,
    pdf_signed_url: kind === 'pdf_file' ? s.signed_url ?? null : null,
    response_text: kind === 'text' ? textTrim || null : null,
    response_link: kind === 'link' ? linkTrim || null : null,
  }
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

function fireConfetti() {
  const count = 180
  const defaults = { origin: { y: 0.7 }, zIndex: 9999 }

  confetti({ ...defaults, particleCount: count * 0.25, spread: 26, startVelocity: 55, colors: ['#8B1A2F', '#C5A0A8', '#111111'] })
  confetti({ ...defaults, particleCount: count * 0.2, spread: 60, colors: ['#8B1A2F', '#FFFFFF', '#F4DCE1'] })
  confetti({ ...defaults, particleCount: count * 0.35, spread: 100, decay: 0.91, scalar: 0.8, colors: ['#8B1A2F', '#C5A0A8', '#111111'] })
  confetti({ ...defaults, particleCount: count * 0.1, spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#8B1A2F', '#FFFFFF'] })
  confetti({ ...defaults, particleCount: count * 0.1, spread: 120, startVelocity: 45, colors: ['#8B1A2F', '#F4DCE1'] })
}

export default function AssignmentDetailPageClient({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>
}) {
  const { id: classId, assignmentId } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useUser()

  const {
    data: classData,
    isLoading: isClassLoading,
  } = useClass(classId)

  const {
    data: assignments = [],
    isLoading: isAssignmentsLoading,
    isError,
    error,
    refetch,
  } = useAssignments(classId)

  const [uploadProgress, setUploadProgress] = useState(0)

  const assignment = assignments.find((a) => a.id === assignmentId)
  const isLoading = isClassLoading || isAssignmentsLoading

  const now = new Date()
  const dueDate = assignment ? new Date(assignment.due_date) : null
  const isOverdue = dueDate ? now > dueDate : false

  const availableUntil = assignment?.available_until ? new Date(assignment.available_until) : null
  const reopenedUntil = assignment?.reopened_until ? new Date(assignment.reopened_until) : null

  const effectiveCutoff = (() => {
    const times = [availableUntil?.getTime(), reopenedUntil?.getTime()].filter((t): t is number => t !== undefined)
    if (times.length > 0) return new Date(Math.max(...times))
    return null
  })()

  // Closed only when explicit window is set and past
  const windowClosed = effectiveCutoff !== null ? now > effectiveCutoff : false
  // Late window: past due_date but still within the effective cutoff
  const lateWindowEnd = isOverdue && effectiveCutoff !== null && !windowClosed ? effectiveCutoff : null

  const handleSubmit = useCallback(
    async (payload: SubmitPayload) => {
      const token = getAccessToken()
      const formData = new FormData()

      if (payload.kind === 'pdf_file') formData.append('file', payload.file)
      else if (payload.kind === 'text')
        formData.append('submission_text', payload.submission_text)
      else formData.append('submission_link_url', payload.submission_link_url)

      const isPdfSubmit = payload.kind === 'pdf_file'

      if (isPdfSubmit) {
        qc.setQueryData<Assignment[]>(['assignments', classId], (prev) =>
          prev?.map((a) =>
            a.id === assignmentId
              ? {
                  ...a,
                  submission: {
                    id: `optimistic-${assignmentId}`,
                    assignment_id: assignmentId,
                    student_id: user?.id ?? '',
                    file_url: '',
                    file_name: payload.file.name,
                    submission_text: null,
                    submission_link_url: null,
                    status: 'submitted',
                    submitted_at: new Date().toISOString(),
                    grade: null,
                    feedback: null,
                    graded_at: null,
                    graded_by: null,
                  },
                }
              : a,
          ),
        )
      } else if (payload.kind === 'text') {
        qc.setQueryData<Assignment[]>(['assignments', classId], (prev) =>
          prev?.map((a) =>
            a.id === assignmentId
              ? {
                  ...a,
                  submission: {
                    id: `optimistic-${assignmentId}`,
                    assignment_id: assignmentId,
                    student_id: user?.id ?? '',
                    file_url: null,
                    file_name: null,
                    submission_text: payload.submission_text,
                    submission_link_url: null,
                    status: 'submitted',
                    submitted_at: new Date().toISOString(),
                    grade: null,
                    feedback: null,
                    graded_at: null,
                    graded_by: null,
                  },
                }
              : a,
          ),
        )
      } else if (payload.kind === 'link') {
        qc.setQueryData<Assignment[]>(['assignments', classId], (prev) =>
          prev?.map((a) =>
            a.id === assignmentId
              ? {
                  ...a,
                  submission: {
                    id: `optimistic-${assignmentId}`,
                    assignment_id: assignmentId,
                    student_id: user?.id ?? '',
                    file_url: null,
                    file_name: null,
                    submission_text: null,
                    submission_link_url: payload.submission_link_url,
                    status: 'submitted',
                    submitted_at: new Date().toISOString(),
                    grade: null,
                    feedback: null,
                    graded_at: null,
                    graded_by: null,
                  },
                }
              : a,
          ),
        )
      }

      try {
        if (isPdfSubmit) setUploadProgress(10)

        await axios.post(
          `${getApiBaseUrl()}/assignments/${assignmentId}/submit`,
          formData,
          {
            headers: { Authorization: token ? `Bearer ${token}` : undefined },
            onUploadProgress: isPdfSubmit
              ? (event) => {
                  const total = event.total ?? 0
                  if (total > 0) {
                    const progress = Math.round((event.loaded / total) * 100)
                    setUploadProgress(Math.min(95, progress))
                  }
                }
              : undefined,
          },
        )

        if (isPdfSubmit) {
          setUploadProgress(100)
          await new Promise((resolve) => setTimeout(resolve, 400))
        }

        await qc.invalidateQueries({ queryKey: ['assignments', classId] })
        toast.success('Assignment submitted!')
        fireConfetti()
      } catch (err) {
        let errorMsg = 'Unable to submit assignment'
        if (err instanceof ApiError) {
          errorMsg = err.message
        } else if (axios.isAxiosError(err)) {
          const msg = err.response?.data?.message
          if (typeof msg === 'string') errorMsg = msg
          else if (err.response?.status === 401)
            errorMsg = 'Session expired — please sign in again'
          else if (err.response?.status === 403)
            errorMsg = "You're not enrolled in this class"
          else if (err.response?.status === 413)
            errorMsg = 'File is too large (max 15 MB)'
        }
        toast.error(errorMsg)
        await qc.invalidateQueries({ queryKey: ['assignments', classId] })
      } finally {
        setUploadProgress(0)
      }
    },
    [assignmentId, classId, qc, user?.id],
  )

  return (
    <div className="p-4 sm:p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-[#9CA3AF] mb-6">
        <button
          onClick={() => router.push('/student/dashboard')}
          onMouseEnter={() => router.prefetch('/student/dashboard')}
          className="hover:text-[#111] transition-colors"
        >
          Dashboard
        </button>
        <span>/</span>
        <button
          onClick={() => router.push(`/student/classes/${classId}/modules`)}
          className="hover:text-[#111] transition-colors"
        >
          {isClassLoading ? (
            <span className="inline-block w-20 h-3 bg-[#E5E5E5] rounded animate-pulse align-middle" />
          ) : (
            classData?.title ?? '...'
          )}
        </button>
        <span>/</span>
        <button
          onClick={() => router.push(`/student/classes/${classId}/assignments`)}
          onMouseEnter={() =>
            router.prefetch(`/student/classes/${classId}/assignments`)
          }
          className="hover:text-[#111] transition-colors"
        >
          Assignments
        </button>
        <span>/</span>
        <span className="text-[#111] truncate max-w-[140px]">
          {isLoading ? (
            <span className="inline-block w-24 h-3 bg-[#E5E5E5] rounded animate-pulse align-middle" />
          ) : (
            assignment?.title ?? '...'
          )}
        </span>
      </nav>

      {isError && (
        <InlineError
          message={error instanceof ApiError ? error.message : 'Unable to load assignment'}
          onRetry={() => refetch()}
        />
      )}

      {isLoading && <SkeletonCard lines={4} />}

      {!isLoading && !assignment && !isError && (
        <div className="border border-dashed border-[#E5E5E5] rounded-xl p-12 text-center">
          <p className="text-[14px] text-[#9CA3AF]">Assignment not found.</p>
          <button
            onClick={() => router.push(`/student/classes/${classId}/assignments`)}
            className="mt-4 text-[13px] text-[#8B1A2F] hover:underline"
          >
            Back to assignments
          </button>
        </div>
      )}

      {!isLoading && assignment && (
        <AssignmentUpload
          key={`${assignmentId}-${deriveExpectedType(assignment)}`}
          title={assignment.title}
          description={assignment.description ?? undefined}
          materials={deriveMaterials(assignment)}
          expectedSubmissionType={deriveExpectedType(assignment)}
          dueDate={new Date(assignment.due_date)}
          isOverdue={isOverdue}
          windowClosed={windowClosed}
          lateWindowEnd={lateWindowEnd}
          submission={deriveSubmissionPresentation(assignment)}
          onSubmit={handleSubmit}
          uploadProgress={uploadProgress}
        />
      )}
    </div>
  )
}
