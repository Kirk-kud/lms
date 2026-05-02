import React from 'react';

interface SidebarProps {
  variant: 'admin' | 'student' | 'tutor';
  activeItem: string;
  onNavigate: (item: string) => void;
  onSignOut: () => void;
  userName?: string;
  userInitials?: string;
}

const IconOverview = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 3h4v4H2V3zm6 0h4v4H8V3zM2 9h4v4H2V9zm6 0h4v4h-4V9z" />
  </svg>
);

const IconModules = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1 2h6v6H1V2zm8 0h6v6H9V2zM1 10h6v4H1v-4zm8 0h6v4H9v-4z" />
  </svg>
);

const IconAssignments = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3 2h10v2H3V2zm1 4h8v1H4V6zm0 2h8v1H4V8zm0 2h5v1H4v-1z" />
  </svg>
);

const IconAttendance = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 110 2 1 1 0 010-2zm3 7H5v-1h6v1z" />
  </svg>
);

const IconRoster = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2 2h12v2H2V2zm0 3h12v2H2V5zm0 3h12v2H2V8zm0 3h12v2H2v-2z" />
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 5a3 3 0 100 6A3 3 0 008 5zm0 1.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    <path d="M6.5 0l-.4 1.4a5.9 5.9 0 00-1.4.8L3.2.8 1 3l.9 1.5a6 6 0 00-.4 1.5H0v3h1.5a6 6 0 00.4 1.5L1 12l2.2 2.2 1.5-.9a5.9 5.9 0 001.4.8L6.5 16h3l.4-1.4a5.9 5.9 0 001.4-.8l1.5.9L15 12.2l-.9-1.5a6 6 0 00.4-1.5H16V6h-1.5a6 6 0 00-.4-1.5L15 3l-2.2-2.2-1.5.9a5.9 5.9 0 00-1.4-.8L9.5 0h-3zm.7 1.5h1.6l.3 1.2.8.3a4.4 4.4 0 011 .6l.7.5 1.1-.6.8.8-.6 1.1.3.8a4.4 4.4 0 01.2 1.1l.1.8 1.2.3v1.2l-1.2.3-.1.8a4.4 4.4 0 01-.3 1l-.3.8.6 1.1-.8.8-1.1-.6-.8.3a4.4 4.4 0 01-1 .3l-.8.1-.3 1.2H7.2L7 13.7l-.8-.1a4.4 4.4 0 01-1-.3l-.8-.3-1.1.6-.8-.8.6-1.1-.3-.8a4.4 4.4 0 01-.3-1l-.1-.8-1.2-.3V7.2l1.2-.3.1-.8a4.4 4.4 0 01.3-1l.3-.8-.6-1.1.8-.8 1.1.6.8-.3a4.4 4.4 0 011-.3l.8-.1.3-1.1z" />
  </svg>
);

const IconCohorts = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM2 9c0-1.1.9-2 2-2h2c.55 0 1.05.22 1.41.59A4 4 0 0 0 7 9v4H2V9zm7 0c0-.55.12-1.07.34-1.54A2 2 0 0 1 10 7h2a2 2 0 0 1 2 2v4h-5V9z" />
  </svg>
);

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1L2 6v8h3v-4h2v4h3V6l-6-5z" />
  </svg>
);

const IconSignOut = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5 2H3v10h2M9 4l3 3-3 3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type NavItem = { label: string; icon: React.ReactNode };
type Section = { name: string; items: NavItem[] };

const ADMIN_SECTIONS: Section[] = [
  {
    name: 'TEACH',
    items: [
      { label: 'Overview', icon: <IconOverview /> },
      { label: 'Modules', icon: <IconModules /> },
      { label: 'Assignments', icon: <IconAssignments /> },
      { label: 'Attendance', icon: <IconAttendance /> },
    ],
  },
  {
    name: 'CLASS',
    items: [
      { label: 'Cohorts', icon: <IconCohorts /> },
      { label: 'Roster', icon: <IconRoster /> },
      { label: 'Settings', icon: <IconSettings /> },
    ],
  },
];

const STUDENT_SECTIONS: Section[] = [
  {
    name: 'WORKSPACE',
    items: [
      { label: 'Home', icon: <IconHome /> },
      { label: 'Modules', icon: <IconModules /> },
      { label: 'Assignments', icon: <IconAssignments /> },
      { label: 'Attendance', icon: <IconAttendance /> },
    ],
  },
];

const TUTOR_SECTIONS: Section[] = [
  {
    name: 'WORKSPACE',
    items: [
      { label: 'Dashboard', icon: <IconOverview /> },
      { label: 'My Cohort', icon: <IconRoster /> },
    ],
  },
  {
    name: 'CONTENT',
    items: [
      { label: 'Modules', icon: <IconModules /> },
      { label: 'Assignments', icon: <IconAssignments /> },
      { label: 'Attendance', icon: <IconAttendance /> },
    ],
  },
];

function NavButton({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
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
        fontWeight: isActive ? 600 : 500,
        color: isActive ? '#FFFFFF' : hovered ? '#0A0A0B' : '#6B6168',
        backgroundColor: isActive ? '#8B1A2F' : hovered ? '#FFFFFF' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 120ms ease, color 120ms ease',
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function SignOutButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = React.useState(false);
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
  );
}

export default function Sidebar({
  variant,
  activeItem,
  onNavigate,
  onSignOut,
  userName = 'User',
  userInitials = '??',
}: SidebarProps) {
  const sections =
    variant === 'admin' ? ADMIN_SECTIONS : variant === 'tutor' ? TUTOR_SECTIONS : STUDENT_SECTIONS;
  const roleLabel = variant === 'admin' ? 'Admin' : variant === 'tutor' ? 'Tutor' : 'Student';

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

      {/* Navigation sections */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: '12px' }}>
        {sections.map((section) => (
          <div key={section.name}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#9C949A',
                padding: '12px 22px 6px',
              }}
            >
              {section.name}
            </div>
            {section.items.map((item) => (
              <div key={item.label} style={{ margin: '2px 12px' }}>
                <NavButton
                  label={item.label}
                  icon={item.icon}
                  isActive={activeItem === item.label}
                  onClick={() => onNavigate(item.label)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Account section */}
      <div style={{ borderTop: '1px solid #ECE6E0' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#9C949A',
            padding: '12px 22px 6px',
          }}
        >
          ACCOUNT
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 22px 8px',
          }}
        >
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
              {roleLabel}
            </p>
          </div>
        </div>
        <div style={{ margin: '0 12px 12px' }}>
          <SignOutButton onClick={onSignOut} />
        </div>
      </div>
    </div>
  );
}
