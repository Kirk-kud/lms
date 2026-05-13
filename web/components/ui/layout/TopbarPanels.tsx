'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow, isToday, isFuture, isPast } from 'date-fns'
import { useMyAllAssignments, AssignmentWithClass } from '@/lib/hooks/useAssignments'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/lib/hooks/useNotifications'
import { useAnnouncements, useCreateAnnouncement } from '@/lib/hooks/useAnnouncements'
import { useClasses } from '@/lib/hooks/useClasses'

// ─── Shared panel shell ───────────────────────────────────────────────────────

function Panel({
  title,
  onClose,
  actions,
  children,
}: {
  title: string
  onClose: () => void
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 44, background: 'rgba(10,10,11,0.18)' }}
      />
      {/* Drawer */}
      <div
        role="dialog"
        aria-label={title}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(400px, 100vw)',
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid #ECE6E0',
          zIndex: 45,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #ECE6E0',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0A0A0B', margin: 0 }}>
              {title}
            </h2>
            {actions}
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: '1px solid #ECE6E0', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#6B6168', flexShrink: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </>
  )
}

function EmptySlate({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        backgroundColor: 'rgba(139,26,47,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px',
      }}>
        {icon}
      </div>
      <p style={{ fontSize: '13px', color: '#9C949A', margin: 0 }}>{text}</p>
    </div>
  )
}

// ─── Calendar panel ───────────────────────────────────────────────────────────

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function CalendarPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data: assignments } = useMyAllAssignments(userId)
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const router = useRouter()

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
    <Panel title="Calendar" onClose={onClose}>
      {/* Month nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 12px',
      }}>
        <button
          onClick={() => { setViewDate(new Date(year, month - 1, 1)); setSelectedDay(null) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#6B6168', fontSize: '16px', borderRadius: '4px' }}
        >‹</button>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0B' }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={() => { setViewDate(new Date(year, month + 1, 1)); setSelectedDay(null) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#6B6168', fontSize: '16px', borderRadius: '4px' }}
        >›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 16px' }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: '#9C949A', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 16px 16px', gap: '2px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const isCurrentDay = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const hasAssignments = assignmentsByDay.has(day)
          const isSelected = selectedDay === day

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '6px 2px', borderRadius: '6px',
                border: 'none', cursor: hasAssignments ? 'pointer' : 'default',
                background: isSelected ? '#8B1A2F' : isCurrentDay ? 'rgba(139,26,47,0.08)' : 'transparent',
                gap: '3px',
              }}
            >
              <span style={{
                fontSize: '12.5px', fontWeight: isCurrentDay || isSelected ? 700 : 400,
                color: isSelected ? '#FFFFFF' : isCurrentDay ? '#8B1A2F' : '#0A0A0B',
                lineHeight: 1,
              }}>
                {day}
              </span>
              {hasAssignments && (
                <span style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  backgroundColor: isSelected ? '#FFFFFF' : '#8B1A2F',
                  flexShrink: 0,
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day assignments */}
      {selectedDay && (
        <div style={{ borderTop: '1px solid #ECE6E0', padding: '16px 20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9C949A', margin: '0 0 10px' }}>
            {MONTH_NAMES[month]} {selectedDay}
          </p>
          {selectedAssignments.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9C949A', margin: 0 }}>No assignments due</p>
          ) : (
            selectedAssignments.map((a) => (
              <button
                key={a.id}
                onClick={() => { router.push(`/student/classes/${a.class_id}/assignments`); onClose() }}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: '1px solid #ECE6E0',
                  borderRadius: '6px', padding: '10px 12px', cursor: 'pointer', marginBottom: '6px',
                }}
              >
                <p style={{ fontSize: '12.5px', fontWeight: 600, color: '#0A0A0B', margin: '0 0 3px' }}>{a.title}</p>
                <p style={{ fontSize: '11px', color: '#9C949A', margin: 0 }}>{a.class_title}</p>
              </button>
            ))
          )}
        </div>
      )}

      {/* Monthly summary */}
      {assignmentsByDay.size === 0 && (
        <EmptySlate
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
          text="No assignments due this month"
        />
      )}
    </Panel>
  )
}

// ─── Todo panel ───────────────────────────────────────────────────────────────

