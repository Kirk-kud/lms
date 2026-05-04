'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { AnnouncementsPanel } from './TopbarPanels'

interface TopbarProps {
  userName: string
  userInitials: string
  role: 'admin' | 'tutor' | 'student'
  userId?: string
  onSignOut?: () => void
  onProfile?: () => void
}

function IconButton({
  label,
  active,
  badge,
  onClick,
  children,
}: {
  label: string
  active: boolean
  badge?: number
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        position: 'relative',
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        border: 'none',
        background: active ? 'rgba(139,26,47,0.1)' : 'transparent',
        color: active ? '#8B1A2F' : '#6B6168',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background-color 120ms ease, color 120ms ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = '#FAF7F4'
          e.currentTarget.style.color = '#0A0A0B'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#6B6168'
        }
      }}
    >
      {children}
      {badge != null && badge > 0 && (
        <span style={{
          position: 'absolute',
          top: '3px',
          right: '3px',
          minWidth: '14px',
          height: '14px',
          borderRadius: '7px',
          backgroundColor: '#8B1A2F',
          color: '#FFFFFF',
          fontSize: '9px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 3px',
          lineHeight: 1,
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}

export default function Topbar({ userName, userInitials, role, userId, onSignOut, onProfile }: TopbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [announcementsOpen, setAnnouncementsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const { data: notifications = [] } = useNotifications()
  const unreadCount = notifications.filter((n) => !n.read).length

  const roleLabel = role === 'admin' ? 'Admin' : role === 'tutor' ? 'Tutor' : 'Student'
  const isStudent = role === 'student'

  return (
    <>
      <div
        style={{
          height: '56px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #ECE6E0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
          zIndex: 30,
          gap: '8px',
        }}
      >
        {/* Left: Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#0A0A0B', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Vine
          </span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8B1A2F', display: 'inline-block', flexShrink: 0 }} />
        </div>

        {/* Centre: icon buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, justifyContent: 'flex-end', marginRight: '4px' }}>
          {isStudent && userId && (
            <>
              <IconButton
                label="Notifications"
                active={pathname === '/student/notifications'}
                badge={unreadCount}
                onClick={() => router.push('/student/notifications')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </IconButton>
              <IconButton
                label="Announcements"
                active={pathname === '/student/announcements'}
                onClick={() => router.push('/student/announcements')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </IconButton>
            </>
          )}
          {!isStudent && (
            <IconButton
              label="Announcements"
              active={announcementsOpen}
              onClick={() => setAnnouncementsOpen((v) => !v)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </IconButton>
          )}
        </div>

        {/* Right: role chip + avatar dropdown */}
        <div ref={menuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div
            style={{
              backgroundColor: '#FBEDF0', color: '#8B1A2F',
              fontSize: '11px', fontWeight: 600,
              padding: '4px 10px', borderRadius: '999px',
              border: '1px solid #F4DCE1',
              display: 'flex', alignItems: 'center', gap: '6px',
              userSelect: 'none',
            }}
            className="hidden sm:flex"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#8B1A2F', display: 'inline-block', flexShrink: 0 }} />
            {roleLabel}
          </div>

          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'none', border: 'none', padding: '4px 0',
              cursor: 'pointer', borderRadius: '6px', outline: 'none',
            }}
            onFocus={e => (e.currentTarget.style.outline = '2px solid rgba(139,26,47,0.4)')}
            onBlur={e => (e.currentTarget.style.outline = 'none')}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: '#8B1A2F', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, flexShrink: 0,
            }}>
              {userInitials}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0B' }} className="hidden sm:inline">
              {userName}
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
              style={{ color: '#9C949A', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)', flexShrink: 0 }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <style>{`
                .tb-item { transition: background-color 120ms ease-out; }
                .tb-item:hover { background-color: #FAF7F4; }
                .tb-item-danger { transition: background-color 120ms ease-out, color 120ms ease-out; }
                .tb-item-danger:hover { background-color: #FBEDF0; color: #8B1A2F !important; }
              `}</style>
              <div
                role="menu"
                aria-label="User menu"
                style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  backgroundColor: '#FFFFFF', border: '1px solid #ECE6E0',
                  borderRadius: '8px', minWidth: '188px', zIndex: 50, overflow: 'hidden',
                }}
              >
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #ECE6E0' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0B', margin: 0, lineHeight: 1.4 }}>{userName}</p>
                  <p style={{ fontSize: '11px', color: '#9C949A', marginTop: '2px', marginBottom: 0 }}>{roleLabel}</p>
                </div>
                <div style={{ padding: '4px 0' }}>
                  {onProfile && (
                    <button role="menuitem" className="tb-item" onClick={() => { setMenuOpen(false); onProfile() }}
                      style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: '13px', color: '#0A0A0B', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 12a5 5 0 0 1 10 0" stroke="#9C949A" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      Profile
                    </button>
                  )}
                  {onSignOut && (
                    <button role="menuitem" className="tb-item-danger" onClick={() => { setMenuOpen(false); onSignOut() }}
                      style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: '13px', color: '#6B6168', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M5 2H3v10h2M9 4l3 3-3 3M12 7H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Sign out
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Announcements panel — admin/tutor only */}
      {!isStudent && announcementsOpen && userId && (
        <AnnouncementsPanel role={role} userId={userId} onClose={() => setAnnouncementsOpen(false)} />
      )}
    </>
  )
}
