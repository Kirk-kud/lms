'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient, ApiError } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'

interface RegisterResponse {
  user: {
    id: string
    email: string
    full_name: string
    role: 'tutor' | 'student'
  }
}

interface LoginResponse {
  access_token: string
  user: {
    id: string
    email: string
    full_name: string
    role: 'tutor' | 'student'
  }
}

const TutorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
    <path d="M9 10l2 2 4-4" />
  </svg>
)

const StudentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
    <path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
)

export default function RegisterPageClient() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'tutor' | 'student'>('student')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await apiClient.post<RegisterResponse>('/auth/register', {
        full_name: fullName,
        email,
        password,
        role,
      })

      const loginData = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      })

      const supabase = createClient()
      await supabase.auth.setSession({
        access_token: loginData.access_token,
        refresh_token: '',
      })

      router.push(role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard')
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '36px',
    borderRadius: '8px',
    border: '0.5px solid #E5E5E5',
    fontSize: '13px',
    padding: '0 10px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    color: '#6B6B6B',
    marginBottom: '4px',
  }

  return (
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

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: '14px' }}>
          <label htmlFor="fullName" style={labelStyle}>
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label htmlFor="email" style={labelStyle}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="password" style={labelStyle}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
          />
        </div>

        <div style={{ marginBottom: '4px' }}>
          <p style={{ ...labelStyle, marginBottom: '8px' }}>I am a</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['tutor', 'student'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  width: '120px',
                  padding: '12px 0',
                  borderRadius: '8px',
                  border: role === r ? '1.5px solid #8B1A2F' : '0.5px solid #E5E5E5',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'border-color 0.15s',
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
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            height: '36px',
            marginTop: '20px',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>

        {error && (
          <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '10px', textAlign: 'center' }}>
            {error}
          </p>
        )}
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
  )
}
