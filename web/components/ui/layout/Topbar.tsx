interface TopbarProps {
  userName: string
  userInitials: string
  role: 'tutor' | 'student'
}

export default function Topbar({
  userName,
  userInitials,
  role,
}: TopbarProps) {
  return (
    <div className="h-14 w-full bg-[#111111] flex items-center justify-between px-6">
      {/* Wordmark */}
      <div className="font-sans font-medium text-[18px]">
        <span className="text-white">Love</span>
        <span className="text-[#8B1A2F]">Inc</span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Role Chip */}
        <div className="bg-[#333333] text-white text-[11px] px-2.5 py-1 rounded-full font-medium">
          {role === 'tutor' ? 'Tutor' : 'Student'}
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 bg-[#8B1A2F] rounded-full flex items-center justify-center text-white text-[12px] font-medium">
          {userInitials}
        </div>

        {/* User Name */}
        <span className="text-white text-[13px]">{userName}</span>
      </div>
    </div>
  )
}
