'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ApiError } from '@/lib/api'
import { useJoinClass } from '@/lib/hooks/useClasses'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'

export default function JoinClassPageClient() {
  const router = useRouter()
  const joinClass = useJoinClass()
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const data = await joinClass.mutateAsync({ invite_code: inviteCode.trim().toUpperCase() })
      router.push(`/student/classes/${data.id}/modules`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid invite code')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div
        className="w-full bg-white"
        style={{
          maxWidth: '400px',
          borderRadius: '12px',
          border: '0.5px solid #E5E5E5',
          padding: '32px',
        }}
      >
        <div
          className="text-center font-sans font-medium select-none"
          style={{ fontSize: '22px', marginBottom: '24px' }}
        >
          <span style={{ color: '#111111' }}>Love</span>
          <span style={{ color: '#8B1A2F' }}>Inc</span>
        </div>

        <h1 className="text-[16px] font-medium text-[#111] text-center mb-6">Join a class</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '14px' }}>
            <label
              htmlFor="inviteCode"
              style={{ display: 'block', fontSize: '12px', color: '#6B6B6B', marginBottom: '4px' }}
            >
              Invite code
            </label>
            <input
              id="inviteCode"
              type="text"
              autoComplete="one-time-code"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                height: '36px',
                borderRadius: '8px',
                border: '0.5px solid #E5E5E5',
                fontSize: '13px',
                padding: '0 10px',
                outline: 'none',
                boxSizing: 'border-box',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
            />
          </div>

          <button
            type="submit"
            disabled={joinClass.isPending || !inviteCode.trim()}
            style={{
              width: '100%',
              height: '36px',
              marginTop: '8px',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: joinClass.isPending ? 'not-allowed' : 'pointer',
              opacity: joinClass.isPending ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {joinClass.isPending && <LoadingSpinner className="text-white" />}
            {joinClass.isPending ? 'Joining...' : 'Join'}
          </button>

          {error && (
            <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '10px', textAlign: 'center' }}>
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
