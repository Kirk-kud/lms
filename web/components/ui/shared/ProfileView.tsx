'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { StatusBadge } from './Badge'
import { SkeletonCard } from './SkeletonCard'

export default function ProfileView() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  const fullName = (user?.user_metadata?.full_name as string) ?? ''
  const email = user?.email ?? ''
  const role = (user?.user_metadata?.role as 'student' | 'admin' | 'tutor' | null) ?? null
  const initials = fullName
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="p-8" style={{ maxWidth: '560px' }}>
        <div style={{ marginBottom: '32px', height: '28px', width: '80px', backgroundColor: '#F0F0F0', borderRadius: '6px' }} />
        <SkeletonCard lines={3} />
      </div>
    )
  }

  return (
    <div className="p-8" style={{ maxWidth: '560px' }}>
      {/* Page heading */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#111111', margin: 0 }}>Profile</h1>
      </div>

      {/* Identity block */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#8B1A2F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '22px',
            fontWeight: 500,
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          {initials || '?'}
        </div>
        <div>
          <p style={{ fontSize: '18px', fontWeight: 500, color: '#111111', margin: 0, lineHeight: 1.3 }}>
            {fullName || 'No name set'}
          </p>
          {role && (
            <div style={{ marginTop: '6px' }}>
              <StatusBadge variant="wine" label={role === 'admin' ? 'Admin' : role === 'tutor' ? 'Tutor' : 'Student'} />
            </div>
          )}
        </div>
      </div>

      {/* Detail rows */}
      <div style={{ borderTop: '0.5px solid #E5E5E5' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0',
            borderBottom: '0.5px solid #E5E5E5',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            Full name
          </span>
          <span style={{ fontSize: '13px', color: '#111111' }}>{fullName || '—'}</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0',
            borderBottom: '0.5px solid #E5E5E5',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            Email
          </span>
          <span style={{ fontSize: '13px', color: '#111111' }}>{email || '—'}</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0',
            borderBottom: '0.5px solid #E5E5E5',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            Role
          </span>
          {role ? (
            <StatusBadge variant="wine" label={role === 'admin' ? 'Admin' : role === 'tutor' ? 'Tutor' : 'Student'} />
          ) : (
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>—</span>
          )}
        </div>
      </div>

      {/* Sign out */}
      <div style={{ marginTop: '40px' }}>
        <button
          onClick={handleSignOut}
          style={{
            fontSize: '13px',
            color: '#6B7280',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            transition: 'color 150ms ease-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#991B1B')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7280')}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
