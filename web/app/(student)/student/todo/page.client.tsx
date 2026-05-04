'use client'

import { useRouter } from 'next/navigation'
import { format, isToday, isTomorrow, isFuture, isPast } from 'date-fns'
import { useUser } from '@/lib/hooks/useUser'
import { useMyAllAssignments, AssignmentWithClass } from '@/lib/hooks/useAssignments'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'

function dueDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEE, d MMM')
}

function AssignmentCard({
  a,
  isOverdue,
  onClick,
}: {
  a: AssignmentWithClass
  isOverdue: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'flex-start',
        gap: '14px', padding: '16px 20px', background: 'none', border: 'none',
        borderBottom: '1px solid #F3F4F6', cursor: 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF7F4')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', flexShrink: 0,
        backgroundColor: isOverdue ? '#B0182E' : '#8B1A2F',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0B', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {a.title}
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: '#8B1A2F',
            background: 'rgba(139,26,47,0.07)', padding: '2px 8px', borderRadius: '4px',
          }}>
            {a.class_title}
          </span>
          <span style={{ fontSize: '12.5px', color: isOverdue ? '#B0182E' : '#6B6168' }}>
            {isOverdue ? 'Was due ' : 'Due '}
            {dueDateLabel(a.due_date)}
          </span>
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '2px', color: '#9C949A' }}>
        <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export default function TodoPageClient() {
  const router = useRouter()
  const { user } = useUser()
  const { data: assignments, isLoading } = useMyAllAssignments(user?.id ?? '')

  const pending = assignments
    .filter((a) => !a.submission && isFuture(new Date(a.due_date)))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

  const overdue = assignments
    .filter((a) => !a.submission && isPast(new Date(a.due_date)))
    .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())

  const total = pending.length + overdue.length

  return (
    <div className="p-4 sm:p-8">
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0A0A0B', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
            To-do
          </h1>
          {!isLoading && total > 0 && (
            <span style={{
              fontSize: '12px', fontWeight: 600, color: '#8B1A2F',
              background: 'rgba(139,26,47,0.08)', padding: '3px 10px',
              borderRadius: '999px', marginBottom: '2px',
            }}>
              {total} remaining
            </span>
          )}
        </div>
        <p style={{ fontSize: '13.5px', color: '#9C949A', margin: '6px 0 0' }}>
          Your pending assignments across all classes
        </p>
      </div>

      {isLoading && <SkeletonCard lines={5} />}

      {!isLoading && total === 0 && (
        <div style={{
          border: '1px dashed #ECE6E0', borderRadius: '12px',
          padding: '64px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            backgroundColor: 'rgba(139,26,47,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0B', margin: '0 0 6px' }}>All caught up!</p>
          <p style={{ fontSize: '13.5px', color: '#9C949A', margin: 0 }}>No pending assignments right now.</p>
        </div>
      )}

      {!isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {overdue.length > 0 && (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE6E0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #ECE6E0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#B0182E', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Overdue
                </h2>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: '#B0182E',
                  background: 'rgba(176,24,46,0.1)', padding: '2px 8px', borderRadius: '999px',
                }}>
                  {overdue.length}
                </span>
              </div>
              {overdue.map((a) => (
                <AssignmentCard
                  key={a.id}
                  a={a}
                  isOverdue
                  onClick={() => router.push(`/student/classes/${a.class_id}/assignments`)}
                />
              ))}
            </div>
          )}

          {pending.length > 0 && (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE6E0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #ECE6E0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#0A0A0B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Upcoming
                </h2>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: '#6B6168',
                  background: '#F3F4F6', padding: '2px 8px', borderRadius: '999px',
                }}>
                  {pending.length}
                </span>
              </div>
              {pending.map((a) => (
                <AssignmentCard
                  key={a.id}
                  a={a}
                  isOverdue={false}
                  onClick={() => router.push(`/student/classes/${a.class_id}/assignments`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
