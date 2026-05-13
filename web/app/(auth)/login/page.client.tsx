'use client'

import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/ui/shared/PasswordInput'
import globalBlack from '@/public/global_black.png'
import { PhotoCarousel } from '@/components/ui/shared/PhotoCarousel'

interface LoginResponse {
  access_token: string
  refresh_token: string
  user: { id: string; email: string; full_name: string | null; role: string | null }
}

const Spinner = () => (
  <svg
    className="auth-spinner"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
    style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}
  >
    <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
    <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <style>{`
      @keyframes auth-spin { to { transform: rotate(360deg); } }
      .auth-spinner { animation: auth-spin 0.7s linear infinite; }
      @media (prefers-reduced-motion: reduce) { .auth-spinner { animation: none !important; opacity: 0.5; } }
    `}</style>
  </svg>
)

const focusInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#8B1A2F'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,26,47,0.10)'
}

const blurInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#E5E5E5'
  e.currentTarget.style.boxShadow = 'none'
}

export default function LoginPageClient() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = (await res.json()) as { data: LoginResponse; message?: string }
      if (!res.ok) throw new Error(json.message ?? 'Invalid credentials')

      const { access_token, refresh_token, user } = json.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)

      const supabase = createClient()
      await supabase.auth.signInWithPassword({ email, password })

      toast.success(`Welcome back${user.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!`, {
        description: 'You have been signed in successfully.',
      })
      router.push(
        user.role === 'admin'
          ? '/admin/dashboard'
          : user.role === 'tutor'
          ? '/tutor/dashboard'
          : '/student/dashboard',
      )
    } catch (err) {
      toast.error('Sign in failed', {
        description: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .auth-btn { transition: background-color 180ms cubic-bezier(0.16, 1, 0.3, 1); }
        .auth-btn:hover:not(:disabled) { background-color: #6F1325 !important; }
        .auth-btn:focus-visible { outline: 2px solid #8B1A2F; outline-offset: 2px; }
        .auth-input { transition: border-color 150ms ease, box-shadow 150ms ease; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh' }}>

        {/* Left: photo carousel */}
        <PhotoCarousel />

        {/* Right: form panel */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            overflowY: 'auto',
          }}
        >
          {/* Top: Logo */}
          <div style={{ padding: '28px 40px 0' }} className="hidden md:flex">
            <Image src={globalBlack} alt="Love Inc" style={{ width: 'auto', height: '36px' }} />
          </div>

          {/* Brand hero block */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 48px',
            }}
          >
            {/* Mobile logo */}
            <div className="md:hidden flex justify-center" style={{ marginBottom: '32px' }}>
              <Image src={globalBlack} alt="Love Inc" style={{ width: 'auto', height: '36px' }} />
            </div>

            {/* ── Vine branding block ── */}
            <div
              style={{
                width: '100%',
                maxWidth: '360px',
                marginBottom: '48px',
              }}
            >
              {/* Vine wordmark */}
              <div style={{ marginBottom: '16px' }}>
                <h1
                  style={{
                    fontSize: '52px',
                    fontWeight: 800,
                    color: '#8B1A2F',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    margin: '0 0 10px 0',
                  }}
                >
                  Vine
                </h1>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#6B6B6B',
                    margin: 0,
                    letterSpacing: '0.01em',
                  }}
                >
                  Welcome to the Love Inc Discipleship Academy
                </p>
              </div>

              {/* Divider */}
              <div
                style={{
                  width: '32px',
                  height: '2px',
                  backgroundColor: '#8B1A2F',
                  borderRadius: '2px',
                  margin: '20px 0',
                }}
              />

              {/* Tagline + scripture */}
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#8B1A2F',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  margin: '0 0 14px 0',
                }}
              >
                Rooted in community.
              </p>

              <blockquote style={{ margin: 0, padding: 0 }}>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#6B6B6B',
                    fontStyle: 'italic',
                    lineHeight: 1.65,
                    margin: '0 0 8px 0',
                  }}
                >
                  "I am the vine, you are the branches. Whoever abides in me bears much fruit."
                </p>
                <cite
                  style={{
                    fontSize: '11px',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    color: '#AEAEAE',
                    letterSpacing: '0.06em',
                  }}
                >
                  — JOHN 15:5
                </cite>
              </blockquote>
            </div>

            {/* ── Sign in form ── */}
            <div style={{ width: '100%', maxWidth: '360px' }}>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#0A0A0B',
                  letterSpacing: '-0.02em',
                  margin: '0 0 4px 0',
                }}
              >
                Sign in
              </h2>
              <p style={{ fontSize: '13px', color: '#9C949A', margin: '0 0 24px 0' }}>
                Pick up where the journey left off.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ marginBottom: '16px' }}>
                  <label
                    htmlFor="email"
                    style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0A0A0B', marginBottom: '6px' }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={focusInput}
                    onBlur={blurInput}
                    className="auth-input"
                    placeholder="you@university.edu.gh"
                    style={{
                      width: '100%',
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid #E5E5E5',
                      padding: '0 12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#FFFFFF',
                      fontSize: '14px',
                      color: '#0A0A0B',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '4px' }}>
                  <label
                    htmlFor="password"
                    style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#0A0A0B', marginBottom: '6px' }}
                  >
                    Password
                  </label>
                  <PasswordInput
                    id="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>

                <button
                  type="submit"
                  className="auth-btn"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  style={{
                    width: '100%',
                    height: '40px',
                    marginTop: '20px',
                    backgroundColor: '#8B1A2F',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.75 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {isLoading ? (
                    <><Spinner />Signing in…</>
                  ) : (
                    <>
                      Sign in
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <p style={{ fontSize: '13px', color: '#9C949A', textAlign: 'center', marginTop: '20px' }}>
                Don&apos;t have an account?{' '}
                <Link href="/register" style={{ color: '#8B1A2F', fontWeight: 600, textDecoration: 'underline' }}>
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}