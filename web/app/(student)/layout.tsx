'use client'

import { useState } from 'react'
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
  if (pathname === '/student/calendar') return 'Calendar'
  if (pathname === '/student/todo') return 'To-do'
  if (pathname === '/student/notifications') return 'Notifications'
  if (pathname === '/student/announcements') return 'Announcements'
  return 'Dashboard'
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

const IconBack = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className={active ? 'text-[#8B1A2F]' : 'text-[#9CA3AF]'}>
    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconBell = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke={active ? '#8B1A2F' : '#9CA3AF'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 9.5V7a5 5 0 0 0-10 0v2.5L1.5 12h13L13 9.5z" />
    <path d="M6.5 12v.5a1.5 1.5 0 0 0 3 0V12" />
  </svg>
)

const IconInbox = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke={active ? '#8B1A2F' : '#9CA3AF'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="2" width="14" height="12" rx="1.5" />
    <polyline points="1,5 8,9 15,5" />
  </svg>
)

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const qc = useQueryClient()
  const { user } = useUser()
  const { data: classes = [] } = useClasses()
  const [classesOpen, setClassesOpen] = useState(false)

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
      setClassesOpen(false)
      return
    }
    if (label === 'Classes') {
      setClassesOpen((prev) => !prev)
      return
    }
    if (label === 'Overview') {
      if (urlClassId) router.push(`/student/classes/${urlClassId}`)
      setClassesOpen(false)
      return
    }
    if (label === 'Calendar') { router.push('/student/calendar'); setClassesOpen(false); return }
    if (label === 'To-do') { router.push('/student/todo'); setClassesOpen(false); return }
    if (label === 'Notifications') { router.push('/student/notifications'); setClassesOpen(false); return }
    if (label === 'Announcements') { router.push('/student/announcements'); setClassesOpen(false); return }
    if (urlClassId) {
      router.push(`/student/classes/${urlClassId}/${label.toLowerCase()}`)
      setClassesOpen(false)
      return
    }
    if (label === 'Modules' || label === 'Assignments' || label === 'Attendance') {
      if (classes.length === 1) {
        router.push(`/student/classes/${classes[0].id}/${label.toLowerCase()}`)
      } else {
        router.push('/student/dashboard')
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
            activeItem={classesOpen ? 'Classes' : activeItem}
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
            userName={fullName}
            userInitials={initials}
          />
        </div>

        {/* Classes slide-out panel */}
        {classesOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setClassesOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 40,
                background: 'rgba(10,10,11,0.2)',
              }}
            />
            {/* Panel */}
            <div
              className="fixed top-0 bottom-0 left-0 sm:left-[260px] w-full sm:w-[300px]"
              style={{
                background: '#FFFFFF',
                borderRight: '1px solid #ECE6E0',
                boxShadow: '4px 0 24px rgba(10,10,11,0.1)',
                zIndex: 41,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  padding: '18px 20px 14px',
                  borderBottom: '1px solid #ECE6E0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}
              >
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0A0A0B', margin: 0 }}>
                  My Classes
                </h2>
                <button
                  onClick={() => setClassesOpen(false)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    border: '1px solid #ECE6E0',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6B6168',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF7F4')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Class list */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {classes.length === 0 ? (
                  <p style={{ padding: '20px', fontSize: '13px', color: '#9C949A', margin: 0 }}>
                    No classes yet.
                  </p>
                ) : (
                  classes.map((cls, i) => (
                    <ClassDrawerItem
                      key={cls.id}
                      title={cls.title}
                      description={cls.description ?? undefined}
                      isLast={i === classes.length - 1}
                      isActive={urlClassId === cls.id}
                      onClick={() => {
                        setClassesOpen(false)
                        router.push(`/student/classes/${cls.id}`)
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}

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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[0.5px] border-[#E5E5E5] h-[calc(56px+env(safe-area-inset-bottom))] px-6 pb-[env(safe-area-inset-bottom)] flex items-center justify-between">
          <button onClick={() => handleNavigate('Dashboard')} aria-label="Dashboard">
            <IconHome active={activeItem === 'Dashboard'} />
          </button>
          <button onClick={() => handleNavigate('Calendar')} aria-label="Calendar">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke={activeItem === 'Calendar' ? '#8B1A2F' : '#9CA3AF'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1.5" y="2" width="13" height="13" rx="1.5" /><path d="M5 1v2M11 1v2M1.5 6h13" />
            </svg>
          </button>
          <button onClick={() => handleNavigate('To-do')} aria-label="To-do">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke={activeItem === 'To-do' ? '#8B1A2F' : '#9CA3AF'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 8 6 11 13 4" /><rect x="1" y="1" width="14" height="14" rx="2" />
            </svg>
          </button>
          <button onClick={() => handleNavigate('Notifications')} aria-label="Notifications">
            <IconBell active={activeItem === 'Notifications'} />
          </button>
          <button onClick={() => handleNavigate('Announcements')} aria-label="Announcements">
            <IconInbox active={activeItem === 'Announcements'} />
          </button>
        </nav>
      )}
    </div>
  )
}

function ClassDrawerItem({
  title,
  description,
  isLast,
  isActive,
  onClick,
}: {
  title: string
  description?: string
  isLast: boolean
  isActive: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        padding: '14px 20px',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: isLast ? 'none' : '1px solid #ECE6E0',
        background: isActive ? 'rgba(139,26,47,0.05)' : hovered ? '#FAF7F4' : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 120ms ease',
      }}
    >
      <p
        style={{
          fontSize: '13.5px',
          fontWeight: 600,
          color: isActive ? '#6B1525' : hovered ? '#8B1A2F' : '#8B1A2F',
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        {title}
      </p>
      {description && (
        <p style={{ fontSize: '12px', color: '#9C949A', margin: '3px 0 0', lineHeight: 1.4 }}>
          {description}
        </p>
      )}
    </button>
  )
}

import React from 'react'
