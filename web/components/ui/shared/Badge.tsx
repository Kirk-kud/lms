import React from 'react';

interface StatusBadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'wine';
  label: string;
}

const variantStyles: Record<string, { bg: string; text: string }> = {
  success: { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]' },
  warning: { bg: 'bg-[#FEF9C3]', text: 'text-[#854D0E]' },
  danger: { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' },
  info: { bg: 'bg-[#DBEAFE]', text: 'text-[#1E40AF]' },
  gray: { bg: 'bg-[#F3F4F6]', text: 'text-[#4B5563]' },
  wine: { bg: 'bg-[#F5E6EA]', text: 'text-[#6B1222]' },
};

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  const styles = variantStyles[variant];
  return (
    <span
      className={`${styles.bg} ${styles.text} inline-block rounded-full px-[10px] py-[2px] text-[11px] font-medium`}
    >
      {label}
    </span>
  );
}

