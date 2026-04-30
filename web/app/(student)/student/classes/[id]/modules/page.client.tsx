'use client'

import { use, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/hooks/useUser'
import { useModules, ModuleItem } from '@/lib/hooks/useModules'
import { useClass } from '@/lib/hooks/useClasses'
import ModuleCard from '@/components/ui/tutor/ModuleCard'
import { StatusBadge } from '@/components/ui/shared/Badge'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { InlineError } from '@/components/ui/shared/InlineError'
import { ApiError } from '@/lib/api'
import { toast } from 'sonner'

function getStorageKey(userId: string) {
  return `viewed_items_${userId}`
}

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
  const [viewedItems, setViewedItems] = useState<Set<string>>(new Set())

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

  useEffect(() => {
    if (!user?.id) return
    const stored = localStorage.getItem(getStorageKey(user.id))
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as string[]
      setViewedItems(new Set(parsed))
    } catch {
      setViewedItems(new Set())
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    localStorage.setItem(getStorageKey(user.id), JSON.stringify(Array.from(viewedItems)))
  }, [user?.id, viewedItems])

  const completedItemsByModule = useMemo(() => {
    const map = new Map<string, string[]>()
    modules.forEach((module) => {
      map.set(
        module.id,
        module.items.filter((item) => viewedItems.has(item.id)).map((item) => item.id)
      )
    })
    return map
  }, [modules, viewedItems])

  const handleItemClick = (item: ModuleItem) => {
    if (user?.id) {
      setViewedItems((prev) => {
        const next = new Set(prev)
        next.add(item.id)
        return next
      })
    }

    if (item.content_url) {
      window.open(item.content_url, '_blank')
    }
  }

  return (
    <div className="p-8 max-w-3xl">
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

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-medium text-[#111]">Modules</h1>
      </div>

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
          description="Your tutor will add modules soon"
        />
      )}

      {!(isClassLoading || isModulesLoading) && modules.length > 0 && (
        <div className="space-y-4">
          {modules.map((module) => {
            const completedItems = completedItemsByModule.get(module.id) ?? []
            const isComplete = module.items.length > 0 && completedItems.length === module.items.length

            return (
              <div key={module.id} className="relative">
                {isComplete && (
                  <div className="absolute right-4 top-4">
                    <StatusBadge variant="success" label="Complete" />
                  </div>
                )}
                <ModuleCard
                  title={module.title}
                  items={module.items}
                  mode="student"
                  completedItems={completedItems}
                  onItemClick={handleItemClick}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
