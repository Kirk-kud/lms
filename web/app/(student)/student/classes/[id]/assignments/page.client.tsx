'use client'

import { use, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import { useAssignments, Assignment } from '@/lib/hooks/useAssignments'
import { useClass } from '@/lib/hooks/useClasses'
import { useUser } from '@/lib/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import AssignmentUpload from '@/components/ui/student/AssignmentUpload'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { InlineError } from '@/components/ui/shared/InlineError'
import { ApiError } from '@/lib/api'

function toSubmissionData(assignment: Assignment) {
  if (!assignment.submission) return null
  return {
    file_name: assignment.submission.file_name,
    submitted_at: new Date(assignment.submission.submitted_at),
    signed_url: assignment.submission.file_url,
  }
}

async function getAccessToken() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export default function StudentAssignmentsPageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const { user } = useUser()
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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const now = useMemo(() => new Date(), [])
  const upcoming = assignments.filter((a) => new Date(a.due_date) >= now)
  const past = assignments.filter((a) => new Date(a.due_date) < now)

  const handleSubmit = (assignmentId: string) => async (file: File) => {
    const token = await getAccessToken()
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
                status: 'submitted',
                submitted_at: new Date().toISOString(),
              },
            }
          : a
      )
    )

    try {
      setUploadProgress((prev) => ({ ...prev, [assignmentId]: 0 }))
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignmentId}/submit`,
        formData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          onUploadProgress: (event) => {
            const total = event.total ?? 0
            if (total > 0) {
              const pct = Math.round((event.loaded / total) * 100)
              setUploadProgress((prev) => ({ ...prev, [assignmentId]: pct }))
            }
          },
        }
      )
      await qc.invalidateQueries({ queryKey: ['assignments', classId] })
      toast.success('Assignment submitted')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to submit assignment')
      await qc.invalidateQueries({ queryKey: ['assignments', classId] })
    } finally {
      setUploadProgress((prev) => ({ ...prev, [assignmentId]: 0 }))
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <nav className="flex items-center gap-2 text-[12px] text-[#9CA3AF] mb-6">
        <button onClick={() => router.push('/student/dashboard')} className="hover:text-[#111] transition-colors">
          Dashboard
        </button>
        <span>/</span>
        <button onClick={() => router.push(`/student/classes/${classId}/modules`)} className="hover:text-[#111] transition-colors">
          {classData?.title ?? '...'}
        </button>
        <span>/</span>
        <span className="text-[#111]">Assignments</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-medium text-[#111]">Assignments</h1>
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
              <path d="M5 4h14v16H5z" />
              <path d="M8 2h8v4H8z" />
            </svg>
          }
          title="No assignments yet"
          description="Your tutor will post assignments soon"
        />
      )}

      {!(isClassLoading || isAssignmentsLoading) && assignments.length > 0 && (
        <div className="space-y-6">
          {upcoming.map((assignment) => (
            <AssignmentUpload
              key={assignment.id}
              title={assignment.title}
              description={assignment.description ?? undefined}
              dueDate={new Date(assignment.due_date)}
              isOverdue={new Date(assignment.due_date) < new Date()}
              submission={toSubmissionData(assignment)}
              onSubmit={handleSubmit(assignment.id)}
              uploadProgress={uploadProgress[assignment.id] ?? 0}
            />
          ))}

          {past.length > 0 && (
            <div className="pt-6 border-t border-[#E5E5E5]">
              <h2 className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-4">
                Past assignments
              </h2>
              <div className="space-y-6">
                {past.map((assignment) => (
                  <AssignmentUpload
                    key={assignment.id}
                    title={assignment.title}
                    description={assignment.description ?? undefined}
                    dueDate={new Date(assignment.due_date)}
                    isOverdue={new Date(assignment.due_date) < new Date()}
                    submission={toSubmissionData(assignment)}
                    onSubmit={handleSubmit(assignment.id)}
                    uploadProgress={uploadProgress[assignment.id] ?? 0}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
