'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPageClient() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) throw authError

      const role = data.user.user_metadata?.role
      router.push(role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
          <label
            htmlFor="email"
            style={{ display: 'block', fontSize: '12px', color: '#6B6B6B', marginBottom: '4px' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              height: '36px',
              borderRadius: '8px',
              border: '0.5px solid #E5E5E5',
              fontSize: '13px',
              padding: '0 10px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
          />
        </div>

        <div style={{ marginBottom: '4px' }}>
          <label
            htmlFor="password"
            style={{ display: 'block', fontSize: '12px', color: '#6B6B6B', marginBottom: '4px' }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              height: '36px',
              borderRadius: '8px',
              border: '0.5px solid #E5E5E5',
              fontSize: '13px',
              padding: '0 10px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            height: '36px',
            marginTop: '16px',
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
          {isLoading ? 'Signing in...' : 'Sign in'}
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
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: '#8B1A2F', textDecoration: 'underline' }}>
          Register
        </Link>
      </p>
    </div>
  )
}