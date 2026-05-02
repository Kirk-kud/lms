'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { apiClient, ApiError } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/ui/shared/PasswordInput'
import { PhotoCarousel } from '@/components/ui/shared/PhotoCarousel'
import globalBlack from '@/public/global_black.png'

const Spinner = () => (
  <svg
    className="auth-spinner"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
    style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}
  >
    <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
    <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <style>{`
      @keyframes auth-spin { to { transform: rotate(360deg); } }
      .auth-spinner { animation: auth-spin 0.7s linear infinite; }
      @media (prefers-reduced-motion: reduce) { .auth-spinner { animation: none !important; opacity: 0.6; } }
    `}</style>
  </svg>
)

interface RegisterResponse {
  user: {
    id: string
    email: string
    full_name: string
    role: 'admin' | 'tutor' | 'student'
  }
}

const TutorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
    <path d="M9 10l2 2 4-4" />
  </svg>
)

const StudentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
    <path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
)

const focusInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#8B1A2F'
  e.currentTarget.style.borderWidth = '1px'
}

const blurInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#E5E5E5'
  e.currentTarget.style.borderWidth = '0.5px'
}

export default function RegisterPageClient() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'tutor' | 'student'>('student')
  const [taCode, setTaCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // For tutor (TA) registration, validate the invite code first
      if (role === 'tutor') {
        if (!taCode.trim()) {
          toast.error('Invite code required', { description: 'Enter your tutor invite code to continue.' })
          setIsLoading(false)
          return
        }
        const redeemRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ta-invites/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: taCode.trim().toUpperCase() }),
        })
        const redeemJson = (await redeemRes.json()) as { data?: { valid: boolean } }
        if (!redeemRes.ok || !redeemJson.data?.valid) {
          toast.error('Invalid invite code', { description: 'This code is invalid or has already been used.' })
          setIsLoading(false)
          return
        }
      }

      await apiClient.post<RegisterResponse>('/auth/register', {
        full_name: fullName,
        email,
        password,
        role,
      })

      const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const loginJson = (await loginRes.json()) as { data: { access_token: string } }
      if (loginRes.ok) {
        localStorage.setItem('access_token', loginJson.data.access_token)
      }

      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      const userRole = data.user.user_metadata?.role
      toast.success(`Welcome to Love Inc, ${fullName.split(' ')[0]}!`, {
        description: 'Your account has been created successfully.',
      })
      if (userRole === 'admin') router.push('/admin/dashboard')
      else if (userRole === 'tutor') router.push('/tutor/dashboard')
      else router.push('/student/dashboard')
    } catch (err) {
      toast.error('Registration failed', {
        description: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '36px',
    borderRadius: '8px',
    border: '0.5px solid #E5E5E5',
    padding: '0 10px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#6B6B6B',
    marginBottom: '4px',
  }

  return (
    <>
      <style>{`
        .auth-submit-btn { transition: background-color 200ms cubic-bezier(0.16, 1, 0.3, 1); }
        .auth-submit-btn:hover:not(:disabled) { background-color: #8B1A2F !important; }
        .auth-submit-btn:focus-visible { outline: 2px solid #8B1A2F; outline-offset: 2px; }
        .auth-role-btn:focus-visible { outline: 2px solid #8B1A2F; outline-offset: 2px; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh' }}>
        <PhotoCarousel />

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 48px',
            backgroundColor: '#FFFFFF',
            overflowY: 'auto',
          }}
        >
          <div style={{ width: '100%', maxWidth: '360px', paddingTop: '32px', paddingBottom: '32px' }}>
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
              Join Love Inc.
            </h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '32px' }}>
              Create your account to get started.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: '14px' }}>
                <label htmlFor="fullName" className="text-label" style={labelStyle}>
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  className="text-body-sm"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label htmlFor="email" className="text-label" style={labelStyle}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  className="text-body-sm"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="password" className="text-label" style={labelStyle}>
                  Password
                </label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ ...labelStyle, marginBottom: '8px' }}>I am a</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['student', 'tutor'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="auth-role-btn"
                      onClick={() => setRole(r)}
                      aria-pressed={role === r}
                      style={{
                        flex: 1,
                        padding: '12px 0',
                        borderRadius: '8px',
                        border: `1px solid ${role === r ? '#8B1A2F' : '#E5E5E5'}`,
                        backgroundColor: role === r ? '#F5E6EA' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'border-color 150ms ease-out, background-color 150ms ease-out',
                      }}
                    >
                      <span style={{ color: role === r ? '#8B1A2F' : '#9CA3AF' }}>
                        {r === 'tutor' ? <TutorIcon /> : <StudentIcon />}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: role === r ? '#8B1A2F' : '#6B7280',
                        }}
                      >
                        {r === 'tutor' ? 'Tutor' : 'Student'}
                      </span>
                    </button>
                  ))}
                </div>

                {role === 'tutor' && (
                  <div style={{ marginTop: '12px' }}>
                    <label htmlFor="taCode" className="text-label" style={labelStyle}>
                      Tutor invite code
                    </label>
                    <input
                      id="taCode"
                      type="text"
                      autoComplete="off"
                      placeholder="e.g. ABCD1234"
                      value={taCode}
                      onChange={(e) => setTaCode(e.target.value.toUpperCase())}
                      onFocus={focusInput}
                      onBlur={blurInput}
                      className="text-body-sm"
                      style={{ ...inputStyle, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                    />
                    <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                      Get this code from the admin (Sir PY).
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading}
                aria-busy={isLoading}
                style={{
                  width: '100%',
                  height: '36px',
                  backgroundColor: '#111111',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isLoading ? <><Spinner />Creating account…</> : 'Create account'}
              </button>
            </form>

            <p
              style={{
                fontSize: '12px',
                color: '#6B6B6B',
                textAlign: 'center',
                marginTop: '20px',
              }}
            >
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#8B1A2F', textDecoration: 'underline' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