export function TodoPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data: assignments, isLoading } = useMyAllAssignments(userId)
  const router = useRouter()

  const pending = assignments
    .filter((a) => !a.submission && isFuture(new Date(a.due_date)))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

  const overdue = assignments
    .filter((a) => !a.submission && isPast(new Date(a.due_date)))
    .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())

  const AssignmentRow = ({ a, isOverdue }: { a: AssignmentWithClass; isOverdue: boolean }) => (
    <button
      onClick={() => { router.push(`/student/classes/${a.class_id}/assignments`); onClose() }}
      style={{
        width: '100%', textAlign: 'left', background: 'none',
        border: 'none', borderBottom: '1px solid #F3F4F6',
        padding: '12px 20px', cursor: 'pointer', display: 'flex',
        alignItems: 'flex-start', gap: '12px',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF7F4')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <div style={{
        width: '6px', height: '6px', borderRadius: '50', marginTop: '5px', flexShrink: 0,
        backgroundColor: isOverdue ? '#B0182E' : '#8B1A2F',
      }} />
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0B', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {a.title}
        </p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: '#8B1A2F',
            background: 'rgba(139,26,47,0.07)', padding: '2px 7px', borderRadius: '4px',
          }}>
            {a.class_title}
          </span>
          <span style={{ fontSize: '11.5px', color: isOverdue ? '#B0182E' : '#9C949A' }}>
            {isOverdue ? 'Was due ' : 'Due '}
            {isToday(new Date(a.due_date)) ? 'today' : format(new Date(a.due_date), 'EEE, d MMM')}
          </span>
        </div>
      </div>
    </button>
  )

  if (isLoading) {
    return (
      <Panel title="To-do" onClose={onClose}>
        <div style={{ padding: '24px 20px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: '52px', borderRadius: '6px', backgroundColor: '#F3F4F6', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </Panel>
    )
  }

  if (pending.length === 0 && overdue.length === 0) {
    return (
      <Panel title="To-do" onClose={onClose}>
        <EmptySlate
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>}
          text="All caught up — nothing pending!"
        />
      </Panel>
    )
  }

  return (
    <Panel title="To-do" onClose={onClose}>
      {overdue.length > 0 && (
        <>
          <div style={{ padding: '14px 20px 6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#B0182E' }}>
            Overdue · {overdue.length}
          </div>
          {overdue.map((a) => <AssignmentRow key={a.id} a={a} isOverdue />)}
        </>
      )}
      {pending.length > 0 && (
        <>
          <div style={{ padding: '14px 20px 6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9C949A' }}>
            Upcoming · {pending.length}
          </div>
          {pending.map((a) => <AssignmentRow key={a.id} a={a} isOverdue={false} />)}
        </>
      )}
      <div style={{ height: '16px' }} />
    </Panel>
  )
}

// ─── Notifications panel ──────────────────────────────────────────────────────

