'use client'

import { useState, useMemo } from 'react'
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
  parseISO,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import { useClasses } from '@/lib/hooks/useClasses'
import { useAttendanceSessions } from '@/lib/hooks/useAttendance'
import { useAnnouncements, type Announcement } from '@/lib/hooks/useAnnouncements'
import { useMeetingSchedule, useSetMeetingSchedule } from '@/lib/hooks/useMeetingSchedule'
import { useAssignments } from '@/lib/hooks/useAssignments'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ── Types ────────────────────────────────────────────────────────────────────

type EventType = 'meeting' | 'assignment' | 'attendance' | 'announcement'

interface CalEvent {
  id: string
  type: EventType
  title: string
  date: Date
  subtitle?: string
}

// ── Event colors ─────────────────────────────────────────────────────────────

const EVENT_COLOR: Record<EventType, string> = {
  meeting:      '#8B1A2F',
  assignment:   '#111111',
  attendance:   '#059669',
  announcement: '#9CA3AF',
}

const EVENT_BG: Record<EventType, string> = {
  meeting:      '#FEF0F0',
  assignment:   '#F3F4F6',
  attendance:   '#ECFDF5',
  announcement: '#F9FAFB',
}

const EVENT_LABEL: Record<EventType, string> = {
  meeting:      'Meeting',
  assignment:   'Assignment Due',
  attendance:   'Attendance',
  announcement: 'Announcement',
}

// ── Day-of-week mapping ───────────────────────────────────────────────────────

const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
}

// ── Generate meeting dates ────────────────────────────────────────────────────

function generateMeetingDates(schedule: { days_of_week: string[]; start_date: string; end_date: string } | null): Date[] {
  if (!schedule) return []
  const indices = schedule.days_of_week.map((d) => DAY_NAME_TO_INDEX[d]).filter((i) => i !== undefined)
  const start = parseISO(schedule.start_date)
  const end   = parseISO(schedule.end_date)
  const days  = eachDayOfInterval({ start, end })
  return days.filter((d) => indices.includes(getDay(d)))
}

// ── Icons ────────────────────────────────────────────────────────────────────

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 1v2M12 1v2M1 5h14M2 2h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5" cy="9" r="0.8" fill="currentColor" />
      <circle cx="8" cy="9" r="0.8" fill="currentColor" />
      <circle cx="11" cy="9" r="0.8" fill="currentColor" />
    </svg>
  )
}

// ── Input/select style ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '36px',
  borderRadius: '8px',
  border: '0.5px solid #E5E5E5',
  fontSize: '13px',
  padding: '0 10px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  backgroundColor: '#FFFFFF',
  color: '#111111',
}

function focusInput(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#8B1A2F'
}
function blurInput(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#E5E5E5'
}

// ── Schedule modal ────────────────────────────────────────────────────────────

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const WEEKDAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
}

function ScheduleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: existing } = useMeetingSchedule()
  const setSchedule = useSetMeetingSchedule()

  const [days, setDays]       = useState<string[]>(existing?.days_of_week ?? ['monday', 'wednesday', 'friday'])
  const [time, setTime]       = useState(existing?.time_of_day?.slice(0, 5) ?? '10:00')
  const [startDate, setStart] = useState(existing?.start_date ?? '')
  const [endDate, setEnd]     = useState(existing?.end_date ?? '')

  const toggleDay = (d: string) =>
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])

  const canSave = days.length > 0 && time && startDate && endDate && startDate <= endDate

  const handleSave = async () => {
    try {
      await setSchedule.mutateAsync({ days_of_week: days, time_of_day: time + ':00', start_date: startDate, end_date: endDate })
      toast.success('Meeting schedule saved')
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent style={{ maxWidth: '400px' }}>
        <DialogHeader>
          <DialogTitle style={{ fontSize: '15px', fontWeight: 700 }}>Set Meeting Schedule</DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '4px' }}>
          {/* Days */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B6168', margin: '0 0 8px' }}>Meeting days</p>
            <div style={{ display: 'flex', gap: '6px' }}>
              {WEEKDAYS.map((d) => {
                const active = days.includes(d)
                return (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    style={{
                      flex: 1,
                      height: '34px',
                      borderRadius: '8px',
                      border: '0.5px solid',
                      borderColor: active ? '#8B1A2F' : '#E5E5E5',
                      backgroundColor: active ? '#8B1A2F' : '#FFFFFF',
                      color: active ? '#FFFFFF' : '#6B6168',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    {WEEKDAY_LABELS[d]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B6168', margin: '0 0 6px' }}>Meeting time</p>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onFocus={focusInput}
              onBlur={blurInput}
              style={inputStyle}
            />
          </div>

          {/* Date range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B6168', margin: '0 0 6px' }}>Start date</p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStart(e.target.value)}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputStyle}
              />
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#6B6168', margin: '0 0 6px' }}>End date</p>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEnd(e.target.value)}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!canSave || setSchedule.isPending}
            style={{
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: !canSave || setSchedule.isPending ? '#D1D5DB' : '#111111',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: !canSave || setSchedule.isPending ? 'not-allowed' : 'pointer',
              transition: 'background-color 120ms ease',
            }}
            onMouseEnter={(e) => {
              if (canSave && !setSchedule.isPending)
                (e.currentTarget as HTMLElement).style.backgroundColor = '#8B1A2F'
            }}
            onMouseLeave={(e) => {
              if (canSave && !setSchedule.isPending)
                (e.currentTarget as HTMLElement).style.backgroundColor = '#111111'
            }}
          >
            {setSchedule.isPending ? 'Saving…' : 'Save Schedule'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Event dot ────────────────────────────────────────────────────────────────

function EventDot({ type }: { type: EventType }) {
  return (
    <span style={{
      display: 'inline-block',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: EVENT_COLOR[type],
      flexShrink: 0,
    }} />
  )
}

// ── Day events panel ─────────────────────────────────────────────────────────

function EventPanel({ date, events }: { date: Date; events: CalEvent[] }) {
  const dayEvents = events.filter((e) => isSameDay(e.date, date))

  return (
    <div style={{
      width: '260px',
      flexShrink: 0,
      border: '0.5px solid #E5E5E5',
      borderRadius: '12px',
      backgroundColor: '#FAFAFA',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid #E5E5E5',
        backgroundColor: '#FFFFFF',
      }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#111111', margin: 0 }}>
          {format(date, 'EEEE')}
        </p>
        <p style={{ fontSize: '12px', color: '#9C949A', margin: '1px 0 0' }}>
          {format(date, 'MMMM d, yyyy')}
        </p>
      </div>

      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {dayEvents.length === 0 ? (
          <p style={{ fontSize: '12.5px', color: '#9C949A', textAlign: 'center', padding: '20px 0' }}>
            No events
          </p>
        ) : (
          dayEvents.map((ev) => (
            <div
              key={ev.id}
              style={{
                borderLeft: `2px solid ${EVENT_COLOR[ev.type]}`,
                backgroundColor: EVENT_BG[ev.type],
                borderRadius: '0 8px 8px 0',
                padding: '8px 10px',
              }}
            >
              <p style={{ fontSize: '11px', fontWeight: 700, color: EVENT_COLOR[ev.type], margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {EVENT_LABEL[ev.type]}
              </p>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#111111', margin: 0 }}>
                {ev.title}
              </p>
              {ev.subtitle && (
                <p style={{ fontSize: '11.5px', color: '#6B6168', margin: '2px 0 0' }}>
                  {ev.subtitle}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Calendar grid ─────────────────────────────────────────────────────────────

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function CalendarGrid({
  month,
  events,
  selectedDate,
  onSelectDate,
}: {
  month: Date
  events: CalEvent[]
  selectedDate: Date
  onSelectDate: (d: Date) => void
}) {
  const start   = startOfWeek(startOfMonth(month))
  const end     = endOfWeek(endOfMonth(month))
  const days    = eachDayOfInterval({ start, end })

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {WEEK_DAYS.map((d) => (
          <div key={d} style={{ textAlign: 'center', padding: '6px 0', fontSize: '11px', fontWeight: 700, color: '#9C949A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {days.map((day) => {
          const dayEvents   = events.filter((e) => isSameDay(e.date, day))
          const isThisMonth = isSameMonth(day, month)
          const isSelected  = isSameDay(day, selectedDate)
          const isCurrent   = isToday(day)
          const visibleDots = dayEvents.slice(0, 3)
          const extra       = dayEvents.length - 3

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '6px 4px 8px',
                borderRadius: '8px',
                border: '0.5px solid',
                borderColor: isSelected ? '#8B1A2F' : 'transparent',
                backgroundColor: isSelected ? '#FEF0F0' : 'transparent',
                cursor: 'pointer',
                minHeight: '64px',
                transition: 'background-color 100ms ease, border-color 100ms ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#F8F8F8'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }
              }}
            >
              {/* Date number */}
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12.5px',
                fontWeight: isCurrent ? 700 : 500,
                color: isCurrent ? '#FFFFFF' : isThisMonth ? '#111111' : '#C9C0C8',
                backgroundColor: isCurrent ? '#8B1A2F' : 'transparent',
                flexShrink: 0,
              }}>
                {format(day, 'd')}
              </span>

              {/* Event dots */}
              {visibleDots.length > 0 && (
                <div style={{ display: 'flex', gap: '3px', marginTop: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {visibleDots.map((ev, i) => (
                    <EventDot key={i} type={ev.type} />
                  ))}
                  {extra > 0 && (
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#9C949A', lineHeight: '6px' }}>
                      +{extra}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Class events loader ───────────────────────────────────────────────────────

function useClassEvents(classId: string) {
  const { data: sessions = [] } = useAttendanceSessions(classId)
  const { data: assignments = [] } = useAssignments(classId)

  return useMemo(() => {
    const events: CalEvent[] = []
    for (const s of sessions) {
      events.push({
        id: `att-${s.id}`,
        type: 'attendance',
        title: 'Attendance Session',
        date: parseISO(s.started_at),
        subtitle: s.is_active ? 'Active' : undefined,
      })
    }
    for (const a of assignments) {
      if (a.due_date) {
        events.push({
          id: `asgn-${a.id}`,
          type: 'assignment',
          title: a.title,
          date: parseISO(a.due_date),
          subtitle: `Due`,
        })
      }
    }
    return events
  }, [sessions, assignments])
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CalendarPageClient() {
  const [currentMonth, setCurrentMonth]   = useState(new Date())
  const [selectedDate, setSelectedDate]   = useState(new Date())
  const [scheduleOpen, setScheduleOpen]   = useState(false)

  const { data: classes = [] }       = useClasses()
  const { data: schedule }           = useMeetingSchedule()
  const { data: announcements = [] as Announcement[] } = useAnnouncements()

  // Load events for the first class (in production there's one class)
  const firstClassId = classes[0]?.id ?? ''
  const classEvents  = useClassEvents(firstClassId)

  const allEvents = useMemo(() => {
    const events: CalEvent[] = []

    // Meeting events
    const meetingDates = generateMeetingDates(schedule ?? null)
    for (const d of meetingDates) {
      events.push({
        id: `meeting-${d.toISOString()}`,
        type: 'meeting',
        title: 'Meeting',
        date: d,
        subtitle: schedule ? schedule.time_of_day.slice(0, 5) : undefined,
      })
    }

    // Class events (assignments + attendance)
    events.push(...classEvents)

    // Announcements
    for (const a of announcements) {
      events.push({
        id: `ann-${a.id}`,
        type: 'announcement',
        title: a.message.length > 60 ? a.message.slice(0, 57) + '…' : a.message,
        date: parseISO(a.created_at),
      })
    }

    return events
  }, [schedule, classEvents, announcements])

  const monthLabel = format(currentMonth, 'MMMM yyyy')

  return (
    <div style={{ padding: '28px 32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111111', margin: 0 }}>Calendar</h1>
          <p style={{ fontSize: '13px', color: '#6B6168', margin: '4px 0 0' }}>
            Meetings, assignments, attendance and announcements
          </p>
        </div>
        <button
          onClick={() => setScheduleOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            height: '36px', padding: '0 14px',
            borderRadius: '8px', border: '0.5px solid #E5E5E5',
            backgroundColor: '#FFFFFF', color: '#111111',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            transition: 'all 120ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#8B1A2F'
            ;(e.currentTarget as HTMLElement).style.color = '#8B1A2F'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#E5E5E5'
            ;(e.currentTarget as HTMLElement).style.color = '#111111'
          }}
        >
          <CalendarIcon />
          Set Schedule
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {(['meeting', 'assignment', 'attendance', 'announcement'] as EventType[]).map((t) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <EventDot type={t} />
            <span style={{ fontSize: '12px', color: '#6B6168', fontWeight: 500 }}>
              {EVENT_LABEL[t]}
            </span>
          </div>
        ))}
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          style={{
            width: '32px', height: '32px', borderRadius: '8px',
            border: '0.5px solid #E5E5E5', backgroundColor: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6B6168', cursor: 'pointer', transition: 'all 100ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#8B1A2F'}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#E5E5E5'}
        >
          <ChevronLeft />
        </button>

        <p style={{ fontSize: '15px', fontWeight: 700, color: '#111111', margin: 0, minWidth: '140px', textAlign: 'center' }}>
          {monthLabel}
        </p>

        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          style={{
            width: '32px', height: '32px', borderRadius: '8px',
            border: '0.5px solid #E5E5E5', backgroundColor: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6B6168', cursor: 'pointer', transition: 'all 100ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#8B1A2F'}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#E5E5E5'}
        >
          <ChevronRight />
        </button>

        <button
          onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()) }}
          style={{
            height: '32px', padding: '0 12px', borderRadius: '8px',
            border: '0.5px solid #E5E5E5', backgroundColor: '#FFFFFF',
            fontSize: '12.5px', fontWeight: 600, color: '#6B6168',
            cursor: 'pointer', transition: 'all 100ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#8B1A2F'
            ;(e.currentTarget as HTMLElement).style.color = '#8B1A2F'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#E5E5E5'
            ;(e.currentTarget as HTMLElement).style.color = '#6B6168'
          }}
        >
          Today
        </button>
      </div>

      {/* Calendar + Panel */}
      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        <CalendarGrid
          month={currentMonth}
          events={allEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        <EventPanel date={selectedDate} events={allEvents} />
      </div>

      <ScheduleModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </div>
  )
}
