'use client'

import React from 'react'
import { useClass } from '@/lib/hooks/useClasses'

interface Props {
  classId: string
  activeItem: string
  onNavigate: (segment: string) => void
}

const IconCohorts = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM2 9c0-1.1.9-2 2-2h2c.55 0 1.05.22 1.41.59A4 4 0 0 0 7 9v4H2V9zm7 0c0-.55.12-1.07.34-1.54A2 2 0 0 1 10 7h2a2 2 0 0 1 2 2v4h-5V9z" />
  </svg>
)

const IconRoster = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2h12v2H2V2zm0 3h12v2H2V5zm0 3h12v2H2V8zm0 3h8v2H2v-2z" />
  </svg>
)

const IconModules = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1 2h6v6H1V2zm8 0h6v6H9V2zM1 10h6v4H1v-4zm8 0h6v4H9v-4z" />
  </svg>
)

const IconAssignments = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 2h10v2H3V2zm1 4h8v1H4V6zm0 2h8v1H4V8zm0 2h5v1H4v-1z" />
  </svg>
)

const IconAttendance = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm2.5 8h-5v-1h5v1z" />
  </svg>
)

const IconSettings = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM8 7a1 1 0 110 2A1 1 0 018 7z" />
    <path d="M6.8 0l-.3 1.2a5.5 5.5 0 00-1.3.75L4 1.4 1.4 4l.55 1.2A5.5 5.5 0 001.2 6.5H0v3h1.2c.1.5.3.9.55 1.3L1.4 12 4 14.6l1.2-.55c.4.25.85.45 1.3.55L6.8 16h2.4l.3-1.2c.45-.1.9-.3 1.3-.55L12 14.6 14.6 12l-.55-1.2c.25-.4.45-.85.55-1.3H16v-3h-1.2a5.5 5.5 0 00-.55-1.3L14.6 4 12 1.4l-1.2.55A5.5 5.5 0 009.5 1.2L9.2 0H6.8zm.6 1.5h1.2l.27 1.1.7.27c.37.14.72.32 1.04.54l.6.43 1.05-.48.85.85-.48 1.05.43.6c.22.32.4.67.54 1.04l.27.7 1.1.27v1.2l-1.1.27-.27.7a4 4 0 01-.54 1.04l-.43.6.48 1.05-.85.85-1.05-.48-.6.43a4 4 0 01-1.04.54l-.7.27-1.1.27H7.4l-.27-1.1-.7-.27a4 4 0 01-1.04-.54l-.6-.43-1.05.48-.85-.85.48-1.05-.43-.6a4 4 0 01-.54-1.04l-.27-.7L1.5 9.2V8l1.1-.27.27-.7c.14-.37.32-.72.54-1.04l.43-.6-.48-1.05.85-.85 1.05.48.6-.43A4 4 0 016.43 2.87l.7-.27L7.4 1.5z" />
  </svg>
)

type NavItemDef = {
  label: string
  icon: React.ReactNode
  segment: string
}

const NAV_GROUPS: { items: NavItemDef[] }[] = [
  {
    items: [
      { label: 'Cohorts',     icon: <IconCohorts />,     segment: 'cohorts'     },
      { label: 'Roster',      icon: <IconRoster />,      segment: 'roster'      },
    ],
  },
  {
    items: [
      { label: 'Modules',     icon: <IconModules />,     segment: 'modules'     },
      { label: 'Assignments', icon: <IconAssignments />, segment: 'assignments' },
      { label: 'Attendance',  icon: <IconAttendance />,  segment: 'attendance'  },
    ],
  },
  {
    items: [
      { label: 'Settings',    icon: <IconSettings />,    segment: 'settings'    },
    ],
  },
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
        gap: '9px',
        padding: '7px 12px',
        borderRadius: '7px',
        fontSize: '13px',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? '#111111' : hovered ? '#0A0A0B' : '#6B6168',
        backgroundColor: isActive ? '#FFFFFF' : hovered ? 'rgba(255,255,255,0.7)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 100ms ease, color 100ms ease',
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex', opacity: isActive ? 1 : 0.65 }}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </button>
  )
}

export default function AdminInnerSidebar({ classId, activeItem, onNavigate }: Props) {
  const { data: classData, isLoading } = useClass(classId)

  return (
    <div
      style={{
        width: '210px',
        flexShrink: 0,
        backgroundColor: '#F3F0EE',
        borderRight: '0.5px solid #E5E5E5',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Class header */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '0.5px solid #E5E5E5' }}>
        {isLoading ? (
          <div style={{ height: '16px', width: '130px', backgroundColor: '#E0DADA', borderRadius: '4px', marginBottom: '6px' }} />
        ) : (
          <p style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#111111',
            margin: '0 0 3px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}>
            {classData?.title ?? '—'}
          </p>
        )}
        <p style={{ fontSize: '11px', color: '#9C949A', margin: 0, lineHeight: 1 }}>
          {classData
            ? `${classData.enrolled_count} ${classData.enrolled_count === 1 ? 'student' : 'students'}`
            : ' '}
        </p>
      </div>

      {/* Navigation groups */}
      <div style={{ flex: 1, padding: '10px 8px' }}>
        {NAV_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <div style={{ height: '0.5px', backgroundColor: '#E5E5E5', margin: '6px 4px' }} />
            )}
            {group.items.map((item) => (
              <div key={item.label} style={{ marginBottom: '1px' }}>
                <NavButton
                  item={item}
                  isActive={activeItem === item.label}
                  onClick={() => onNavigate(item.segment)}
                />
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
