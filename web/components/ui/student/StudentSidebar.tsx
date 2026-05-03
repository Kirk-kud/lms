'use client'

import React from 'react'

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1L2 6v8h3v-4h2v4h3V6l-6-5z" />
  </svg>
)

const IconClasses = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="1" width="6" height="6" rx="1" />
    <rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
)

const IconOverview = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1 1h6v5H1V1zm8 0h6v5H9V1zM1 8h6v7H1V8zm8 3h6v4H9v-4z" />
  </svg>
)

const IconModules = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1 2h6v6H1V2zm8 0h6v6H9V2zM1 10h6v4H1v-4zm8 0h6v4H9v-4z" />
  </svg>
)

const IconAssignments = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 2h10v2H3V2zm1 4h8v1H4V6zm0 2h8v1H4V8zm0 2h5v1H4v-1z" />
  </svg>
)

const IconAttendance = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 110 2 1 1 0 010-2zm3 7H5v-1h6v1z" />
  </svg>
)

const IconChevronLeft = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M8.5 2L4 6.5l4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconSignOut = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5 2H3v10h2M9 4l3 3-3 3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const sectionLabel: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: '#9C949A',
  padding: '12px 22px 6px',
}

function NavButton({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string
  icon: React.ReactNode
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
        gap: '12px',
        padding: '9px 12px',
        borderRadius: '8px',
        fontSize: '13.5px',
        fontWeight: isActive || hovered ? 600 : 500,
        color: isActive || hovered ? '#FFFFFF' : '#6B6168',
        backgroundColor: isActive ? '#6B1525' : hovered ? '#8B1A2F' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 120ms ease, color 120ms ease',
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function SignOutButton({ onClick }: { onClick: () => void }) {
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
        gap: '8px',
        padding: '7px 12px',
        borderRadius: '8px',
        fontSize: '12.5px',
        fontWeight: 500,
        color: hovered ? '#0A0A0B' : '#9C949A',
        backgroundColor: hovered ? '#FFFFFF' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 120ms ease, color 120ms ease',
      }}
    >
      <IconSignOut />
      Sign out
    </button>
  )
}

interface StudentSidebarProps {
  context: 'home' | 'class'
  classId?: string
  className?: string
  activeItem: string
  onNavigate: (label: string) => void
  onSignOut: () => void
  userName?: string
  userInitials?: string
}

export default function StudentSidebar({
  context,
  className,
  activeItem,
  onNavigate,
  onSignOut,
  userName = 'Student',
  userInitials = '??',
}: StudentSidebarProps) {
  const [backHovered, setBackHovered] = React.useState(false)

  return (
    <div
      style={{
        width: '260px',
        backgroundColor: '#FAF7F4',
        borderRight: '1px solid #ECE6E0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Crimson left rail */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          backgroundColor: '#8B1A2F',
          borderRadius: '0 2px 2px 0',
        }}
      />

      <div style={{ flex: 1, overflowY: 'auto', paddingTop: '12px' }}>
        {context === 'home' ? (
          <div>
            <div style={sectionLabel}>WORKSPACE</div>
            <div style={{ margin: '2px 12px' }}>
              <NavButton
                label="Dashboard"
                icon={<IconHome />}
                isActive={activeItem === 'Dashboard'}
                onClick={() => onNavigate('Dashboard')}
              />
            </div>
            <div style={{ margin: '2px 12px' }}>
              <NavButton
                label="Classes"
                icon={<IconClasses />}
                isActive={activeItem === 'Classes'}
                onClick={() => onNavigate('Classes')}
              />
            </div>
          </div>
        ) : (
          <div>
            {/* Back to all classes */}
            <button
              onClick={() => onNavigate('All Classes')}
              onMouseEnter={() => setBackHovered(true)}
              onMouseLeave={() => setBackHovered(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                fontSize: '12px',
                fontWeight: 500,
                color: backHovered ? '#0A0A0B' : '#9C949A',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                transition: 'color 120ms ease',
              }}
            >
              <IconChevronLeft />
              All Classes
            </button>

            {/* Class name label */}
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#9C949A',
                padding: '8px 22px 6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {className ?? 'Class'}
            </div>

            <div style={{ margin: '2px 12px' }}>
              <NavButton
                label="Overview"
                icon={<IconOverview />}
                isActive={activeItem === 'Overview'}
                onClick={() => onNavigate('Overview')}
              />
            </div>
            <div style={{ margin: '2px 12px' }}>
              <NavButton
                label="Modules"
                icon={<IconModules />}
                isActive={activeItem === 'Modules'}
                onClick={() => onNavigate('Modules')}
              />
            </div>
            <div style={{ margin: '2px 12px' }}>
              <NavButton
                label="Assignments"
                icon={<IconAssignments />}
                isActive={activeItem === 'Assignments'}
                onClick={() => onNavigate('Assignments')}
              />
            </div>
            <div style={{ margin: '2px 12px' }}>
              <NavButton
                label="Attendance"
                icon={<IconAttendance />}
                isActive={activeItem === 'Attendance'}
                onClick={() => onNavigate('Attendance')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Account section */}
      <div style={{ borderTop: '1px solid #ECE6E0' }}>
        <div style={sectionLabel}>ACCOUNT</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 22px 8px' }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#8B1A2F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '9px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {userInitials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#0A0A0B',
                margin: 0,
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userName}
            </p>
            <p style={{ fontSize: '11px', color: '#6B6168', margin: 0, lineHeight: 1.3 }}>
              Student
            </p>
          </div>
        </div>
        <div style={{ margin: '0 12px 12px' }}>
          <SignOutButton onClick={onSignOut} />
        </div>
      </div>
    </div>
  )
}
