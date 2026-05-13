'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useClasses, useJoinClass } from '@/lib/hooks/useClasses'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { ApiError } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'

function ClassCard({
  title,
  description,
  tutorName,
  enrolledCount,
  onClick,
}: {
  title: string
  description: string | null
  tutorName?: string
  enrolledCount: number
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const safeTitle = title ?? ''
  const isDA = safeTitle.toLowerCase().includes('discipleship')

  const bannerStyle: React.CSSProperties = isDA
    ? {
        height: '160px',
        background: '#F5EEF0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }
    : {
        height: '100px',
        background: `hsl(${(safeTitle.charCodeAt(0) * 47) % 360}, 35%, 55%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        textAlign: 'left',
        background: '#FFFFFF',
        border: '1px solid',
        borderColor: hovered ? '#C9B8B4' : '#ECE6E0',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 120ms ease',
      }}
    >
      {/* Banner */}
      <div style={bannerStyle}>
        {isDA ? (
          <img
            src="/da-logo.png"
            alt="The Discipleship Academy"
            style={{ width: '120px', height: '120px', objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: '36px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
            {safeTitle.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isDA && (
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#8B1A2F', textTransform: 'uppercase', letterSpacing: '0.10em', margin: 0 }}>
            The Discipleship Academy
          </p>
        )}
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0B', margin: 0, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </p>
        {description && (
          <p
            style={{
              fontSize: '12.5px',
              color: '#9C949A',
              margin: 0,
              lineHeight: 1.5,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {tutorName && <span style={{ fontSize: '11.5px', color: '#6B6168' }}>{tutorName}</span>}
            <span style={{ fontSize: '11px', color: '#9C949A' }}>{enrolledCount} enrolled</span>
          </div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: hovered ? '#FFFFFF' : '#8B1A2F',
              backgroundColor: hovered ? '#8B1A2F' : 'rgba(139,26,47,0.08)',
              padding: '5px 14px',
              borderRadius: '6px',
              transition: 'background 120ms ease, color 120ms ease',
              flexShrink: 0,
            }}
          >
            Open →
          </span>
        </div>
      </div>
    </button>
  )
}

function JoinModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const join = useJoinClass()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('Enter the class code'); return }
    try {
      await join.mutateAsync({ invite_code: trimmed })
      toast.success('Joined class!')
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid code — check with your tutor')
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,11,0.35)' }} />

      <div
        style={{
          position: 'relative',
          background: '#FFFFFF',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '360px',
          margin: '0 16px',
          padding: '28px 24px 24px',
          zIndex: 1,
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0A0A0B', margin: '0 0 6px' }}>
          Join a class
        </h2>
        <p style={{ fontSize: '13px', color: '#9C949A', margin: '0 0 20px' }}>
          Enter the invite code from your tutor.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
            placeholder="e.g. ABC123"
            maxLength={12}
            style={{
              width: '100%',
              height: '42px',
              border: error ? '1px solid #B0182E' : '1px solid #E5E5E5',
              borderRadius: '8px',
              padding: '0 14px',
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: '#0A0A0B',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'monospace',
            }}
          />
          {error && (
            <p style={{ fontSize: '12px', color: '#B0182E', margin: '6px 0 0' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                height: '38px',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                background: 'transparent',
                fontSize: '13.5px',
                color: '#6B6168',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={join.isPending}
              style={{
                flex: 2,
                height: '38px',
                border: 'none',
                borderRadius: '8px',
                background: join.isPending ? '#6B1525' : '#8B1A2F',
                color: '#FFFFFF',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: join.isPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {join.isPending && <LoadingSpinner className="text-white" />}
              {join.isPending ? 'Joining…' : 'Join class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ClassesPageClient() {
  const router = useRouter()
  const { data: classes = [], isLoading } = useClasses()
  const [joinOpen, setJoinOpen] = useState(false)

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="text-[22px] sm:text-[28px]" style={{ fontWeight: 700, color: '#0A0A0B', letterSpacing: '-0.02em', margin: 0 }}>
            My Classes
          </h1>
          {!isLoading && (
            <p style={{ fontSize: '13px', color: '#9C949A', margin: '4px 0 0' }}>
              {classes.length === 0 ? 'No classes yet' : `${classes.length} class${classes.length !== 1 ? 'es' : ''} enrolled`}
            </p>
          )}
        </div>
        <button
          onClick={() => setJoinOpen(true)}
          style={{
            height: '36px',
            padding: '0 16px',
            background: '#8B1A2F',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '7px',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#A52038')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#8B1A2F')}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Join a class
        </button>
      </div>

      {isLoading && <SkeletonCard lines={4} />}

      {!isLoading && classes.length === 0 && (
        <div
          style={{
            border: '1px dashed #E5E5E5',
            borderRadius: '12px',
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(139,26,47,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0B', margin: '0 0 6px' }}>No classes yet</p>
          <p style={{ fontSize: '13px', color: '#9C949A', margin: '0 0 20px' }}>
            Ask your tutor for an invite code to get started.
          </p>
          <button
            onClick={() => setJoinOpen(true)}
            style={{
              height: '36px',
              padding: '0 20px',
              background: '#8B1A2F',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '7px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#A52038')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#8B1A2F')}
          >
            Join a class
          </button>
        </div>
      )}

      {!isLoading && classes.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '14px',
          }}
        >
          {classes.map((c) => (
            <ClassCard
              key={c.id}
              title={c.title}
              description={c.description}
              tutorName={c.tutor?.full_name}
              enrolledCount={c.enrolled_count}
              onClick={() => router.push(`/student/classes/${c.id}`)}
            />
          ))}
        </div>
      )}

      {joinOpen && <JoinModal onClose={() => setJoinOpen(false)} />}
    </div>
  )
}
