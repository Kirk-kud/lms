import React from 'react';

interface SidebarProps {
  variant: 'tutor' | 'student';
  activeItem: string;
  onNavigate: (item: string) => void;
  onSignOut: () => void;
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

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1L2 6v8h3v-4h2v4h3V6l-6-5z" />
  </svg>
);

const IconSignOut = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M6 2H3v12h3v2H2V0h4v2zm6 4l3 3-3 3v-2h-4v-2h4V6z" />
  </svg>
);

type NavItem = {
  label: string;
  icon: React.ReactNode;
};

type Section = {
  name: string;
  items: NavItem[];
};

const TUTOR_SECTIONS: Section[] = [
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
      { label: 'Roster', icon: <IconRoster /> },
      { label: 'Settings', icon: <IconSettings /> },
    ],
  },
];

const STUDENT_SECTIONS: Section[] = [
  {
    name: 'MY CLASS',
    items: [
      { label: 'Home', icon: <IconHome /> },
      { label: 'Modules', icon: <IconModules /> },
      { label: 'Assignments', icon: <IconAssignments /> },
      { label: 'Attendance', icon: <IconAttendance /> },
    ],
  },
];

export default function Sidebar({
  variant,
  activeItem,
  onNavigate,
  onSignOut,
}: SidebarProps) {
  const sections = variant === 'tutor' ? TUTOR_SECTIONS : STUDENT_SECTIONS;

  return (
    <div
      className="flex flex-col h-screen bg-[#F8F8F8] border-r-[0.5px] border-[#E5E5E5]"
      style={{ width: '200px' }}
    >
      {/* Navigation sections */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.name}>
            <div
              className="text-tiny uppercase"
              style={{
                letterSpacing: '0.08em',
                color: '#9CA3AF',
                padding: '16px 16px 4px',
              }}
            >
              {section.name}
            </div>

            {section.items.map((item) => (
              <button
                key={item.label}
                onClick={() => onNavigate(item.label)}
                className={`w-full flex flex-row items-center gap-2 px-4 cursor-pointer transition-colors text-body-sm ${
                  activeItem === item.label
                    ? 'h-10 bg-white text-[#111111] font-medium'
                    : 'h-10 text-[#6B7280] hover:bg-[#F0F0F0]'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Sign out button - pinned to bottom */}
      <div className="border-t-[0.5px] border-[#E5E5E5]">
        <button
          onClick={onSignOut}
          className="w-full flex flex-row items-center gap-2 px-4 h-10 text-[#6B7280] hover:text-[#111111] transition-colors text-body-sm"
          style={{
            background: 'transparent',
          }}
        >
          <span className="flex-shrink-0">
            <IconSignOut />
          </span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
