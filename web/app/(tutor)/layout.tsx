'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Sidebar from '@/components/ui/layout/Sidebar'
import Topbar from '@/components/ui/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'

function activeItemFromPath(pathname: string): string {
  if (pathname.includes('/tutor/cohort')) return 'My Cohort'
  if (pathname.includes('/tutor/modules')) return 'Modules'
  if (pathname.includes('/tutor/assignments')) return 'Assignments'
  if (pathname.includes('/tutor/attendance')) return 'Attendance'
  return 'Dashboard'
}

const NAV_ROUTES: Record<string, string> = {
  Dashboard: '/tutor/dashboard',
  'My Cohort': '/tutor/cohort',
  Modules: '/tutor/modules',
  Assignments: '/tutor/assignments',
  Attendance: '/tutor/attendance',
}

const IconDashboard = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" className={active ? 'text-[#8B1A2F]' : 'text-[#9CA3AF]'}>
    <path d="M2 3h4v4H2V3zm6 0h4v4H8V3zM2 9h4v4H2V9zm6 0h4v4h-4V9z" />
  </svg>
)

const IconCohort = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" className={active ? 'text-[#8B1A2F]' : 'text-[#9CA3AF]'}>
    <path d="M5 3a3 3 0 1 1 6 0A3 3 0 0 1 5 3zM1 14s-1 0-1-1 1-4 7-4 7 3 7 4-1 1-1 1H1zm10-4.5a5 5 0 0 1 2 1 3 3 0 0 1 1 2.5s0 1-1 1h-1.5c.1-.3.2-.7.2-1C11.7 11.6 10.4 10.1 9 9.3a7.4 7.4 0 0 1 2-.8z" />
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

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const qc = useQueryClient()
  const { user } = useUser()

  const activeItem = activeItemFromPath(pathname)

  const fullName: string = (user?.user_metadata?.full_name as string) ?? ''
  const initials = fullName
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleNavigate = (label: string) => {
    const route = NAV_ROUTES[label]
    if (route) router.push(route)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem('access_token')
    qc.clear()
    router.push('/login')
  }

  const handleProfile = () => router.push('/tutor/profile')

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar userName={fullName} userInitials={initials} role="tutor" userId={user?.id} onSignOut={handleSignOut} onProfile={handleProfile} />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <Sidebar
            variant="tutor"
            activeItem={activeItem}
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
            userName={fullName}
            userInitials={initials}
          />
        </div>
        <main className="flex-1 overflow-y-auto bg-white pb-20 md:pb-0">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[0.5px] border-[#E5E5E5] h-[calc(56px+env(safe-area-inset-bottom))] px-6 pb-[env(safe-area-inset-bottom)] flex items-center justify-between">
        <button onClick={() => handleNavigate('Dashboard')} aria-label="Dashboard">
          <IconDashboard active={activeItem === 'Dashboard'} />
        </button>
        <button onClick={() => handleNavigate('My Cohort')} aria-label="My Cohort">
          <IconCohort active={activeItem === 'My Cohort'} />
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
    </div>
  )
}
