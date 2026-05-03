'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import { useClass } from '@/lib/hooks/useClasses'
import {
  useCohorts,
  useCreateCohort,
  useDeleteCohort,
  useUpdateCohort,
  useCohortStudents,
  useAddCohortStudent,
  useRemoveCohortStudent,
  type Cohort,
  type CohortStudent,
} from '@/lib/hooks/useCohorts'
import { useCreateTaInvite } from '@/lib/hooks/useTaInvites'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '36px',
  borderRadius: '8px',
  border: '0.5px solid #E5E5E5',
  fontSize: '13px',
  padding: '0 10px',
  outline: 'none',
  boxSizing: 'border-box',
}

function focusInput(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#8B1A2F'
}
function blurInput(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#E5E5E5'
}

// ─── Create Cohort Modal ─────────────────────────────────────────
function CreateCohortModal({ classId, open, onClose }: { classId: string; open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [taId, setTaId] = useState('')
  const [zoomLink, setZoomLink] = useState('')
  const createCohort = useCreateCohort()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createCohort.mutateAsync({
        class_id: classId,
        name: name.trim(),
        ta_id: taId.trim() || undefined,
        zoom_link: zoomLink.trim() || undefined,
      })
      setName('')
      setTaId('')
      setZoomLink('')
      onClose()
      toast.success('Cohort created')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to create cohort')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium">New cohort</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">Cohort name</label>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="e.g. Ashesi Group A"
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">
              Tutor user ID <span className="text-[#9CA3AF]">(optional — assign later)</span>
            </label>
            <input
              value={taId}
              onChange={(e) => setTaId(e.target.value)}
              style={inputStyle}
              placeholder="Paste tutor's UUID"
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">
              Zoom link <span className="text-[#9CA3AF]">(optional)</span>
            </label>
            <input
              value={zoomLink}
              onChange={(e) => setZoomLink(e.target.value)}
              style={inputStyle}
              placeholder="https://zoom.us/j/..."
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-[13px] text-[#6B7280] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCohort.isPending || !name.trim()}
              className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg disabled:opacity-50 hover:bg-black/90 transition-colors flex items-center gap-2"
            >
              {createCohort.isPending && <LoadingSpinner className="text-white" />}
              {createCohort.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Cohort Modal ────────────────────────────────────────────
function EditCohortModal({ cohort, classId, open, onClose }: { cohort: Cohort; classId: string; open: boolean; onClose: () => void }) {
  const [name, setName] = useState(cohort.name)
  const [taId, setTaId] = useState(cohort.ta?.id ?? '')
  const [zoomLink, setZoomLink] = useState(cohort.zoom_link ?? '')
  const updateCohort = useUpdateCohort(classId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateCohort.mutateAsync({
        id: cohort.id,
        name: name.trim(),
        ta_id: taId.trim() || undefined,
        zoom_link: zoomLink.trim() || undefined,
      })
      onClose()
      toast.success('Cohort updated')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to update cohort')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium">Edit cohort</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">Cohort name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">
              Tutor user ID <span className="text-[#9CA3AF]">(leave blank to unassign)</span>
            </label>
            <input
              value={taId}
              onChange={(e) => setTaId(e.target.value)}
              style={inputStyle}
              placeholder="Paste tutor's UUID"
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">Zoom link</label>
            <input
              value={zoomLink}
              onChange={(e) => setZoomLink(e.target.value)}
              style={inputStyle}
              placeholder="https://zoom.us/j/..."
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="h-9 px-4 text-[13px] text-[#6B7280] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors">Cancel</button>
            <button type="submit" disabled={updateCohort.isPending} className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg disabled:opacity-50 hover:bg-black/90 transition-colors flex items-center gap-2">
              {updateCohort.isPending && <LoadingSpinner className="text-white" />}
              {updateCohort.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Cohort Students Panel ────────────────────────────────────────
function CohortStudentsPanel({ cohort, onClose }: { cohort: Cohort; onClose: () => void }) {
  const { data: students = [], isLoading } = useCohortStudents(cohort.id)
  const addStudent = useAddCohortStudent(cohort.id)
  const removeStudent = useRemoveCohortStudent(cohort.id)
  const [studentId, setStudentId] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId.trim()) return
    try {
      await addStudent.mutateAsync(studentId.trim())
      setStudentId('')
      toast.success('Student added')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to add student')
    }
  }

  const handleRemove = async (s: CohortStudent) => {
    try {
      await removeStudent.mutateAsync(s.student.id)
      toast.success('Student removed')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to remove student')
    }
  }

  return (
    <div className="mt-4 border-t border-[#F3F4F6] pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-medium text-[#111]">Students ({students.length})</p>
        <button onClick={onClose} className="text-[11px] text-[#9CA3AF] hover:text-[#111] transition-colors">Close</button>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <input
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Student UUID"
          style={{ ...inputStyle, flex: 1 }}
          onFocus={focusInput}
          onBlur={blurInput}
        />
        <button
          type="submit"
          disabled={addStudent.isPending || !studentId.trim()}
          className="h-9 px-3 text-[12px] font-medium bg-black text-white rounded-lg disabled:opacity-50 hover:bg-black/90 transition-colors shrink-0"
        >
          {addStudent.isPending ? '...' : 'Add'}
        </button>
      </form>

      {isLoading ? (
        <p className="text-[12px] text-[#9CA3AF]">Loading...</p>
      ) : students.length === 0 ? (
        <p className="text-[12px] text-[#9CA3AF]">No students in this cohort yet.</p>
      ) : (
        <div className="space-y-1">
          {students.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-1.5">
              <div className="min-w-0">
                <p className="text-[12px] text-[#111] truncate">{s.student.full_name}</p>
                <p className="text-[11px] text-[#9CA3AF] truncate">{s.student.email}</p>
              </div>
              <button
                onClick={() => handleRemove(s)}
                disabled={removeStudent.isPending}
                className="text-[11px] text-[#9CA3AF] hover:text-red-600 transition-colors ml-4 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Cohort Card ──────────────────────────────────────────────────
function CohortCard({ cohort, classId }: { cohort: Cohort; classId: string }) {
  const [showStudents, setShowStudents] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const deleteCohort = useDeleteCohort(classId)
  const createInvite = useCreateTaInvite()

  const handleDelete = async () => {
    if (!confirm(`Delete "${cohort.name}"? This cannot be undone.`)) return
    try {
      await deleteCohort.mutateAsync(cohort.id)
      toast.success('Cohort deleted')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to delete cohort')
    }
  }

  const handleGenerateInvite = async () => {
    try {
      const result = await createInvite.mutateAsync({ cohort_id: cohort.id })
      setGeneratedCode(result.code)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to generate invite code')
    }
  }

  const handleCopyCode = () => {
    if (!generatedCode) return
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    toast.success('Invite code copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-medium text-[#111] truncate">{cohort.name}</h3>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                {cohort.ta ? cohort.ta.full_name : 'No tutor assigned'}
              </p>
              {cohort.zoom_link && (
                <a
                  href={cohort.zoom_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#8B1A2F] hover:underline mt-0.5 block truncate"
                >
                  Zoom link
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowEdit(true)}
                className="text-[11px] text-[#6B7280] hover:text-[#111] transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteCohort.isPending}
                className="text-[11px] text-[#9CA3AF] hover:text-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setShowStudents((v) => !v)}
              className="h-7 px-3 text-[11px] border border-[#E5E5E5] rounded-lg text-[#6B7280] hover:bg-[#F8F8F8] transition-colors"
            >
              {showStudents ? 'Hide students' : 'Manage students'}
            </button>
            <button
              onClick={handleGenerateInvite}
              disabled={createInvite.isPending}
              className="h-7 px-3 text-[11px] border border-[#E5E5E5] rounded-lg text-[#6B7280] hover:bg-[#F8F8F8] transition-colors flex items-center gap-1.5"
            >
              {createInvite.isPending ? 'Generating...' : 'Generate TA invite'}
            </button>
          </div>

          {generatedCode && (
            <div className="mt-3 flex items-center gap-2 bg-[#F8F8F8] rounded-lg px-3 py-2">
              <span className="text-[11px] text-[#9CA3AF] uppercase tracking-wider shrink-0">TA code</span>
              <span className="flex-1 text-[13px] font-mono text-[#111] tracking-widest">{generatedCode}</span>
              <button
                onClick={handleCopyCode}
                className="text-[11px] font-medium text-[#8B1A2F] hover:underline shrink-0"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => setGeneratedCode(null)}
                className="text-[#9CA3AF] hover:text-[#111] transition-colors shrink-0 ml-1"
                aria-label="Dismiss"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </button>
            </div>
          )}

          {showStudents && (
            <CohortStudentsPanel cohort={cohort} onClose={() => setShowStudents(false)} />
          )}
        </div>
      </div>

      {showEdit && (
        <EditCohortModal
          cohort={cohort}
          classId={classId}
          open={showEdit}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────
export default function CohortsPageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params)
  const router = useRouter()
  const { data: classData, isLoading: isClassLoading } = useClass(classId)
  const { data: cohorts = [], isLoading: isCohortsLoading } = useCohorts(classId)
  const [showCreate, setShowCreate] = useState(false)

  const isLoading = isClassLoading || isCohortsLoading

  return (
    <div className="p-8">
      <nav className="flex items-center gap-2 text-[12px] text-[#9CA3AF] mb-6">
        <button
          onClick={() => router.push('/admin/classes')}
          className="hover:text-[#111] transition-colors"
        >
          Classes
        </button>
        <span>/</span>
        <button
          onClick={() => router.push(`/admin/classes/${classId}/cohorts`)}
          className="hover:text-[#111] transition-colors"
        >
          {isClassLoading ? (
            <span className="inline-block w-24 h-3 bg-[#E5E5E5] rounded animate-pulse align-middle" />
          ) : (
            classData?.title ?? '...'
          )}
        </button>
        <span>/</span>
        <span className="text-[#111]">Cohorts</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-medium text-[#111]">Cohorts</h1>
          <p className="text-[12px] text-[#9CA3AF] mt-0.5">
            Each cohort is assigned to a tutor and has its own student roster.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg hover:bg-black/90 transition-colors shrink-0"
        >
          + New cohort
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : cohorts.length === 0 ? (
        <EmptyState
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          title="No cohorts yet"
          description="Create cohorts to divide students into groups, each managed by a tutor."
          actionLabel="Create cohort"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="space-y-4">
          {cohorts.map((cohort) => (
            <CohortCard key={cohort.id} cohort={cohort} classId={classId} />
          ))}
        </div>
      )}

      <CreateCohortModal
        classId={classId}
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  )
}
