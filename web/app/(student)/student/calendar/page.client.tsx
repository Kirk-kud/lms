'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { useMyAllAssignments } from '@/lib/hooks/useAssignments'
import { useUser } from '@/lib/hooks/useUser'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarPageClient() {
  const router = useRouter()
  const { user } = useUser()
  const { data: assignments = [], isLoading } = useMyAllAssignments(user?.id ?? '')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const assignmentsByDay = new Map<string, typeof assignments>()
  for (const a of assignments) {
    const key = format(new Date(a.due_date), 'yyyy-MM-dd')
    assignmentsByDay.set(key, [...(assignmentsByDay.get(key) ?? []), a])
  }

  const selectedKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const selectedAssignments = selectedKey ? (assignmentsByDay.get(selectedKey) ?? []) : []

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0A0A0B', letterSpacing: '-0.02em', margin: 0 }}>
            Calendar
          </h1>
          <p style={{ fontSize: '13px', color: '#9C949A', margin: '4px 0 0' }}>
            Assignment due dates across all your classes
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            style={{
              width: '32px', height: '32px', border: '1px solid #E5E5E5',
              borderRadius: '7px', background: '#FFF', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6168',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF7F4')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFF')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0B', minWidth: '130px', textAlign: 'center' }}>
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            style={{
              width: '32px', height: '32px', border: '1px solid #E5E5E5',
              borderRadius: '7px', background: '#FFF', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6168',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF7F4')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFF')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {isLoading && <SkeletonCard lines={6} />}

      {!isLoading && (
        <div
          style={{
            border: '1px solid #ECE6E0',
            borderRadius: '10px',
            overflow: 'hidden',
            background: '#FFFFFF',
          }}
        >
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #ECE6E0' }}>
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                style={{
                  padding: '10px 0',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#9C949A',
                  borderRight: '1px solid #ECE6E0',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {days.map((day, i) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayAssignments = assignmentsByDay.get(key) ?? []
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
              const today = isToday(day)
              const isLastRow = i >= days.length - 7

              return (
                <button
                  key={key}
                  onClick={() => {
                    if (dayAssignments.length > 0) {
                      setSelectedDay(isSelected ? null : day)
                    }
                  }}
                  style={{
                    minHeight: '80px',
                    padding: '8px',
                    borderRight: (i + 1) % 7 !== 0 ? '1px solid #ECE6E0' : 'none',
                    borderBottom: !isLastRow ? '1px solid #ECE6E0' : 'none',
                    background: isSelected ? 'rgba(139,26,47,0.04)' : 'transparent',
                    cursor: dayAssignments.length > 0 ? 'pointer' : 'default',
                    textAlign: 'left',
                    verticalAlign: 'top',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'background 100ms ease',
                  }}
                >
                  {/* Day number */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: today ? 700 : 400,
                      color: !isCurrentMonth
                        ? '#D0C8C6'
                        : today
                        ? '#FFFFFF'
                        : '#0A0A0B',
                      background: today ? '#8B1A2F' : 'transparent',
                      flexShrink: 0,
                    }}
                  >
                    {format(day, 'd')}
                  </div>

                  {/* Assignment chips */}
                  {dayAssignments.slice(0, 3).map((a) => {
                    const now = new Date()
                    const overdue = new Date(a.due_date) < now && !a.submission
                    const submitted = !!a.submission
                    const bg = submitted ? 'rgba(31,139,76,0.1)' : overdue ? 'rgba(176,24,46,0.1)' : 'rgba(139,26,47,0.08)'
                    const color = submitted ? '#1F8B4C' : overdue ? '#B0182E' : '#8B1A2F'
                    return (
                      <div
                        key={a.id}
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color,
                          background: bg,
                          borderRadius: '4px',
                          padding: '2px 5px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                        }}
                      >
                        {a.title}
                      </div>
                    )
                  })}
                  {dayAssignments.length > 3 && (
                    <div style={{ fontSize: '10px', color: '#9C949A', paddingLeft: '2px' }}>
                      +{dayAssignments.length - 3} more
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected day detail */}
      {selectedDay && selectedAssignments.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            border: '1px solid #ECE6E0',
            borderRadius: '10px',
            overflow: 'hidden',
            background: '#FFFFFF',
          }}
        >
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #ECE6E0', background: '#FAF7F4' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0B', margin: 0 }}>
              {format(selectedDay, 'EEEE, d MMMM')}
            </p>
          </div>
          {selectedAssignments.map((a, i) => {
            const now = new Date()
            const overdue = new Date(a.due_date) < now && !a.submission
            const submitted = !!a.submission
            const statusColor = submitted ? '#1F8B4C' : overdue ? '#B0182E' : '#B6791D'
            const statusLabel = submitted ? 'Submitted' : overdue ? 'Overdue' : 'Pending'
            const statusBg = submitted ? 'rgba(31,139,76,0.08)' : overdue ? 'rgba(176,24,46,0.08)' : 'rgba(182,121,29,0.08)'

            return (
              <button
                key={a.id}
                onClick={() => router.push(`/student/classes/${a.class_id}/assignments/${a.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '14px 18px',
                  borderBottom: i < selectedAssignments.length - 1 ? '1px solid #ECE6E0' : 'none',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  gap: '12px',
                  textAlign: 'left',
                  transition: 'background 100ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF7F4')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '13.5px', fontWeight: 500, color: '#0A0A0B', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.title}
                  </p>
                  <p style={{ fontSize: '11.5px', color: '#9C949A', margin: 0 }}>
                    {a.class_title}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: statusColor,
                    background: statusBg,
                    padding: '3px 9px',
                    borderRadius: '4px',
                    flexShrink: 0,
                  }}
                >
                  {statusLabel}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
