'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  autoComplete?: string
  placeholder?: string
  required?: boolean
  style?: React.CSSProperties
}

export function PasswordInput({
  id,
  value,
  onChange,
  onFocus,
  onBlur,
  autoComplete = 'current-password',
  placeholder = '',
  required = false,
  style = {},
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '36px',
    borderRadius: '8px',
    border: '0.5px solid #E5E5E5',
    fontSize: '13px',
    padding: '0 10px 0 10px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF',
    ...style,
  }

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  }

  const toggleButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6B6B6B',
    transition: 'color 200ms ease',
  }

  return (
    <div style={containerStyle}>
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        style={baseStyle}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        style={toggleButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#333333'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#6B6B6B'
        }}
      >
        {showPassword ? (
          <EyeOff size={18} strokeWidth={1.5} />
        ) : (
          <Eye size={18} strokeWidth={1.5} />
        )}
      </button>
    </div>
  )
}
