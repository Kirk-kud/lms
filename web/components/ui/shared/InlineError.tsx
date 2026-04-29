import React from 'react'

export function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border border-[#F5C2C7] bg-[#FEE2E2] text-[#991B1B] rounded-lg px-4 py-3 text-[13px] flex items-center justify-between gap-3">
      <span>{message}</span>
      <button
        onClick={onRetry}
        className="h-8 px-3 text-[12px] border border-[#FCA5A5] rounded-md bg-white hover:bg-[#FFF5F5] transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
