'use client'

import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/ui/shared/PasswordInput'
import { PhotoCarousel } from '@/components/ui/shared/PhotoCarousel'
import globalBlack from '@/public/global_black.png'
import globalWhite from '@/public/global_white.png'

interface LoginResponse {
  access_token: string
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

const focusInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#8B1A2F'
  e.currentTarget.style.borderWidth = '1px'
}

const blurInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#E5E5E5'
  e.currentTarget.style.borderWidth = '0.5px'
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

      const { access_token, user } = json.data
      localStorage.setItem('access_token', access_token)

      const supabase = createClient()
      await supabase.auth.signInWithPassword({ email, password })

      toast.success(`Welcome back${user.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!`, {
        description: 'You have been signed in successfully.',
      })
      router.push(user.role === 'admin' ? '/admin/dashboard' : user.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard')
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
        .auth-submit-btn { transition: background-color 200ms cubic-bezier(0.16, 1, 0.3, 1); }
        .auth-submit-btn:hover:not(:disabled) { background-color: #8B1A2F !important; }
        .auth-submit-btn:focus-visible { outline: 2px solid #8B1A2F; outline-offset: 2px; }
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
            position: 'relative',
          }}
        >
          {/* Desktop logo in top-left */}
          <div style={{ position: 'absolute', top: '24px', left: '48px', zIndex: 10 }} className="hidden md:block">
            <Image
              src={globalWhite}
              alt="Love Inc"
              style={{ width: 'auto', height: '32px' }}
            />
          </div>

          <div style={{ width: '100%', maxWidth: '360px' }}>
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
              Good to have you back.
            </h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '32px' }}>
              Sign in to your Love Inc account.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: '14px' }}>
                <label
                  htmlFor="email"
                  className="text-label"
                  style={{ display: 'block', color: '#6B6B6B', marginBottom: '4px' }}
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
                  className="text-body-sm"
                  style={{
                    width: '100%',
                    height: '36px',
                    borderRadius: '8px',
                    border: '0.5px solid #E5E5E5',
                    padding: '0 10px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              </div>

              <div style={{ marginBottom: '4px' }}>
                <label
                  htmlFor="password"
                  className="text-label"
                  style={{ display: 'block', color: '#6B6B6B', marginBottom: '4px' }}
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
                className="auth-submit-btn text-label"
                disabled={isLoading}
                aria-busy={isLoading}
                style={{
                  width: '100%',
                  height: '36px',
                  marginTop: '16px',
                  backgroundColor: '#111111',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.75 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isLoading ? <><Spinner />Signing in…</> : 'Sign in'}
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
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{ color: '#8B1A2F', textDecoration: 'underline' }}>
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
