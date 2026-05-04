import React from 'react';

interface StatusBadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'wine';
  label: string;
}

const variantStyles: Record<string, { bg: string; text: string; dot: string }> = {
  success: { bg: '#E7F4ED', text: '#1F8B4C', dot: '#1F8B4C' },
  warning: { bg: '#FAF1E1', text: '#B6791D', dot: '#B6791D' },
  danger:  { bg: '#FBEAEC', text: '#B0182E', dot: '#B0182E' },
  info:    { bg: '#EBF4FF', text: '#1E40AF', dot: '#3B82F6' },
  gray:    { bg: '#F4EEE8', text: '#6B6168', dot: '#9C949A' },
  wine:    { bg: '#FBEDF0', text: '#6B1222', dot: '#8B1A2F' },
};

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  const s = variantStyles[variant];
  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.text,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '999px',
        padding: '3px 9px',
        fontSize: '11.5px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: s.dot,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
