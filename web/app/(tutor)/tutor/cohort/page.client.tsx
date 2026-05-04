'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useUser } from '@/lib/hooks/useUser'
import { useClasses } from '@/lib/hooks/useClasses'
import { useCohortStudents, useAddCohortStudent, useRemoveCohortStudent } from '@/lib/hooks/useCohorts'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
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
}

export default function TutorCohortClient() {
  const { user } = useUser()
  const { data: classes = [], isLoading: classesLoading } = useClasses()
  const cls = classes[0] as (typeof classes[0] & { cohort_id?: string; cohort_name?: string }) | undefined
  const cohortId = (cls as { cohort_id?: string } | undefined)?.cohort_id ?? ''
  const cohortName = (cls as { cohort_name?: string } | undefined)?.cohort_name ?? 'My Cohort'

  const { data: students = [], isLoading: studentsLoading } = useCohortStudents(cohortId)
  const addStudent = useAddCohortStudent(cohortId)
  const removeStudent = useRemoveCohortStudent(cohortId)

  const [studentId, setStudentId] = useState('')
  const [search, setSearch] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)

  const filtered = students.filter(
    (s) =>
      s.student.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student.email.toLowerCase().includes(search.toLowerCase()),
  )

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId.trim()) return
    try {
      await addStudent.mutateAsync(studentId.trim())
      setStudentId('')
      toast.success('Student added to cohort')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to add student')
    }
  }

  const handleRemove = async (sId: string, name: string) => {
    setRemoving(sId)
    try {
      await removeStudent.mutateAsync(sId)
      toast.success(`${name} removed from cohort`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to remove student')
    } finally {
      setRemoving(null)
    }
  }

  const isLoading = classesLoading || studentsLoading

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF] mb-1">Cohort</p>
        <h1 className="text-[28px] font-semibold text-[#111111]">{cohortName}</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">{students.length} student{students.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Add student */}
      <div className="border border-[#E5E5E5] rounded-xl p-4 mb-6">
        <p className="text-[12px] font-medium text-[#111] mb-3">Add student by ID</p>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            style={inputStyle}
            placeholder="Paste student user ID…"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#8B1A2F'; e.currentTarget.style.borderWidth = '1px' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E5E5'; e.currentTarget.style.borderWidth = '0.5px' }}
          />
          <button
            type="submit"
            disabled={addStudent.isPending || !studentId.trim()}
            style={{
              height: '36px',
              padding: '0 16px',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: addStudent.isPending ? 'not-allowed' : 'pointer',
              opacity: addStudent.isPending ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {addStudent.isPending ? 'Adding…' : 'Add'}
          </button>
        </form>
        <p className="text-[11px] text-[#9CA3AF] mt-2">The student must already have an account. Copy their user ID from the Supabase dashboard or ask the admin.</p>
      </div>

      {/* Search + list */}
      <div className="border border-[#E5E5E5] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E5E5] bg-[#F8F8F8]">
          <input
            style={{ ...inputStyle, width: '100%' }}
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#8B1A2F'; e.currentTarget.style.borderWidth = '1px' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E5E5'; e.currentTarget.style.borderWidth = '0.5px' }}
          />
        </div>

        {isLoading ? (
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
                onClick={() => handleRemove(s.student.id, s.student.full_name)}
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
