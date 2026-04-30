'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'

interface AttendanceCheckInProps {
  sessionActive: boolean
  onSubmitPin: (pin: string) => Promise<void>
  checkedInAt?: Date
}

export default function AttendanceCheckIn({
  sessionActive,
  onSubmitPin,
  checkedInAt,
}: AttendanceCheckInProps) {
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(value)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length !== 4) {
      setError('Enter the 4-digit PIN from your tutor')
      return
    }
    setIsLoading(true)
    try {
      await onSubmitPin(pin)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to check in')
    } finally {
      setIsLoading(false)
    }
  }

  if (checkedInAt) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[#DCFCE7] flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-[14px] font-medium text-[#111]">Checked in</p>
        <p className="text-[12px] text-[#9CA3AF] mt-1">
          {format(checkedInAt, 'h:mm a')}
        </p>
      </div>
    )
  }

  if (!sessionActive) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F8F8F8] flex items-center justify-center mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <p className="text-[14px] font-medium text-[#111]">No active session</p>
        <p className="text-[13px] text-[#9CA3AF] mt-1">Your tutor will start one before class begins</p>
      </div>
    )
  }

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#8B1A2F]" style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
        <p className="text-[13px] font-medium text-[#111]">Session is live</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={handlePinChange}
          placeholder="0000"
          autoFocus
          className="w-full h-14 text-center text-[28px] font-mono tracking-[0.3em] border rounded-lg outline-none transition-colors bg-white"
          style={{
            borderColor: error ? '#991B1B' : pin.length === 4 ? '#8B1A2F' : '#E5E5E5',
            borderWidth: pin.length === 4 ? '1px' : '0.5px',
          }}
        />

        {error && (
          <p className="text-[12px] text-[#991B1B] text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || pin.length !== 4}
          className="w-full h-9 bg-[#111111] text-white text-[13px] font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#8B1A2F] transition-colors flex items-center justify-center gap-2"
        >
          {isLoading && <LoadingSpinner className="text-white" />}
          {isLoading ? 'Checking in...' : 'Check in'}
        </button>
      </form>
    </div>
  )
}
