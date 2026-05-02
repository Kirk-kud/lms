'use client'

import { useUser } from '@/lib/hooks/useUser'
import { useClasses } from '@/lib/hooks/useClasses'
import { useModules } from '@/lib/hooks/useModules'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'

const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  video: 'Video',
  link: 'Link',
  text: 'Text',
}

export default function TutorModulesClient() {
  const { user } = useUser()
  const { data: classes = [], isLoading: classesLoading } = useClasses(user?.id)
  const cls = classes[0] as (typeof classes[0] & { cohort_id?: string; cohort_name?: string }) | undefined
  const classId = cls?.id ?? ''
  const cohortName = (cls as { cohort_name?: string } | undefined)?.cohort_name ?? 'My Cohort'

  const { data: modules = [], isLoading: modulesLoading } = useModules(classId)

  const isLoading = classesLoading || modulesLoading

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF] mb-1">{cohortName}</p>
        <h1 className="text-[28px] font-semibold text-[#111111]">Modules</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">Class-wide content visible to all cohorts</p>
      </div>

      {isLoading ? (
        <SkeletonCard lines={4} />
      ) : modules.length === 0 ? (
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>}
          title="No modules yet"
          description="The admin hasn't uploaded any modules yet. Check back soon."
        />
      ) : (
        <div className="space-y-4">
          {modules.map((mod) => (
            <div key={mod.id} className="border border-[#E5E5E5] rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-[#F8F8F8] border-b border-[#E5E5E5]">
                <p className="text-[14px] font-medium text-[#111]">{mod.title}</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">{mod.items?.length ?? 0} item{mod.items?.length !== 1 ? 's' : ''}</p>
              </div>
              {mod.items && mod.items.length > 0 ? (
                mod.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6] last:border-0">
                    <div className="min-w-0">
                      <p className="text-[13px] text-[#111] truncate">{item.title}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{TYPE_LABELS[item.type] ?? item.type}</p>
                    </div>
                    {item.content_url && (
                      <a
                        href={item.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-[#8B1A2F] font-medium hover:underline shrink-0 ml-4"
                      >
                        Open
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="px-4 py-3 text-[12px] text-[#9CA3AF]">No items in this module.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
