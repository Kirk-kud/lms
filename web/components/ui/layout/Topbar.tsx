'use client'

import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import globalWhite from '@/public/global_white.png'

interface TopbarProps {
  userName: string
  userInitials: string
  role: 'admin' | 'tutor' | 'student'
  onSignOut?: () => void
  onProfile?: () => void
}

export default function Topbar({ userName, userInitials, role, onSignOut, onProfile }: TopbarProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="h-14 w-full bg-[#111111] grid grid-cols-3 items-center px-6">
      {/* Left: empty spacer */}
      <div />

      {/* Center: Logo */}
      <div className="flex justify-center">
        <Image
          src={globalWhite}
          alt="Love Inc"
          style={{ width: 'auto', height: '60px' }}
        />
      </div>

      {/* Right section */}
      <div ref={menuRef} className="flex justify-end" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Role chip */}
        <div className="bg-[#333333] text-white text-[11px] px-2.5 py-1 rounded-full font-medium select-none">
          {role === 'admin' ? 'Admin' : role === 'tutor' ? 'Tutor' : 'Student'}
        </div>

        {/* Avatar + name trigger */}
        <button
          onClick={() => setOpen(v => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            padding: '4px 0',
            cursor: 'pointer',
            borderRadius: '6px',
            outline: 'none',
          }}
          onFocus={e => (e.currentTarget.style.outline = '2px solid rgba(139,26,47,0.5)')}
          onBlur={e => (e.currentTarget.style.outline = 'none')}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#8B1A2F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {userInitials}
          </div>
          <span className="text-white text-[13px] hidden sm:inline">{userName}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            style={{
              color: 'rgba(255,255,255,0.45)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
              flexShrink: 0,
            }}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {open && (
          <>
            <style>{`
              .topbar-menu-item { transition: background-color 120ms ease-out; }
              .topbar-menu-item:hover { background-color: #F8F8F8; }
              .topbar-menu-item-danger { transition: background-color 120ms ease-out, color 120ms ease-out; }
              .topbar-menu-item-danger:hover { background-color: #FEE2E2; color: #991B1B !important; }
            `}</style>
            <div
              role="menu"
              aria-label="User menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                minWidth: '188px',
                zIndex: 50,
                overflow: 'hidden',
              }}
            >
              {/* Identity header */}
              <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #E5E5E5' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#111111', margin: 0, lineHeight: 1.4 }}>
                  {userName}
                </p>
                <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', marginBottom: 0 }}>
                  {role === 'admin' ? 'Admin' : role === 'tutor' ? 'Tutor' : 'Student'}
                </p>
              </div>

              {/* Items */}
              <div style={{ padding: '4px 0' }}>
                {onProfile && (
                  <button
                    role="menuitem"
                    className="topbar-menu-item"
                    onClick={() => { setOpen(false); onProfile() }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 14px',
                      fontSize: '13px',
                      color: '#111111',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 12a5 5 0 0 1 10 0" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    Profile
                  </button>
                )}
                {onSignOut && (
                  <button
                    role="menuitem"
                    className="topbar-menu-item-danger"
                    onClick={() => { setOpen(false); onSignOut() }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 14px',
                      fontSize: '13px',
                      color: '#6B7280',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
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
  )
}