function notifIcon(type: string) {
  if (type === 'new_assignment') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5">
      <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-9.1 4a2 2 0 0 1-1.8 0"/>
    </svg>
  )
}

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { data: notifications = [], isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Panel
      title="Notifications"
      onClose={onClose}
      actions={
        unreadCount > 0 ? (
          <button
            onClick={() => markAll.mutate()}
            style={{ fontSize: '11px', color: '#8B1A2F', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Mark all read
          </button>
        ) : undefined
      }
    >
      {isLoading && (
        <div style={{ padding: '24px 20px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: '60px', borderRadius: '6px', backgroundColor: '#F3F4F6', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <EmptySlate
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-9.1 4a2 2 0 0 1-1.8 0"/></svg>}
          text="You're all caught up"
        />
      )}

      {!isLoading && notifications.map((n) => (
        <button
          key={n.id}
          onClick={() => { if (!n.read) markRead.mutate(n.id) }}
          style={{
            width: '100%', textAlign: 'left', border: 'none',
            borderBottom: '1px solid #F3F4F6', padding: '14px 20px',
            cursor: n.read ? 'default' : 'pointer',
            background: n.read ? 'transparent' : 'rgba(139,26,47,0.03)',
            display: 'flex', gap: '12px', alignItems: 'flex-start',
          }}
          onMouseEnter={(e) => { if (!n.read) e.currentTarget.style.background = 'rgba(139,26,47,0.06)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(139,26,47,0.03)' }}
        >
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: 'rgba(139,26,47,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {notifIcon(n.type)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: n.read ? 400 : 600, color: '#0A0A0B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {n.title}
              </p>
              {!n.read && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8B1A2F', flexShrink: 0 }} />
              )}
            </div>
            {n.body && (
              <p style={{ fontSize: '12px', color: '#6B6168', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {n.body}
              </p>
            )}
            <p style={{ fontSize: '11px', color: '#9C949A', margin: '4px 0 0' }}>
              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
            </p>
          </div>
        </button>
      ))}
      <div style={{ height: '16px' }} />
    </Panel>
  )
}

// ─── Inbox (Announcements) panel ──────────────────────────────────────────────

export function AnnouncementsPanel({ role, onClose }: { role: string; userId: string; onClose: () => void }) {
  const { data: announcements = [], isLoading } = useAnnouncements()
  const { data: classes = [] } = useClasses()
  const createAnnouncement = useCreateAnnouncement()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ class_id: '', message: '', target_type: 'whole_class' as const })
  const [formError, setFormError] = useState('')

  const isTutor = role !== 'student'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData.message.trim()) {
      setFormError('Message is required')
      return
    }
    try {
      await createAnnouncement.mutateAsync({
        message: formData.message,
        target_type: formData.target_type,
        class_id: formData.class_id || undefined,
      })
      setShowForm(false)
      setFormData({ class_id: '', message: '', target_type: 'whole_class' })
      setFormError('')
    } catch {
      setFormError('Failed to post. Try again.')
    }
  }

  return (
    <Panel
      title="Inbox"
      onClose={onClose}
      actions={
        isTutor && !showForm ? (
          <button
            onClick={() => setShowForm(true)}
            style={{
              height: '26px', padding: '0 12px', backgroundColor: '#8B1A2F',
              color: '#FFFFFF', border: 'none', borderRadius: '5px',
              fontSize: '11.5px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Post
          </button>
        ) : undefined
      }
    >
      {/* Announcement form for tutors */}
      {isTutor && showForm && (
        <form
          onSubmit={handleSubmit}
          style={{ padding: '16px 20px', borderBottom: '1px solid #ECE6E0' }}
        >
          <select
            value={formData.class_id}
            onChange={(e) => setFormData((p) => ({ ...p, class_id: e.target.value }))}
            style={inputStyle}
          >
            <option value="">All classes (optional)</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <textarea
            placeholder="Write your announcement…"
            value={formData.message}
            onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
            required
            rows={4}
            style={{ ...inputStyle, marginTop: '8px', resize: 'vertical', height: 'auto', padding: '10px 12px' }}
          />
          {formError && (
            <p style={{ fontSize: '12px', color: '#B0182E', margin: '6px 0 0' }}>{formError}</p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={createAnnouncement.isPending}
              style={{
                flex: 1, height: '34px', backgroundColor: '#8B1A2F', color: '#FFFFFF',
                border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', opacity: createAnnouncement.isPending ? 0.65 : 1,
              }}
            >
              {createAnnouncement.isPending ? 'Posting…' : 'Post'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError('') }}
              style={{
                height: '34px', padding: '0 16px', backgroundColor: 'transparent',
                color: '#6B6168', border: '1px solid #ECE6E0', borderRadius: '6px',
                fontSize: '13px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading && (
        <div style={{ padding: '24px 20px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: '80px', borderRadius: '6px', backgroundColor: '#F3F4F6', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {!isLoading && announcements.length === 0 && (
        <EmptySlate
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
          text={isTutor ? 'No announcements yet — post one above' : 'No announcements from your tutors yet'}
        />
      )}

      {!isLoading && announcements.map((a) => (
        <div
          key={a.id}
          style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              display: 'inline-block', fontSize: '10px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8B1A2F',
              background: 'rgba(139,26,47,0.07)', padding: '2px 7px', borderRadius: '4px',
            }}>
              {a.target_type === 'all_tutors' ? 'All Tutors' : a.target_type === 'whole_class' ? 'Whole Class' : 'Cohort'}
            </span>
            <p style={{ fontSize: '11px', color: '#9C949A', margin: 0, flexShrink: 0, whiteSpace: 'nowrap' }}>
              {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
            </p>
          </div>
          <p style={{ fontSize: '13px', color: '#6B6168', margin: 0, lineHeight: 1.5 }}>
            {a.message}
          </p>
          <p style={{ fontSize: '11px', color: '#9C949A', margin: '6px 0 0' }}>
            — {a.is_anonymous ? 'Admin' : (a.creator?.full_name ?? 'Admin')}
          </p>
        </div>
      ))}
      <div style={{ height: '16px' }} />
    </Panel>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '36px',
  border: '1px solid #ECE6E0',
  borderRadius: '6px',
  fontSize: '13px',
  padding: '0 12px',
  color: '#0A0A0B',
  backgroundColor: '#FFFFFF',
  outline: 'none',
  boxSizing: 'border-box',
  display: 'block',
}
