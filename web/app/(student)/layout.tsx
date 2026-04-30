'use client'

import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/ui/layout/Sidebar'
import Topbar from '@/components/ui/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { useClasses } from '@/lib/hooks/useClasses'

function activeItemFromPath(pathname: string): string {
  if (pathname.includes('/modules')) return 'Modules'
  if (pathname.includes('/assignments')) return 'Assignments'
  if (pathname.includes('/attendance')) return 'Attendance'
  return 'Home'
}

const IconHome = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" className={active ? 'text-[#8B1A2F]' : 'text-[#9CA3AF]'}>
    <path d="M8 1L2 6v8h3v-4h2v4h3V6l-6-5z" />
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

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const { data: classes = [] } = useClasses()
  const primaryClassId = classes[0]?.id

  // Prefer the class ID already in the URL so in-page navigation stays on the same class
  const urlMatch = pathname.match(/\/student\/classes\/([^/]+)/)
  const effectiveClassId = urlMatch?.[1] ?? primaryClassId ?? ''

  const activeItem = activeItemFromPath(pathname)

  const fullName: string = (user?.user_metadata?.full_name as string) ?? ''
  const initials = fullName
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleNavigate = (label: string) => {
    if (label === 'Home') {
      router.push('/student/dashboard')
      return
    }

    const fallback = '/join'
    if (!effectiveClassId) {
      router.push(fallback)
      return
    }

    const routeByLabel: Record<string, string> = {
      Modules: `/student/classes/${effectiveClassId}/modules`,
      Assignments: `/student/classes/${effectiveClassId}/assignments`,
      Attendance: `/student/classes/${effectiveClassId}/attendance`,
    }

    const route = routeByLabel[label]
    router.push(route ?? fallback)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem('access_token')
    router.push('/login')
  }

  const handleProfile = () => router.push('/student/profile')

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar userName={fullName} userInitials={initials} role="student" onSignOut={handleSignOut} onProfile={handleProfile} />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <Sidebar
            variant="student"
            activeItem={activeItem}
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
          />
        </div>
        <main className="flex-1 overflow-y-auto bg-white pb-20 md:pb-0">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[0.5px] border-[#E5E5E5] h-[calc(56px+env(safe-area-inset-bottom))] px-6 pb-[env(safe-area-inset-bottom)] flex items-center justify-between">
        <button onClick={() => handleNavigate('Home')} aria-label="Home">
          <IconHome active={activeItem === 'Home'} />
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
