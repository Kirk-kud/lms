'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import StudentSidebar from '@/components/ui/student/StudentSidebar'
import Topbar from '@/components/ui/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { useClasses } from '@/lib/hooks/useClasses'

function activeItemFromPath(pathname: string): string {
  if (pathname.match(/\/student\/classes\/[^/]+\/modules/)) return 'Modules'
  if (pathname.match(/\/student\/classes\/[^/]+\/assignments/)) return 'Assignments'
  if (pathname.match(/\/student\/classes\/[^/]+\/attendance/)) return 'Attendance'
  if (pathname.match(/\/student\/classes\/[^/]+$/)) return 'Overview'
  if (pathname === '/student/classes') return 'Classes'
  if (pathname === '/student/notifications') return 'Notifications'
  if (pathname === '/student/announcements') return 'Announcements'
  if (pathname === '/student/calendar') return 'Calendar'
  if (pathname === '/student/todo') return 'Todo'
  return 'Dashboard'
}

// ── Mobile nav icons ──────────────────────────────────────────────────────────

const IconHome = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" className={active ? 'text-[#8B1A2F]' : 'text-[#9CA3AF]'}>
    <path d="M8 1L2 6v8h3v-4h2v4h3V6l-6-5z" />
  </svg>
)

const IconClasses = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" className={active ? 'text-[#8B1A2F]' : 'text-[#9CA3AF]'}>
    <rect x="1" y="1" width="6" height="6" rx="1" />
    <rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
)

const IconCalendar = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke={active ? '#8B1A2F' : '#9CA3AF'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="2" width="14" height="13" rx="1.5" />
    <line x1="1" y1="6" x2="15" y2="6" />
    <line x1="5" y1="1" x2="5" y2="4" />
    <line x1="11" y1="1" x2="11" y2="4" />
  </svg>
)

const IconTodo = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke={active ? '#8B1A2F' : '#9CA3AF'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="3.5" cy="4" r="1" fill={active ? '#8B1A2F' : '#9CA3AF'} stroke="none" />
    <line x1="6.5" y1="4" x2="14" y2="4" />
    <circle cx="3.5" cy="8" r="1" fill={active ? '#8B1A2F' : '#9CA3AF'} stroke="none" />
    <line x1="6.5" y1="8" x2="14" y2="8" />
    <circle cx="3.5" cy="12" r="1" fill={active ? '#8B1A2F' : '#9CA3AF'} stroke="none" />
    <line x1="6.5" y1="12" x2="14" y2="12" />
  </svg>
)

const IconModules = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" className={active ? 'text-[#8B1A2F]' : 'text-[#9CA3AF]'}>
    <path d="M1 2h6v6H1V2zm8 0h6v6H9V2zM1 10h6v4H1v-4zm8 0h6v4H9v-4z" />
  </svg>
)

const IconAssignments = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" className={active ? 'text-[#8B1A2F]' : 'text-[#9CA3AF]'}>
    <path d="M3 2h10v2H3V2zm1 4h8v1H4V6zm0 2h8v1H4V8zm0 2h5v1H4v-1z" />
  </svg>
)

const IconAttendance = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" className={active ? 'text-[#8B1A2F]' : 'text-[#9CA3AF]'}>
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 110 2 1 1 0 010-2zm3 7H5v-1h6v1z" />
  </svg>
)

const IconBack = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className={active ? 'text-[#8B1A2F]' : 'text-[#9CA3AF]'}>
    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const qc = useQueryClient()
  const { user } = useUser()
  const { data: classes = [] } = useClasses()

  const urlClassId = pathname.match(/\/student\/classes\/([^/]+)/)?.[1]
  const isClassContext = !!urlClassId
  const currentClass = classes.find((c) => c.id === urlClassId)
  const activeItem = activeItemFromPath(pathname)

  const fullName: string = (user?.user_metadata?.full_name as string) ?? ''
  const initials = fullName
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleNavigate = (label: string) => {
    if (label === 'Dashboard' || label === 'All Classes') {
      router.push('/student/dashboard')
      return
    }
    if (label === 'Classes') { router.push('/student/classes'); return }
    if (label === 'Calendar') { router.push('/student/calendar'); return }
    if (label === 'Todo') { router.push('/student/todo'); return }
    if (label === 'Overview') {
      if (urlClassId) router.push(`/student/classes/${urlClassId}`)
      return
    }
    if (label === 'Notifications') { router.push('/student/notifications'); return }
    if (label === 'Announcements') { router.push('/student/announcements'); return }
    if (urlClassId) {
      router.push(`/student/classes/${urlClassId}/${label.toLowerCase()}`)
      return
    }
    if (label === 'Modules' || label === 'Assignments' || label === 'Attendance') {
      if (classes.length === 1) {
        router.push(`/student/classes/${classes[0].id}/${label.toLowerCase()}`)
      } else {
        router.push('/student/classes')
      }
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem('access_token')
    qc.clear()
    router.push('/login')
  }

  const handleProfile = () => router.push('/student/profile')

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar userName={fullName} userInitials={initials} role="student" userId={user?.id} onSignOut={handleSignOut} onProfile={handleProfile} />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <StudentSidebar
            context={isClassContext ? 'class' : 'home'}
            classId={urlClassId}
            className={currentClass?.title}
            activeItem={activeItem}
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
            userName={fullName}
            userInitials={initials}
          />
        </div>
        <main className="flex-1 overflow-y-auto bg-white pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav — context-aware */}
      {isClassContext ? (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[0.5px] border-[#E5E5E5] h-[calc(56px+env(safe-area-inset-bottom))] px-4 pb-[env(safe-area-inset-bottom)] flex items-center justify-between">
          <button onClick={() => handleNavigate('All Classes')} aria-label="All Classes">
            <IconBack active={false} />
          </button>
          <button onClick={() => handleNavigate('Overview')} aria-label="Overview">
            <IconHome active={activeItem === 'Overview'} />
          </button>
          <button onClick={() => handleNavigate('Modules')} aria-label="Modules">
            <IconModules active={activeItem === 'Modules'} />
          </button>
          <button onClick={() => handleNavigate('Assignments')} aria-label="Assignments">
            <IconAssignments active={activeItem === 'Assignments'} />
          </button>
          <button onClick={() => handleNavigate('Attendance')} aria-label="Attendance">
            <IconAttendance active={activeItem === 'Attendance'} />
          </button>
        </nav>
      ) : (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[0.5px] border-[#E5E5E5] h-[calc(56px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] flex items-center justify-around px-2">
          <button onClick={() => handleNavigate('Dashboard')} aria-label="Dashboard">
            <IconHome active={activeItem === 'Dashboard'} />
          </button>
          <button onClick={() => handleNavigate('Classes')} aria-label="Classes">
            <IconClasses active={activeItem === 'Classes'} />
          </button>
          <button onClick={() => handleNavigate('Calendar')} aria-label="Calendar">
            <IconCalendar active={activeItem === 'Calendar'} />
          </button>
          <button onClick={() => handleNavigate('Todo')} aria-label="Todo">
            <IconTodo active={activeItem === 'Todo'} />
          </button>
        </nav>
      )}
    </div>
  )
}
