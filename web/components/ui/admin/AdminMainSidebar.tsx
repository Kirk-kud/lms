'use client'

import React from 'react'

interface Props {
  activeSection: 'dashboard' | 'courses' | 'profile'
  userName?: string
  userInitials?: string
  onNavigate: (path: string) => void
  onSignOut: () => void
}

const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1 1h6v6H1V1zm8 0h6v6H9V1zM1 9h6v6H1V9zm8 0h6v6H9V9z" />
  </svg>
)

const IconCourses = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2h12v1.5H2V2zm0 3h12v1.5H2V5zm0 3h9v1.5H2V8zm0 5h12v1.5H2V13zm0-2.5h12v1.5H2v-1.5z" />
  </svg>
)

const IconProfile = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a3.5 3.5 0 100 7A3.5 3.5 0 008 1zM3 13.5C3 11 5.2 9.5 8 9.5s5 1.5 5 4H3z" />
  </svg>
)

const IconSignOut = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M5 2H3v10h2M9 4l3 3-3 3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

type NavItemDef = {
  key: 'dashboard' | 'courses' | 'profile'
  label: string
  icon: React.ReactNode
  path: string
}

const NAV_ITEMS: NavItemDef[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <IconDashboard />, path: '/admin/dashboard' },
  { key: 'courses',   label: 'Courses',   icon: <IconCourses />,   path: '/admin/classes'   },
  { key: 'profile',   label: 'Profile',   icon: <IconProfile />,   path: '/admin/profile'   },
]

function NavButton({
  item,
  isActive,
  onClick,
}: {
  item: NavItemDef
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
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '13.5px',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? '#111111' : hovered ? '#0A0A0B' : '#6B6168',
        backgroundColor: isActive ? '#FFFFFF' : hovered ? 'rgba(255,255,255,0.6)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 120ms ease, color 120ms ease',
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex', opacity: isActive ? 1 : 0.7 }}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </button>
  )
}

export default function AdminMainSidebar({
  activeSection,
  userName = 'User',
  userInitials = '??',
  onNavigate,
  onSignOut,
}: Props) {
  const [signOutHovered, setSignOutHovered] = React.useState(false)

  return (
    <div
      style={{
        width: '200px',
        flexShrink: 0,
        backgroundColor: '#FAF7F4',
        borderRight: '0.5px solid #E5E5E5',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Burgundy left rail */}
      <div
        style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: '3px',
          backgroundColor: '#8B1A2F',
          borderRadius: '0 2px 2px 0',
        }}
      />

      {/* Brand */}
      <div style={{ padding: '18px 16px 14px 20px', borderBottom: '0.5px solid #E5E5E5' }}>
        <p style={{ fontSize: '18px', fontWeight: 800, color: '#8B1A2F', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
          Vine
        </p>
        <p style={{ fontSize: '9.5px', color: '#9C949A', margin: '3px 0 0', letterSpacing: '0.12em', fontWeight: 600 }}>
          ADMIN
        </p>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => (
          <div key={item.key} style={{ marginBottom: '2px' }}>
            <NavButton
              item={item}
              isActive={activeSection === item.key}
              onClick={() => onNavigate(item.path)}
            />
          </div>
        ))}
      </div>

      {/* Account section */}
      <div style={{ borderTop: '0.5px solid #E5E5E5', padding: '10px 8px 12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          marginBottom: '2px',
        }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#8B1A2F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 700,
              flexShrink: 0,
              letterSpacing: '0.02em',
            }}
          >
            {userInitials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#111111',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}>
              {userName}
            </p>
            <p style={{ fontSize: '10px', color: '#9C949A', margin: 0, lineHeight: 1.3 }}>Admin</p>
          </div>
        </div>

        <button
          onClick={onSignOut}
          onMouseEnter={() => setSignOutHovered(true)}
          onMouseLeave={() => setSignOutHovered(false)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 12px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 500,
            color: signOutHovered ? '#0A0A0B' : '#9C949A',
            backgroundColor: signOutHovered ? '#FFFFFF' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 120ms ease, color 120ms ease',
          }}
        >
          <IconSignOut />
          Sign out
        </button>
      </div>
    </div>
  )
}
