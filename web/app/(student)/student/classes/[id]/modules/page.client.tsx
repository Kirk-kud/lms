'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { useModules, ModuleItem } from '@/lib/hooks/useModules'
import { useClass } from '@/lib/hooks/useClasses'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { InlineError } from '@/components/ui/shared/InlineError'
import ItemPreviewModal from '@/components/ui/shared/ItemPreviewModal'
import type { PreviewItem } from '@/components/ui/shared/ItemPreviewModal'
import { ApiError } from '@/lib/api'
import { toast } from 'sonner'

// ── Type chip config ──────────────────────────────────────────────────────────

type ItemType = 'pdf' | 'video' | 'link' | 'text'

const TYPE_CONFIG: Record<ItemType, { bg: string; iconColor: string; label: string }> = {
  pdf:   { bg: '#FEE2E2', iconColor: '#991B1B', label: 'PDF document' },
  video: { bg: '#DBEAFE', iconColor: '#1E40AF', label: 'Video' },
  link:  { bg: '#F3F4F6', iconColor: '#4B5563', label: 'External link — opens in new tab' },
  text:  { bg: '#F5E6EA', iconColor: '#8B1A2F', label: 'Reading' },
}

function TypeIcon({ type, color }: { type: ItemType; color: string }) {
  if (type === 'pdf') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
        <line x1="9" y1="11" x2="15" y2="11" />
      </svg>
    )
  }
  if (type === 'video') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    )
  }
  if (type === 'link') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    )
  }
  // text / reading
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

// ── ModuleItem ────────────────────────────────────────────────────────────────

function ModuleItemRow({ item, onClick }: { item: ModuleItem; onClick: (item: ModuleItem) => void }) {
  const type = (item.type ?? 'text') as ItemType
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.text

  return (
    <button
      onClick={() => onClick(item)}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#FAFAFA] transition-colors text-left"
    >
      {/* Type chip */}
      <div
        className="flex items-center justify-center shrink-0 rounded-[6px]"
        style={{ width: 28, height: 28, backgroundColor: config.bg }}
      >
        <TypeIcon type={type} color={config.iconColor} />
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-[#111] truncate">{item.title}</p>
        <p className="text-[11px] text-[#9CA3AF] mt-0.5">{config.label}</p>
      </div>

      {/* Right indicator */}
      {type === 'link' ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  )
}

// ── ModuleSection ─────────────────────────────────────────────────────────────

function ModuleSection({ module, onItemClick }: {
  module: { id: string; title: string; items: ModuleItem[] }
  onItemClick: (item: ModuleItem) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between py-3 border-b border-[#E5E5E5]"
      >
        <div className="flex items-center gap-3">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9CA3AF"
            strokeWidth="2"
            className="shrink-0 transition-transform duration-200"
            style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <h2 className="text-[15px] font-medium text-[#111] text-left">{module.title}</h2>
        </div>
        <span className="text-[11px] text-[#9CA3AF] shrink-0 ml-4">
          {module.items.length} {module.items.length === 1 ? 'item' : 'items'}
        </span>
      </button>

      {!collapsed && (
        <div className="mt-2 space-y-1">
          {module.items.map((item) => (
            <ModuleItemRow key={item.id} item={item} onClick={onItemClick} />
          ))}
          {module.items.length === 0 && (
            <p className="text-[12px] text-[#9CA3AF] px-3 py-3">No items in this module yet.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentModulesPageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params)
  const router = useRouter()
  const { user } = useUser()
  const {
    data: classData,
    isLoading: isClassLoading,
    isError: isClassError,
    error: classError,
    refetch: refetchClass,
  } = useClass(classId)
  const {
    data: modules = [],
    isLoading: isModulesLoading,
    isError: isModulesError,
    error: modulesError,
    refetch: refetchModules,
  } = useModules(classId)
  const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null)

  const loadingToastRef = useRef<string | number | null>(null)
  const didSuccessRef = useRef(false)

  useEffect(() => {
    router.prefetch(`/student/classes/${classId}/assignments`)
    router.prefetch(`/student/classes/${classId}/attendance`)
  }, [classId, router])

  useEffect(() => {
    const isLoading = isClassLoading || isModulesLoading
    if (isLoading) {
      if (!loadingToastRef.current) {
        loadingToastRef.current = toast.loading('Loading modules...')
      }
    } else if (loadingToastRef.current) {
      toast.dismiss(loadingToastRef.current)
      loadingToastRef.current = null
      if (!didSuccessRef.current) {
        didSuccessRef.current = true
        toast.success('Modules loaded')
      }
    }
  }, [isClassLoading, isModulesLoading])

  const handleItemClick = (item: ModuleItem) => {
    if (item.type === 'link' && item.content_url) {
      window.open(item.content_url, '_blank', 'noopener,noreferrer')
      return
    }
    setPreviewItem({
      title: item.title,
      type: item.type,
      content_url: item.content_url,
      content_text: item.content_text,
    })
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-[#9CA3AF] mb-6">
        <button
          onClick={() => router.push('/student/dashboard')}
          onMouseEnter={() => router.prefetch('/student/dashboard')}
          className="hover:text-[#111] transition-colors"
        >
          Dashboard
        </button>
        <span>/</span>
        <button
          onClick={() => router.push(`/student/classes/${classId}/modules`)}
          onMouseEnter={() => router.prefetch(`/student/classes/${classId}/modules`)}
          className="hover:text-[#111] transition-colors"
        >
          {isClassLoading ? (
            <span className="inline-block w-24 h-3 bg-[#E5E5E5] rounded animate-pulse align-middle" />
          ) : (
            classData?.title ?? '...'
          )}
        </button>
        <span>/</span>
        <span className="text-[#111]">Modules</span>
      </nav>

      <h1 className="text-[20px] font-medium text-[#111] mb-6">Modules</h1>

      {(isClassError || isModulesError) && (
        <InlineError
          message={
            (classError || modulesError) instanceof ApiError
              ? (classError || modulesError as ApiError).message
              : 'Unable to load modules'
          }
          onRetry={() => {
            refetchClass()
            refetchModules()
          }}
        />
      )}

      {(isClassLoading || isModulesLoading) && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      )}

      {!(isClassLoading || isModulesLoading) && modules.length === 0 && (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5">
              <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
              <path d="M8 2v16M16 6v16" />
            </svg>
          }
          title="No modules yet"
          description="Your tutor will post content here soon"
        />
      )}

      {!(isClassLoading || isModulesLoading) && modules.length > 0 && (
        <div>
          {modules.map((module) => (
            <ModuleSection key={module.id} module={module} onItemClick={handleItemClick} />
          ))}
        </div>
      )}

      <ItemPreviewModal
        item={previewItem}
        open={previewItem !== null}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  )
}
