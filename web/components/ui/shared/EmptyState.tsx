import * as React from "react"

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#F8F8F8] p-3 mb-4">
        <div className="w-10 h-10 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-[#111]">{title}</h3>
      <p className="text-[13px] text-[#6B7280] mt-1">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 h-9 px-4 bg-black text-white text-[13px] rounded-lg hover:bg-black/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
