'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { useClasses } from '@/lib/hooks/useClasses'
import Topbar from '@/components/ui/layout/Topbar'

// ── Path parser ──────────────────────────────────────────────────────────────

function parseAdminPath(pathname: string): { classId: string | null; innerSegment: string | null } {
  const m = pathname.match(/\/admin\/classes\/([^/]+)\/([^/]+)/)
  if (m) return { classId: m[1], innerSegment: m[2] }
  return { classId: null, innerSegment: null }
}

// ── Icons ────────────────────────────────────────────────────────────────────

const IcDashboard = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1 1h6v6H1V1zm8 0h6v6H9V1zM1 9h6v6H1V9zm8 0h6v6H9V9z" />
  </svg>
)
const IcCourses = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2h12v1.5H2V2zm0 3h12v1.5H2V5zm0 3h9v1.5H2V8zm0 3h12v1.5H2V11zm0 3h12v1.5H2V14z" />
  </svg>
)
const IcCohorts = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM2 9c0-1.1.9-2 2-2h2c.55 0 1.05.22 1.41.59A4 4 0 0 0 7 9v4H2V9zm7 0c0-.55.12-1.07.34-1.54A2 2 0 0 1 10 7h2a2 2 0 0 1 2 2v4h-5V9z" />
  </svg>
)
const IcRoster = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2h12v2H2V2zm0 3h12v2H2V5zm0 3h12v2H2V8zm0 3h12v2H2v-2z" />
  </svg>
)
const IcModules = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1 2h6v6H1V2zm8 0h6v6H9V2zM1 10h6v4H1v-4zm8 0h6v4H9v-4z" />
  </svg>
)
const IcAssignments = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 2h10v2H3V2zm1 4h8v1H4V6zm0 2h8v1H4V8zm0 2h5v1H4v-1z" />
  </svg>
)
const IcAttendance = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 110 2 1 1 0 010-2zm3 7H5v-1h6v1z" />
  </svg>
)
const IcSettings = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 5a3 3 0 100 6A3 3 0 008 5zm0 1.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    <path d="M6.5 0l-.4 1.4a5.9 5.9 0 00-1.4.8L3.2.8 1 3l.9 1.5a6 6 0 00-.4 1.5H0v3h1.5a6 6 0 00.4 1.5L1 12l2.2 2.2 1.5-.9a5.9 5.9 0 001.4.8L6.5 16h3l.4-1.4a5.9 5.9 0 001.4-.8l1.5.9L15 12.2l-.9-1.5a6 6 0 00.4-1.5H16V6h-1.5a6 6 0 00-.4-1.5L15 3l-2.2-2.2-1.5.9a5.9 5.9 0 00-1.4-.8L9.5 0h-3zm.7 1.5h1.6l.3 1.2.8.3a4.4 4.4 0 011 .6l.7.5 1.1-.6.8.8-.6 1.1.3.8a4.4 4.4 0 01.2 1.1l.1.8 1.2.3v1.2l-1.2.3-.1.8a4.4 4.4 0 01-.3 1l-.3.8.6 1.1-.8.8-1.1-.6-.8.3a4.4 4.4 0 01-1 .3l-.8.1-.3 1.2H7.2L7 13.7l-.8-.1a4.4 4.4 0 01-1-.3l-.8-.3-1.1.6-.8-.8.6-1.1-.3-.8a4.4 4.4 0 01-.3-1l-.1-.8-1.2-.3V7.2l1.2-.3.1-.8a4.4 4.4 0 01.3-1l.3-.8-.6-1.1.8-.8 1.1.6.8-.3a4.4 4.4 0 011-.3l.8-.1.3-1.1z" />
  </svg>
)
const IcAnnouncements = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2v8l-4-2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6l4-2z" />
    <path d="M6 10v3" />
  </svg>
)
const IcCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="2" width="14" height="13" rx="2" />
    <path d="M1 6h14M5 1v3M11 1v3" />
  </svg>
)
const IcSignOut = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5 2H3v10h2M9 4l3 3-3 3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IcBack = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ── Nav button ───────────────────────────────────────────────────────────────

