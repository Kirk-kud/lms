'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { useMyAllAssignments, AssignmentWithClass } from '@/lib/hooks/useAssignments'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarPageClient() {
  const router = useRouter()
  const { user } = useUser()
  const { data: assignments, isLoading } = useMyAllAssignments(user?.id ?? '')

  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const today = new Date()

  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const assignmentsByDay = new Map<number, AssignmentWithClass[]>()
  assignments.forEach((a) => {
    const d = new Date(a.due_date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!assignmentsByDay.has(day)) assignmentsByDay.set(day, [])
      assignmentsByDay.get(day)!.push(a)
    }
  })

  const selectedAssignments = selectedDay ? (assignmentsByDay.get(selectedDay) ?? []) : []

  return (
    <div className="p-4 sm:p-8">
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0A0A0B', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 6px' }}>
          Calendar
        </h1>
        <p style={{ fontSize: '13.5px', color: '#9C949A', margin: 0 }}>
          Your assignment due dates, at a glance
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard lines={6} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Calendar grid */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE6E0', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #ECE6E0' }}>
              <button
                onClick={() => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null) }}
                style={{ background: 'none', border: '1px solid #ECE6E0', cursor: 'pointer', padding: '6px 12px', color: '#6B6168', fontSize: '14px', borderRadius: '6px' }}
              >
                ‹
              </button>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0A0A0B', margin: 0 }}>
                {MONTH_NAMES[month]} {year}
              </h2>
              <button
                onClick={() => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null) }}
                style={{ background: 'none', border: '1px solid #ECE6E0', cursor: 'pointer', padding: '6px 12px', color: '#6B6168', fontSize: '14px', borderRadius: '6px' }}
              >
                ›
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '12px 16px 4px' }}>
              {DAY_LABELS.map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#9C949A', paddingBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 16px 20px', gap: '4px' }}>
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />
                const isCurrentDay = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                const hasAssignments = assignmentsByDay.has(day)
                const isSelected = selectedDay === day

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', padding: '10px 4px', borderRadius: '8px',
                      border: isCurrentDay && !isSelected ? '1.5px solid #8B1A2F' : '1.5px solid transparent',
                      cursor: 'pointer',
                      background: isSelected ? '#8B1A2F' : hasAssignments ? 'rgba(139,26,47,0.05)' : 'transparent',
                      gap: '4px', minHeight: '52px',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(139,26,47,0.08)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? '#8B1A2F' : hasAssignments ? 'rgba(139,26,47,0.05)' : 'transparent' }}
                  >
                    <span style={{
                      fontSize: '14px', fontWeight: isCurrentDay || isSelected ? 700 : 400,
                      color: isSelected ? '#FFFFFF' : isCurrentDay ? '#8B1A2F' : '#0A0A0B',
                      lineHeight: 1,
                    }}>
                      {day}
                    </span>
                    {hasAssignments && (
                      <span style={{
                        width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : '#8B1A2F',
                      }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Month summary */}
            <div style={{ borderTop: '1px solid #ECE6E0', padding: '12px 24px', display: 'flex', gap: '16px' }}>
              <span style={{ fontSize: '12px', color: '#9C949A' }}>
                <strong style={{ color: '#0A0A0B' }}>{assignmentsByDay.size}</strong> days with due dates this month
              </span>
              <span style={{ fontSize: '12px', color: '#9C949A' }}>
                <strong style={{ color: '#0A0A0B' }}>
                  {Array.from(assignmentsByDay.values()).reduce((sum, a) => sum + a.length, 0)}
                </strong> total assignments
              </span>
            </div>
          </div>

          {/* Day detail panel */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE6E0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #ECE6E0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0A0A0B', margin: 0 }}>
                {selectedDay
                  ? `${MONTH_NAMES[month]} ${selectedDay}`
                  : 'Select a day'}
              </h3>
            </div>

            {!selectedDay && (
              <p style={{ padding: '24px 20px', fontSize: '13px', color: '#9C949A', margin: 0 }}>
                Click any day on the calendar to see its assignments.
              </p>
            )}

            {selectedDay && selectedAssignments.length === 0 && (
              <p style={{ padding: '24px 20px', fontSize: '13px', color: '#9C949A', margin: 0 }}>
                No assignments due on this day.
              </p>
            )}

            {selectedDay && selectedAssignments.map((a) => {
              const isPast = new Date(a.due_date) < new Date()
              return (
                <button
                  key={a.id}
                  onClick={() => router.push(`/student/classes/${a.class_id}/assignments`)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none',
                    border: 'none', borderBottom: '1px solid #F3F4F6',
                    padding: '14px 20px', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF7F4')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#0A0A0B', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.title}
                      </p>
                      <span style={{
                        fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.06em', color: '#8B1A2F',
                        background: 'rgba(139,26,47,0.07)', padding: '2px 7px', borderRadius: '4px',
                      }}>
                        {a.class_title}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: 600, flexShrink: 0,
                      color: isPast ? '#B0182E' : '#1F8B4C',
                      background: isPast ? 'rgba(176,24,46,0.08)' : 'rgba(31,139,76,0.08)',
                      padding: '3px 8px', borderRadius: '4px',
                    }}>
                      {a.submission ? 'Submitted' : isPast ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
