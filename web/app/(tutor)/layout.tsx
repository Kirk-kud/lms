'use client'

import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/ui/layout/Sidebar'
import Topbar from '@/components/ui/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'

function buildNavRoutes(pathname: string): Record<string, string> {
  const m = pathname.match(/\/tutor\/classes\/([^/]+)/)
  const id = m?.[1]
  if (id) {
    return {
      Overview: '/tutor/dashboard',
      Modules: `/tutor/classes/${id}/modules`,
      Assignments: `/tutor/classes/${id}/assignments`,
      Attendance: `/tutor/classes/${id}/attendance`,
      Roster: `/tutor/classes/${id}/roster`,
    }
  }
  return {
    Overview: '/tutor/dashboard',
    Modules: '/tutor/classes',
    Assignments: '/tutor/classes',
    Attendance: '/tutor/classes',
    Roster: '/tutor/classes',
  }
}

function activeItemFromPath(pathname: string): string {
  if (/\/tutor\/classes\/[^/]+\/modules/.test(pathname)) return 'Modules'
  if (/\/tutor\/classes\/[^/]+\/assignments/.test(pathname)) return 'Assignments'
  if (/\/tutor\/classes\/[^/]+\/attendance/.test(pathname)) return 'Attendance'
  if (/\/tutor\/classes\/[^/]+\/roster/.test(pathname)) return 'Roster'
  return 'Overview'
}

const IconOverview = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" className={active ? 'text-[#8B1A2F]' : 'text-[#9CA3AF]'}>
    <path d="M2 3h4v4H2V3zm6 0h4v4H8V3zM2 9h4v4H2V9zm6 0h4v4h-4V9z" />
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
  const { user } = useUser()

  const fullName: string = (user?.user_metadata?.full_name as string) ?? ''
  const initials = fullName
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const navRoutes = buildNavRoutes(pathname)
  const activeItem = activeItemFromPath(pathname)

  const handleNavigate = (label: string) => {
    const route = navRoutes[label]
    if (route) router.push(route)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar userName={fullName} userInitials={initials} role="tutor" />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <Sidebar
            variant="tutor"
            activeItem={activeItem}
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
          />
        </div>
        <main className="flex-1 overflow-y-auto bg-white pb-20 md:pb-0">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[0.5px] border-[#E5E5E5] h-[calc(56px+env(safe-area-inset-bottom))] px-6 pb-[env(safe-area-inset-bottom)] flex items-center justify-between">
        <button onClick={() => handleNavigate('Overview')} aria-label="Overview">
          <IconOverview active={activeItem === 'Overview'} />
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
