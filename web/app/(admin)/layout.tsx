'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Sidebar from '@/components/ui/layout/Sidebar'
import Topbar from '@/components/ui/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { useClasses } from '@/lib/hooks/useClasses'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function activeItemFromPath(pathname: string): string {
  if (/\/admin\/classes\/[^/]+\/modules/.test(pathname)) return 'Modules'
  if (/\/admin\/classes\/[^/]+\/assignments/.test(pathname)) return 'Assignments'
  if (/\/admin\/classes\/[^/]+\/attendance/.test(pathname)) return 'Attendance'
  if (/\/admin\/classes\/[^/]+\/cohorts/.test(pathname)) return 'Cohorts'
  if (/\/admin\/classes\/[^/]+\/roster/.test(pathname)) return 'Roster'
  if (/\/admin\/classes\/[^/]+\/settings/.test(pathname)) return 'Settings'
  return 'Overview'
}

const TUTOR_SEGMENTS: Record<string, string> = {
  Modules: 'modules',
  Assignments: 'assignments',
  Attendance: 'attendance',
  Cohorts: 'cohorts',
  Roster: 'roster',
  Settings: 'settings',
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const qc = useQueryClient()
  const { user } = useUser()
  const { data: classes = [] } = useClasses(user?.id)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingLabel, setPendingLabel] = useState('')

  const urlClassId = pathname.match(/\/admin\/classes\/([^/]+)/)?.[1]
  const activeItem = activeItemFromPath(pathname)

  const fullName: string = (user?.user_metadata?.full_name as string) ?? ''
  const initials = fullName
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleNavigate = (label: string) => {
    if (label === 'Overview') {
      router.push('/admin/dashboard')
      return
    }
    const segment = TUTOR_SEGMENTS[label]
    if (!segment) return
    if (urlClassId) {
      router.push(`/admin/classes/${urlClassId}/${segment}`)
    } else {
      setPendingLabel(label)
      setPickerOpen(true)
    }
  }

  const handlePickClass = (classId: string) => {
    setPickerOpen(false)
    const segment = TUTOR_SEGMENTS[pendingLabel]
    if (segment) router.push(`/admin/classes/${classId}/${segment}`)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem('access_token')
    qc.clear()
    router.push('/login')
  }

  const handleProfile = () => router.push('/admin/profile')

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar userName={fullName} userInitials={initials} role="admin" onSignOut={handleSignOut} onProfile={handleProfile} />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <Sidebar
            variant="admin"
            activeItem={activeItem}
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
            userName={fullName || undefined}
            userInitials={initials || undefined}
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

      <Dialog open={pickerOpen} onOpenChange={(v) => !v && setPickerOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-medium">Choose a class</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            {classes.length === 0 ? (
              <p className="text-[13px] text-[#9CA3AF]">No classes yet. Create one from the Classes page.</p>
            ) : (
              classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handlePickClass(c.id)}
                  className="w-full text-left border border-[#E5E5E5] rounded-xl p-4 hover:border-[#8B1A2F]/30 hover:bg-[#FAFAFA] transition-all"
                >
                  <p className="text-[14px] font-medium text-[#111]">{c.title}</p>
                  {c.description && (
                    <p className="text-[12px] text-[#6B7280] mt-1 line-clamp-2">{c.description}</p>
                  )}
                  <p className="text-[11px] text-[#9CA3AF] mt-1">
                    {c.enrolled_count} {c.enrolled_count === 1 ? 'student' : 'students'}
                  </p>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
