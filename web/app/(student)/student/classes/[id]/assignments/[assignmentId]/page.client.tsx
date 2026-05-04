'use client'

import { use, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { useAssignments, Assignment } from '@/lib/hooks/useAssignments'
import { useClass } from '@/lib/hooks/useClasses'
import { useUser } from '@/lib/hooks/useUser'
import AssignmentUpload from '@/components/ui/student/AssignmentUpload'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { InlineError } from '@/components/ui/shared/InlineError'
import { ApiError, getApiBaseUrl } from '@/lib/api'

function toSubmissionData(assignment: Assignment) {
  if (!assignment.submission) return null
  return {
    file_name: assignment.submission.file_name,
    submitted_at: new Date(assignment.submission.submitted_at),
    signed_url: assignment.submission.signed_url ?? null,
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
  const isOverdue = assignment ? new Date(assignment.due_date) < new Date() : false

  const handleSubmit = useCallback(async (file: File) => {
    const token = getAccessToken()
    const formData = new FormData()
    formData.append('file', file)

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
                file_name: file.name,
                status: 'submitted' as const,
                submitted_at: new Date().toISOString(),
                grade: null,
                feedback: null,
                graded_at: null,
                graded_by: null,
              },
            }
          : a
      )
    )

    try {
      setUploadProgress(10)
      await axios.post(
        `${getApiBaseUrl()}/assignments/${assignmentId}/submit`,
        formData,
        {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
          onUploadProgress: (event) => {
            const total = event.total ?? 0
            if (total > 0) {
              const progress = Math.round((event.loaded / total) * 100)
              setUploadProgress(Math.min(95, progress))
            }
          },
        }
      )
      setUploadProgress(100)
      await new Promise(resolve => setTimeout(resolve, 400))
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
        else if (err.response?.status === 401) errorMsg = 'Session expired — please sign in again'
        else if (err.response?.status === 403) errorMsg = "You're not enrolled in this class"
        else if (err.response?.status === 413) errorMsg = 'File is too large (max 15 MB)'
      }
      toast.error(errorMsg)
      await qc.invalidateQueries({ queryKey: ['assignments', classId] })
    } finally {
      setUploadProgress(0)
    }
  }, [assignmentId, classId, qc, user?.id])

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
          onMouseEnter={() => router.prefetch(`/student/classes/${classId}/assignments`)}
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
          title={assignment.title}
          description={assignment.description ?? undefined}
          dueDate={new Date(assignment.due_date)}
          isOverdue={isOverdue}
          submission={toSubmissionData(assignment)}
          onSubmit={handleSubmit}
          uploadProgress={uploadProgress}
        />
      )}
    </div>
  )
}
