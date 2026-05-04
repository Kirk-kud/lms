'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday, isTomorrow, startOfDay, endOfWeek } from 'date-fns'
import { useMyAllAssignments } from '@/lib/hooks/useAssignments'
import { useUser } from '@/lib/hooks/useUser'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import type { AssignmentWithClass } from '@/lib/hooks/useAssignments'

type Group = 'overdue' | 'today' | 'this-week' | 'later'

function groupAssignment(a: AssignmentWithClass, now: Date): Group {
  const due = new Date(a.due_date)
  if (due < startOfDay(now)) return 'overdue'
  if (isToday(due)) return 'today'
  if (due <= endOfWeek(now, { weekStartsOn: 1 })) return 'this-week'
  return 'later'
}

const GROUP_META: Record<Group, { label: string; color: string }> = {
  overdue: { label: 'Overdue', color: '#B0182E' },
  today: { label: 'Due today', color: '#B6791D' },
  'this-week': { label: 'Due this week', color: '#0A0A0B' },
  later: { label: 'Later', color: '#6B6168' },
}

const GROUP_ORDER: Group[] = ['overdue', 'today', 'this-week', 'later']

function TodoRow({
  assignment,
  group,
  onClick,
}: {
  assignment: AssignmentWithClass
  group: Group
  onClick: () => void
}) {
  const [hovered, setHovered] = React.useState(false)
  const due = new Date(assignment.due_date)
  const dueLabel = isToday(due)
    ? 'Today'
    : isTomorrow(due)
    ? 'Tomorrow'
    : format(due, 'EEE, d MMM')

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '13px 20px',
        background: hovered ? '#FAF7F4' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        gap: '14px',
        textAlign: 'left',
        transition: 'background 100ms ease',
      }}
    >
      {/* Checkbox visual */}
      <div
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '4px',
          border: `1.5px solid ${group === 'overdue' ? '#B0182E' : '#D0C8C6'}`,
          flexShrink: 0,
          background: 'transparent',
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13.5px', fontWeight: 500, color: '#0A0A0B', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {assignment.title}
        </p>
        <p style={{ fontSize: '11.5px', color: '#9C949A', margin: 0 }}>
          {assignment.class_title}
        </p>
      </div>

      <span
        style={{
          fontSize: '11.5px',
          color: group === 'overdue' ? '#B0182E' : '#6B6168',
          fontWeight: group === 'overdue' ? 600 : 400,
          flexShrink: 0,
        }}
      >
        {dueLabel}
      </span>

      <svg
        width="13"
        height="13"
        viewBox="0 0 13 13"
        fill="none"
        style={{ flexShrink: 0, color: '#9C949A', opacity: hovered ? 1 : 0, transition: 'opacity 100ms' }}
      >
        <path d="M5 2l4 4.5L5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export default function TodoPageClient() {
  const router = useRouter()
  const { user } = useUser()
  const { data: assignments = [], isLoading } = useMyAllAssignments(user?.id ?? '')
  const now = new Date()

  const pending = assignments.filter((a) => !a.submission)
  const grouped: Record<Group, AssignmentWithClass[]> = {
    overdue: [],
    today: [],
    'this-week': [],
    later: [],
  }
  for (const a of pending) {
    grouped[groupAssignment(a, now)].push(a)
  }
  for (const g of GROUP_ORDER) {
    grouped[g].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  }

  const totalPending = pending.length
  const overdueCount = grouped.overdue.length

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-[22px] sm:text-[28px]" style={{ fontWeight: 700, color: '#0A0A0B', letterSpacing: '-0.02em', margin: 0 }}>
          To-do
        </h1>
        {!isLoading && (
          <p style={{ fontSize: '13px', color: '#9C949A', margin: '4px 0 0' }}>
            {totalPending === 0
              ? 'All caught up — nothing pending!'
              : `${totalPending} pending${overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}`}
          </p>
        )}
      </div>

      {isLoading && <SkeletonCard lines={5} />}

      {!isLoading && totalPending === 0 && (
        <div
          style={{
            border: '1px dashed #E5E5E5',
            borderRadius: '12px',
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(31,139,76,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F8B4C" strokeWidth="1.8">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0B', margin: '0 0 4px' }}>All done!</p>
          <p style={{ fontSize: '13px', color: '#9C949A', margin: 0 }}>Nothing pending across all your classes.</p>
        </div>
      )}

      {!isLoading && totalPending > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {GROUP_ORDER.map((group) => {
            const items = grouped[group]
            if (items.length === 0) return null
            const meta = GROUP_META[group]
            return (
              <div
                key={group}
                style={{
                  border: '1px solid #ECE6E0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                }}
              >
                {/* Section header */}
                <div
                  style={{
                    padding: '10px 20px',
                    borderBottom: '1px solid #ECE6E0',
                    background: '#FAF7F4',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: meta.color,
                    }}
                  >
                    {meta.label}
                  </span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: meta.color,
                      background: group === 'overdue' ? 'rgba(176,24,46,0.1)' : 'rgba(10,10,11,0.06)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {items.length}
                  </span>
                </div>

                {/* Rows */}
                {items.map((a, i) => (
                  <div
                    key={a.id}
                    style={{ borderBottom: i < items.length - 1 ? '1px solid #ECE6E0' : 'none' }}
                  >
                    <TodoRow
                      assignment={a}
                      group={group}
                      onClick={() => router.push(`/student/classes/${a.class_id}/assignments/${a.id}`)}
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
