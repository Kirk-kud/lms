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

function EventPanel({ date, events, className }: { date: Date; events: CalEvent[]; className?: string }) {
  const dayEvents = events.filter((e) => isSameDay(e.date, date))

  return (
    <div
      className={[
        'w-full rounded-xl border-[0.5px] border-[#E5E5E5] bg-[#F8F8F8] overflow-hidden flex flex-col',
        'min-h-0 max-h-[min(50vh,320px)] lg:max-h-none',
        className ?? '',
      ].join(' ')}
    >
      <div className="shrink-0 px-3.5 py-3.5 sm:px-4 border-b-[0.5px] border-[#E5E5E5] bg-white">
        <p className="text-[13px] font-bold text-[#111111] m-0">
          {format(date, 'EEEE')}
        </p>
        <p className="text-xs text-[#9C949A] mt-0.5 m-0">
          {format(date, 'MMMM d, yyyy')}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 sm:px-3 sm:py-3 flex flex-col gap-2">
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

const WEEK_DAYS_LONG  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_DAYS_SHORT = ['S',   'M',   'T',   'W',   'T',   'F',   'S'  ]

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
    <div className="flex-1 min-w-0 w-full">
      {/* Week headers */}
      <div className="grid grid-cols-7 mb-1 sm:mb-1">
        {WEEK_DAYS_LONG.map((d, i) => (
          <div key={d} className="text-center py-1.5 text-[11px] font-bold text-[#9C949A] uppercase tracking-[0.08em]">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{WEEK_DAYS_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-0.5">
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
                border: '0.5px solid',
                borderColor: isSelected ? '#8B1A2F' : 'transparent',
                backgroundColor: isSelected ? '#FEF0F0' : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 100ms ease, border-color 100ms ease',
              }}
              className="relative flex flex-col items-center px-1 py-1 pb-1.5 sm:px-0.5 sm:py-1 sm:pb-1.5 rounded-lg min-h-[48px] sm:min-h-[52px]"
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
                <div style={{ display: 'flex', gap: '3px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-8 sm:p-6 sm:pb-8 lg:h-full lg:overflow-hidden lg:p-8 lg:pb-8">
      {/* Header */}
      <div className="mb-5 flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-1">
          <h1 className="m-0 text-lg font-bold text-[#111111] sm:text-xl">Calendar</h1>
          <p className="mt-1 hidden text-[13px] text-[#6B6168] sm:block">
            Meetings, assignments, attendance and announcements
          </p>
        </div>
        <button
          type="button"
          aria-label="Set meeting schedule"
          onClick={() => setScheduleOpen(true)}
          className="flex h-9 shrink-0 items-center justify-center gap-[7px] rounded-lg border-[0.5px] border-[#E5E5E5] bg-white px-2.5 text-[13px] font-semibold text-[#111111] transition-[border-color,color] duration-[120ms] sm:px-3.5 hover:border-[#8B1A2F] hover:text-[#8B1A2F]"
        >
          <CalendarIcon />
          <span className="hidden sm:inline">Set Schedule</span>
        </button>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-2 sm:gap-3 shrink-0">
        {(['meeting', 'assignment', 'attendance', 'announcement'] as EventType[]).map((t) => (
          <div key={t} className="flex items-center gap-1 sm:gap-1.5">
            <EventDot type={t} />
            <span className="text-[11px] font-medium text-[#6B6168] sm:text-[11.5px]">
              <span className="hidden sm:inline">{EVENT_LABEL[t]}</span>
              <span className="sm:hidden">{EVENT_LABEL[t].split(' ')[0]}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Month nav */}
      <div className="mb-3.5 flex shrink-0 flex-wrap items-center gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-[#E5E5E5] bg-white text-[#6B6168] transition-[border-color] duration-100 hover:border-[#8B1A2F]"
        >
          <ChevronLeft />
        </button>

        <p className="m-0 min-w-[7.5rem] flex-1 text-center text-[15px] font-bold text-[#111111] sm:min-w-[9rem] sm:flex-none">
          {monthLabel}
        </p>

        <button
          type="button"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-[#E5E5E5] bg-white text-[#6B6168] transition-[border-color] duration-100 hover:border-[#8B1A2F]"
        >
          <ChevronRight />
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentMonth(new Date())
            setSelectedDate(new Date())
          }}
          className="ml-0 h-8 shrink-0 rounded-lg border-[0.5px] border-[#E5E5E5] bg-white px-3 text-[12.5px] font-semibold text-[#6B6168] transition-[border-color,color] duration-100 hover:border-[#8B1A2F] hover:text-[#8B1A2F] sm:ml-auto"
        >
          Today
        </button>
      </div>

      {/* Calendar + Panel — stacked on mobile, row on lg; panel scrolls on desktop */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:min-h-0 lg:flex-row lg:gap-5">
        <CalendarGrid
          month={currentMonth}
          events={allEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        <EventPanel
          date={selectedDate}
          events={allEvents}
          className="shrink-0 lg:h-full lg:min-h-0 lg:w-[260px] lg:max-h-none lg:shrink-0"
        />
      </div>

      <ScheduleModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </div>
  )
}
