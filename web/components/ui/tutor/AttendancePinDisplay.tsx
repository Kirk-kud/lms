'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface AttendancePinDisplayProps {
  pin: string
  expiresAt: Date
  checkedIn: number
  total: number
  onEndSession: () => void
}

export default function AttendancePinDisplay({
  pin,
  expiresAt,
  checkedIn,
  total,
  onEndSession,
}: AttendancePinDisplayProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const update = () => {
      const diff = expiresAt.getTime() - Date.now()
      if (diff <= 0) {
        setSecondsLeft(0)
        setIsExpired(true)
        setTimeLeft('Expired')
        return
      }
      const s = Math.floor(diff / 1000)
      setSecondsLeft(s)
      const m = Math.floor(s / 60)
      const sec = s % 60
      setTimeLeft(m > 0 ? `${m}m ${sec}s` : `${sec}s`)
      setIsExpired(false)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const isLow = secondsLeft > 0 && secondsLeft < 60

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pin)
      toast.success('PIN copied')
    } catch {
      toast.error('Unable to copy PIN')
    }
  }

  const pinDigits = pin.split('')

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#111111]">
      <div className="w-full max-w-xs text-center px-4">
        {/* Label */}
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#9CA3AF] mb-6">
          Active Session
        </p>

        {/* PIN digits */}
        <div className="flex justify-center gap-3 mb-5">
          {pinDigits.map((digit, i) => (
            <div
              key={i}
              className="flex items-center justify-center rounded-lg border border-[#333333] bg-[#1A1A1A]"
              style={{ width: '60px', height: '72px' }}
            >
              <span className="font-mono text-[36px] font-medium text-white leading-none">
                {digit}
              </span>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-[12px] text-[#6B7280] mb-6 px-1">
          <span className={isLow ? 'text-[#8B1A2F]' : ''}>
            {isExpired ? 'Session expired' : `Expires in ${timeLeft}`}
          </span>
          <span>
            {checkedIn}{total > 0 ? ` / ${total}` : ''} checked in
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 h-9 border border-[#333333] rounded-lg text-[12px] text-[#9CA3AF] hover:border-[#555] hover:text-white transition-colors"
          >
            Copy PIN
          </button>
          <button
            onClick={onEndSession}
            className="flex-1 h-9 border border-[#8B1A2F] rounded-lg text-[12px] text-[#8B1A2F] hover:bg-[#8B1A2F] hover:text-white transition-colors"
          >
            End session
          </button>
        </div>
      </div>
    </div>
  )
}
