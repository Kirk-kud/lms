'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useTutorClass } from '@/lib/contexts/TutorClassContext'
import { useCohortStudents, useAddCohortStudent, useRemoveCohortStudent, type CohortStudent } from '@/lib/hooks/useCohorts'
import { useSearchableStudents, type SearchableStudent } from '@/lib/hooks/useClasses'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'
import { ApiError } from '@/lib/api'

const inputStyle: React.CSSProperties = {
  height: '36px',
  borderRadius: '8px',
  border: '0.5px solid #E5E5E5',
  padding: '0 10px',
  outline: 'none',
  fontSize: '13px',
  backgroundColor: '#FFFFFF',
  width: '100%',
  boxSizing: 'border-box',
}

function focusInput(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#8B1A2F'
  e.currentTarget.style.borderWidth = '1px'
}
function blurInput(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#E5E5E5'
  e.currentTarget.style.borderWidth = '0.5px'
}

function StudentSearchInput({
  classId,
  onSelect,
}: {
  classId: string
  onSelect: (student: SearchableStudent) => void
}) {
  const [query, setQuery] = useState('')
  const { data: results = [], isFetching } = useSearchableStudents(classId, query)
  const [open, setOpen] = useState(false)

  const handleSelect = (s: SearchableStudent) => {
    onSelect(s)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={(e) => { setOpen(true); focusInput(e) }}
        onBlur={(e) => { setTimeout(() => setOpen(false), 150); blurInput(e) }}
        placeholder="Search by name or email..."
        style={{ ...inputStyle, paddingRight: isFetching ? '32px' : '10px' }}
      />
      {isFetching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <LoadingSpinner />
        </div>
      )}
      {open && query.trim().length >= 2 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-[#E5E5E5] rounded-lg shadow-sm overflow-hidden">
          {results.length === 0 && !isFetching ? (
            <p className="text-[12px] text-[#9CA3AF] px-3 py-2">No students found</p>
          ) : (
            results.map((s) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={() => handleSelect(s)}
                className="w-full text-left px-3 py-2 hover:bg-[#F8F8F8] transition-colors"
              >
                <p className="text-[13px] text-[#111]">{s.full_name}</p>
                <p className="text-[11px] text-[#9CA3AF]">{s.email}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function TutorCohortClient() {
  const { selectedClass, cohortId } = useTutorClass()
  const classId = selectedClass?.id ?? ''
  const cohortName = selectedClass?.cohort_name ?? 'My Cohort'

  const { data: students = [], isLoading: studentsLoading } = useCohortStudents(cohortId ?? '')
  const addStudent = useAddCohortStudent(cohortId ?? '')
  const removeStudent = useRemoveCohortStudent(cohortId ?? '')

  const [search, setSearch] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)

  const filtered = students.filter(
    (s) =>
      s.student.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student.email.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSelect = async (student: SearchableStudent) => {
    try {
      await addStudent.mutateAsync(student.id)
      toast.success(`${student.full_name} added to cohort`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to add student')
    }
  }

  const handleRemove = async (s: CohortStudent) => {
    setRemoving(s.student.id)
    try {
      await removeStudent.mutateAsync(s.student.id)
      toast.success(`${s.student.full_name} removed from cohort`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to remove student')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF] mb-1">Cohort</p>
        <h1 className="text-[28px] font-semibold text-[#111111]">{cohortName}</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">{students.length} student{students.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Add student */}
      <div className="border border-[#E5E5E5] rounded-xl p-4 mb-6">
        <p className="text-[12px] font-medium text-[#111] mb-3">Add student by name</p>
        <StudentSearchInput classId={classId} onSelect={handleSelect} />
        {addStudent.isPending && (
          <p className="text-[11px] text-[#9CA3AF] mt-2 flex items-center gap-1.5">
            <LoadingSpinner /> Adding student...
          </p>
        )}
        <p className="text-[11px] text-[#9CA3AF] mt-2">Search registered students not yet enrolled in this class.</p>
      </div>

      {/* Search + list */}
      <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E5E5] bg-[#F8F8F8]">
          <input
            style={{ ...inputStyle, width: '100%' }}
            placeholder="Filter enrolled students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={focusInput}
            onBlur={blurInput}
          />
        </div>

        {studentsLoading ? (
          <div className="p-4"><SkeletonCard lines={3} /></div>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-[13px] text-[#9CA3AF] text-center">
            {search ? 'No students match your search.' : 'No students in this cohort yet.'}
          </p>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6] last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium text-white shrink-0"
                  style={{ backgroundColor: '#8B1A2F' }}
                >
                  {s.student.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#111] truncate">{s.student.full_name}</p>
                  <p className="text-[11px] text-[#9CA3AF] truncate">{s.student.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(s)}
                disabled={removing === s.student.id}
                className="text-[12px] text-[#9CA3AF] hover:text-[#991B1B] transition-colors shrink-0 ml-4 disabled:opacity-50"
              >
                {removing === s.student.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
