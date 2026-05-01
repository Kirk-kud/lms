'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ApiError } from '@/lib/api'
import { useJoinClass } from '@/lib/hooks/useClasses'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'
import globalBlack from '@/public/global_black.png'
import globalWhite from '@/public/global_white.png'

// Photo carousel with different slides than login
// position: controls object-fit focal point (e.g. 'center', 'top', 'bottom', 'left', '30% 20%')
const SLIDES = [
  { src: '/photos/homecoming-opening-prayer.jpg', caption: 'Homecoming 2025', position: 'center' },
  { src: '/photos/taking-notes.jpg', caption: 'Taking Notes', position: 'center' },
  { src: '/photos/worship-at-homecoming.jpg', caption: 'Worship - Homecoming 2025', position: '80% center' },
  { src: '/photos/love-and-friendship.jpg', caption: 'Love & Community', position: '15% center' },
  { src: '/photos/fire-night-ashesi.jpg', caption: 'Joy In The Word', position: 'center' },
]

function JoinPhotoCarousel() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className="hidden md:block w-1/2 relative overflow-hidden bg-black"
      style={{ height: '100vh', flexShrink: 0 }}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: i === active ? 1 : 0,
            transition: 'opacity 800ms ease-in-out',
          }}
        >
          <Image
            src={slide.src}
            alt={slide.caption}
            fill
            sizes="100vw"
            quality={95}
            placeholder="empty"
            style={{ objectFit: 'cover', objectPosition: slide.position || 'center' }}
            priority={i === 0}
          />
        </div>
      ))}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          zIndex: 10,
        }}
      />

      <div style={{ position: 'absolute', top: '24px', left: '28px', zIndex: 20 }}>
        <Image
          src={globalWhite}
          alt="Love Inc"
          width={60}
          height={40}
          style={{ display: 'block', width: 'auto', height: '40px' }}
        />
      </div>

      <div style={{ position: 'absolute', bottom: '28px', left: '28px', zIndex: 20 }}>
        <p style={{ color: 'white', fontSize: '13px', fontWeight: 400, marginBottom: '10px' }}>
          {SLIDES[active].caption}
        </p>
        <div style={{ display: 'flex', gap: '6px' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: i === active ? 'white' : 'rgba(255,255,255,0.4)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'background-color 300ms ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const focusInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#8B1A2F'
  e.currentTarget.style.borderWidth = '1px'
}

const blurInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#E5E5E5'
  e.currentTarget.style.borderWidth = '0.5px'
}

export default function JoinClassPageClient() {
  const router = useRouter()
  const joinClass = useJoinClass()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.replace('/login')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await joinClass.mutateAsync({ invite_code: code.trim().toUpperCase() })
      router.push(`/student/classes/${data.id}/modules`)
    } catch (err) {
      let errorMessage = 'Something went wrong. Try again.'
      
      if (err instanceof ApiError) {
        const msg = err.message.toLowerCase()
        if (msg.includes('not found') || msg.includes("doesn't match")) {
          errorMessage = "That code doesn't match any class. Double-check with your tutor."
        } else if (msg.includes('already enrolled') || msg.includes('already in')) {
          errorMessage = "You're already in this class."
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .join-submit-btn { transition: background-color 200ms cubic-bezier(0.16, 1, 0.3, 1); }
        .join-submit-btn:hover:not(:disabled) { background-color: #8B1A2F !important; }
        .join-submit-btn:focus-visible { outline: 2px solid #8B1A2F; outline-offset: 2px; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh' }}>
        <JoinPhotoCarousel />

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 48px',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ width: '100%', maxWidth: '360px' }}>
            {/* Mobile logo */}
            <div className="md:hidden flex flex-col items-center" style={{ marginBottom: '24px' }}>
              <img
                src={globalBlack.src}
                alt="Love Inc"
                className="w-16 h-auto"
                style={{ marginBottom: '8px' }}
              />
            </div>

            <h1
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#111111',
                lineHeight: 1.2,
                marginBottom: '8px',
              }}
            >
              You're in the right place.
            </h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '32px' }}>
              Enter the invite code your tutor shared with you.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="inviteCode"
                  style={{
                    fontSize: '12px',
                    color: '#6B6B6B',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Invite code
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  maxLength={8}
                  placeholder="e.g. ASH-4921"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '8px',
                    border: '0.5px solid #E5E5E5',
                    fontSize: '20px',
                    fontWeight: 500,
                    fontFamily: 'monospace',
                    letterSpacing: '0.15em',
                    padding: '0 14px',
                    textAlign: 'center',
                    outline: 'none',
                    color: '#111111',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              </div>

              {error && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#991B1B',
                    marginBottom: '12px',
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="join-submit-btn"
                disabled={isLoading || !code.trim()}
                aria-busy={isLoading}
                style={{
                  width: '100%',
                  height: '36px',
                  backgroundColor: '#111111',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: isLoading || !code.trim() ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !code.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isLoading && <LoadingSpinner className="text-white" />}
                {isLoading ? 'Joining...' : 'Join class'}
              </button>
            </form>

            <p
              style={{
                fontSize: '12px',
                color: '#9CA3AF',
                textAlign: 'center',
                marginTop: '20px',
              }}
            >
              Don't have a code?{' '}
              <a
                href="mailto:loveinc@example.com"
                style={{
                  color: '#8B1A2F',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Contact your tutor
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
