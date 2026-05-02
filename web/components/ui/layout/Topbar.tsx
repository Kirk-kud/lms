'use client'

import { useState, useRef, useEffect } from 'react'

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

  const roleLabel = role === 'admin' ? 'Admin' : role === 'tutor' ? 'Tutor' : 'Student'

  return (
    <div
      style={{
        height: '56px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #ECE6E0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
        zIndex: 30,
      }}
    >
      {/* Left: Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span
          style={{
            fontSize: '18px',
            fontWeight: 800,
            color: '#0A0A0B',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Vine
        </span>
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#8B1A2F',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      </div>

      {/* Right */}
      <div
        ref={menuRef}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        {/* Role chip */}
        <div
          style={{
            backgroundColor: '#FBEDF0',
            color: '#8B1A2F',
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '999px',
            border: '1px solid #F4DCE1',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#8B1A2F',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          {roleLabel}
        </div>

        {/* Avatar + dropdown trigger */}
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
          onFocus={e => (e.currentTarget.style.outline = '2px solid rgba(139,26,47,0.4)')}
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
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {userInitials}
          </div>
          <span
            style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0B' }}
            className="hidden sm:inline"
          >
            {userName}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            style={{
              color: '#9C949A',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
              flexShrink: 0,
            }}
          >
            <path
              d="M2 4l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
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
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                backgroundColor: '#FFFFFF',
                border: '1px solid #ECE6E0',
                borderRadius: '8px',
                minWidth: '188px',
                zIndex: 50,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #ECE6E0' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0B', margin: 0, lineHeight: 1.4 }}>
                  {userName}
                </p>
                <p style={{ fontSize: '11px', color: '#9C949A', marginTop: '2px', marginBottom: 0 }}>
                  {roleLabel}
                </p>
              </div>
              <div style={{ padding: '4px 0' }}>
                {onProfile && (
                  <button
                    role="menuitem"
                    className="tb-item"
                    onClick={() => { setOpen(false); onProfile() }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 14px',
                      fontSize: '13px',
                      color: '#0A0A0B',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 12a5 5 0 0 1 10 0" stroke="#9C949A" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    Profile
                  </button>
                )}
                {onSignOut && (
                  <button
                    role="menuitem"
                    className="tb-item-danger"
                    onClick={() => { setOpen(false); onSignOut() }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 14px',
                      fontSize: '13px',
                      color: '#6B6168',
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