function NavBtn({
  label, icon, isActive, onClick,
}: {
  label: string
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 10px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? '#FFFFFF' : '#6B6168',
        backgroundColor: isActive ? '#8B1A2F' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 120ms ease, color 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF'
          ;(e.currentTarget as HTMLElement).style.color = '#0A0A0B'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
          ;(e.currentTarget as HTMLElement).style.color = '#6B6168'
        }
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex', opacity: isActive ? 1 : 0.7 }}>{icon}</span>
      {label}
    </button>
  )
}

// ── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const,
      letterSpacing: '0.14em', color: '#9C949A', padding: '10px 12px 4px',
    }}>
      {text}
    </div>
  )
}

// ── Admin sidebar ────────────────────────────────────────────────────────────

function AdminSidebar({
  classId,
  activeItem,
  userName,
  userInitials,
  onNavigate,
  onGoBack,
  onProfile,
  onSignOut,
}: {
  classId: string | null
  activeItem: string
  userName: string
  userInitials: string
  onNavigate: (path: string) => void
  onGoBack: () => void
  onProfile: () => void
  onSignOut: () => void
}) {
  const { data: classes = [] } = useClasses()
  const cls = classes.find((c) => c.id === classId)

  return (
    <div style={{
      width: '240px',
      backgroundColor: '#FAF7F4',
      borderRight: '1px solid #ECE6E0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Crimson left rail */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: '3px', backgroundColor: '#8B1A2F', borderRadius: '0 2px 2px 0',
      }} />

      {classId ? (
        // ── Class context ──────────────────────────────────────────────────

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Back link */}
          <button
            onClick={onGoBack}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              margin: '14px 16px 10px',
              fontSize: '12px', fontWeight: 500, color: '#9C949A',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, width: 'fit-content',
              transition: 'color 120ms ease',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#111')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#9C949A')}
          >
            <IcBack />
            All Classes
          </button>

          {/* Class title */}
          {cls && (
            <div style={{ padding: '0 16px 10px', borderBottom: '1px solid #ECE6E0', marginBottom: '4px' }}>
              <p style={{
                fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: '#6B6168', margin: '0 0 2px',
              }}>
                {cls.title}
              </p>
              {cls.enrolled_count !== undefined && (
                <p style={{ fontSize: '11px', color: '#9C949A', margin: 0 }}>
                  {cls.enrolled_count} {cls.enrolled_count === 1 ? 'student' : 'students'}
                </p>
              )}
            </div>
          )}

          {/* Manage group */}
          <SectionLabel text="Manage" />
          <div style={{ padding: '0 8px' }}>
            {[
              { label: 'Cohorts',  icon: <IcCohorts />,  path: 'cohorts'  },
              { label: 'Roster',   icon: <IcRoster />,   path: 'roster'   },
            ].map(({ label, icon, path }) => (
              <NavBtn
                key={label}
                label={label}
                icon={icon}
                isActive={activeItem === label}
                onClick={() => onNavigate(path)}
              />
            ))}
          </div>

          {/* Content group */}
          <SectionLabel text="Content" />
          <div style={{ padding: '0 8px' }}>
            {[
              { label: 'Modules',     icon: <IcModules />,     path: 'modules'     },
              { label: 'Assignments', icon: <IcAssignments />, path: 'assignments' },
              { label: 'Attendance',  icon: <IcAttendance />,  path: 'attendance'  },
            ].map(({ label, icon, path }) => (
              <NavBtn
                key={label}
                label={label}
                icon={icon}
                isActive={activeItem === label}
                onClick={() => onNavigate(path)}
              />
            ))}
          </div>

          {/* Settings */}
          <SectionLabel text="Settings" />
          <div style={{ padding: '0 8px' }}>
            <NavBtn
              label="Settings"
              icon={<IcSettings />}
              isActive={activeItem === 'Settings'}
              onClick={() => onNavigate('settings')}
            />
          </div>
        </div>

      ) : (
        // ── Top-level ──────────────────────────────────────────────────────

        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '16px' }}>
          {/* Brand */}
          <div style={{ padding: '0 20px 14px' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#111', margin: 0, letterSpacing: '-0.01em' }}>
              Vine
            </p>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#8B1A2F', margin: '1px 0 0', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Admin
            </p>
          </div>

          <SectionLabel text="Workspace" />
          <div style={{ padding: '0 8px' }}>
            {[
              { label: 'Dashboard',      icon: <IcDashboard />,      path: '/admin/dashboard'      },
              { label: 'Courses',        icon: <IcCourses />,        path: '/admin/classes'        },
              { label: 'Announcements',  icon: <IcAnnouncements />,  path: '/admin/announcements'  },
              { label: 'Calendar',       icon: <IcCalendar />,       path: '/admin/calendar'       },
            ].map(({ label, icon, path }) => (
              <NavBtn
                key={label}
                label={label}
                icon={icon}
                isActive={activeItem === label}
                onClick={() => onNavigate(path)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Account (always at bottom, clickable for profile) ─────────────── */}
      <div style={{ borderTop: '1px solid #ECE6E0' }}>
        <button
          onClick={onProfile}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: '10px', padding: '12px 20px 8px',
            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            transition: 'background-color 120ms ease',
            borderRadius: '0',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F0EDE9')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
        >
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#8B1A2F',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF', fontSize: '10px', fontWeight: 700, flexShrink: 0,
          }}>
            {userInitials || '??'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: '12.5px', fontWeight: 600, color: '#0A0A0B', margin: 0,
              lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userName || 'Admin'}
            </p>
            <p style={{ fontSize: '11px', color: '#6B6168', margin: 0, lineHeight: 1.3 }}>Admin</p>
          </div>
        </button>
        <div style={{ padding: '0 8px 10px' }}>
          <button
            onClick={onSignOut}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '7px 10px', borderRadius: '8px',
              fontSize: '12.5px', fontWeight: 500, color: '#9C949A',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'background-color 120ms ease, color 120ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF'
              ;(e.currentTarget as HTMLElement).style.color = '#0A0A0B'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = '#9C949A'
            }}
          >
            <IcSignOut />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Mobile icons ─────────────────────────────────────────────────────────────

const MbIcDash          = () => <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor"><path d="M1 1h6v6H1V1zm8 0h6v6H9V1zM1 9h6v6H1V9zm8 0h6v6H9V9z" /></svg>
const MbIcCourses       = () => <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12v1.5H2V2zm0 3h12v1.5H2V5zm0 3h9v1.5H2V8zm0 3h12v1.5H2V11zm0 3h12v1.5H2V14z" /></svg>
const MbIcAnnouncements = () => <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v8l-4-2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6l4-2z" /><path d="M6 10v3" /></svg>
const MbIcCalendar      = () => <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="2" width="14" height="13" rx="2" /><path d="M1 6h14M5 1v3M11 1v3" /></svg>
const MbIcCohorts    = () => <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor"><path d="M5 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM2 9c0-1.1.9-2 2-2h2c.55 0 1.05.22 1.41.59A4 4 0 0 0 7 9v4H2V9zm7 0c0-.55.12-1.07.34-1.54A2 2 0 0 1 10 7h2a2 2 0 0 1 2 2v4h-5V9z" /></svg>
const MbIcRoster     = () => <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12v2H2V2zm0 3h12v2H2V5zm0 3h12v2H2V8zm0 3h12v2H2v-2z" /></svg>
const MbIcModules    = () => <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h6v6H1V2zm8 0h6v6H9V2zM1 10h6v4H1v-4zm8 0h6v4H9v-4z" /></svg>
const MbIcAssign     = () => <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h10v2H3V2zm1 4h8v1H4V6zm0 2h8v1H4V8zm0 2h5v1H4v-1z" /></svg>
const MbIcAttendance = () => <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm2.5 8h-5v-1h5v1z" /></svg>
const MbIcSettings   = () => <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor"><path d="M8 5a3 3 0 100 6A3 3 0 008 5zm0 1.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" /><path d="M6.5 0l-.4 1.4a5.9 5.9 0 00-1.4.8L3.2.8 1 3l.9 1.5a6 6 0 00-.4 1.5H0v3h1.5a6 6 0 00.4 1.5L1 12l2.2 2.2 1.5-.9a5.9 5.9 0 001.4.8L6.5 16h3l.4-1.4a5.9 5.9 0 001.4-.8l1.5.9L15 12.2l-.9-1.5a6 6 0 00.4-1.5H16V6h-1.5a6 6 0 00-.4-1.5L15 3l-2.2-2.2-1.5.9a5.9 5.9 0 00-1.4-.8L9.5 0h-3z" /></svg>

// ── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const qc       = useQueryClient()
  const { user } = useUser()

  const { classId, innerSegment } = parseAdminPath(pathname)

  const activeItem: string = (() => {
    if (classId) {
      if (!innerSegment) return 'Cohorts'
      const s = innerSegment.toLowerCase()
      if (s === 'cohorts')     return 'Cohorts'
      if (s === 'roster')      return 'Roster'
      if (s === 'modules')     return 'Modules'
      if (s === 'assignments') return 'Assignments'
      if (s === 'attendance')  return 'Attendance'
      if (s === 'settings')    return 'Settings'
      return 'Cohorts'
    }
    if (pathname.startsWith('/admin/classes'))        return 'Courses'
    if (pathname.startsWith('/admin/announcements')) return 'Announcements'
    if (pathname.startsWith('/admin/calendar'))      return 'Calendar'
    return 'Dashboard'
  })()

  const fullName  = (user?.user_metadata?.full_name as string) ?? ''
  const initials  = fullName.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    qc.clear()
    router.push('/login')
  }

  const handleNavigate = (path: string) => {
    if (path.startsWith('/')) {
      router.push(path)
    } else if (classId) {
      router.push(`/admin/classes/${classId}/${path}`)
    }
  }

  const mobileNav = classId ? [
    { label: 'Cohorts',     icon: <MbIcCohorts />,    action: () => handleNavigate('cohorts')     },
    { label: 'Roster',      icon: <MbIcRoster />,     action: () => handleNavigate('roster')      },
    { label: 'Modules',     icon: <MbIcModules />,    action: () => handleNavigate('modules')     },
    { label: 'Assignments', icon: <MbIcAssign />,     action: () => handleNavigate('assignments') },
    { label: 'Attendance',  icon: <MbIcAttendance />, action: () => handleNavigate('attendance')  },
    { label: 'Settings',    icon: <MbIcSettings />,   action: () => handleNavigate('settings')    },
  ] : [
    { label: 'Dashboard',     icon: <MbIcDash />,          action: () => router.push('/admin/dashboard')     },
    { label: 'Courses',       icon: <MbIcCourses />,       action: () => router.push('/admin/classes')       },
    { label: 'Announcements', icon: <MbIcAnnouncements />, action: () => router.push('/admin/announcements') },
    { label: 'Calendar',      icon: <MbIcCalendar />,      action: () => router.push('/admin/calendar')      },
  ]

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* Topbar — always visible on all screen sizes */}
      <Topbar
        userName={fullName}
        userInitials={initials}
        role="admin"
        userId={user?.id}
        onSignOut={handleSignOut}
        onProfile={() => router.push('/admin/profile')}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <AdminSidebar
            classId={classId}
            activeItem={activeItem}
            userName={fullName}
            userInitials={initials}
            onNavigate={handleNavigate}
            onGoBack={() => router.push('/admin/classes')}
            onProfile={() => router.push('/admin/profile')}
            onSignOut={handleSignOut}
          />
        </div>

        {/* Main content */}
        <main
          className="min-h-0 flex-1 overflow-y-auto bg-white pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5E5] flex items-center justify-around px-2"
        style={{ height: 'calc(56px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {mobileNav.map((item) => {
          const isActive = activeItem === item.label
          return (
            <button
              key={item.label}
              onClick={item.action}
              className="flex flex-col items-center gap-0.5 px-3"
              style={{ color: isActive ? '#8B1A2F' : '#9C949A', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {item.icon}
              <span style={{ fontSize: '9px', fontWeight: isActive ? 600 : 500, letterSpacing: '0.02em' }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

    </div>
  )
}
