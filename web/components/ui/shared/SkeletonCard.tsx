interface SkeletonCardProps {
  lines?: number
}

export function SkeletonCard({ lines = 2 }: SkeletonCardProps) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-xl p-5">
      {/* Title bar */}
      <div className="w-2/5 h-3.5 rounded bg-[#F3F4F6] animate-pulse" />

      {/* Body bars */}
      <div className="w-full h-2.5 rounded bg-[#F3F4F6] animate-pulse mt-3" />
      {Array.from({ length: lines - 1 }).map((_, index) => (
        <div
          key={index}
          className="w-3/4 h-2.5 rounded bg-[#F3F4F6] animate-pulse mt-1.5"
        />
      ))}

      {/* Footer bar */}
      <div className="w-1/2 h-2.5 rounded bg-[#F3F4F6] animate-pulse mt-4" />
    </div>
  )
}