'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTutorClass } from '@/lib/contexts/TutorClassContext'
import { useCohort } from '@/lib/hooks/useCohorts'
import {
  useModules,
  useCreateModule,
  useDeleteModule,
  useDeleteModuleItem,
  useAddModuleItem,
  ModuleItem,
} from '@/lib/hooks/useModules'
import { useAssignments } from '@/lib/hooks/useAssignments'
import ModuleCard from '@/components/ui/tutor/ModuleCard'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'
import { ApiError } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ItemPreviewModal from '@/components/ui/shared/ItemPreviewModal'
import type { PreviewItem } from '@/components/ui/shared/ItemPreviewModal'

const ITEM_TYPES = ['pdf', 'video', 'link', 'text', 'assignment'] as const
type ItemType = (typeof ITEM_TYPES)[number]

const ITEM_TYPE_BUTTON_LABEL: Record<ItemType, string> = {
  pdf: 'PDF',
  video: 'Video',
  link: 'Link',
  text: 'Text',
  assignment: 'Assignment',
}

function CreateModuleModal({
  classId,
  open,
  onClose,
  nextIndex,
}: {
  classId: string
  open: boolean
  onClose: () => void
  nextIndex: number
}) {
  const [title, setTitle] = useState('')
  const createModule = useCreateModule()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await createModule.mutateAsync({ class_id: classId, title: title.trim(), order_index: nextIndex })
      setTitle('')
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to create module')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '36px', borderRadius: '8px',
    border: '0.5px solid #E5E5E5', fontSize: '13px',
    padding: '0 10px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium">New module</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">Module title</label>
            <input
              autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="h-9 px-4 text-[13px] text-[#6B7280] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors">Cancel</button>
            <button type="submit" disabled={createModule.isPending || !title.trim()} className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg disabled:opacity-50 hover:bg-black/90 transition-colors flex items-center gap-2">
              {createModule.isPending && <LoadingSpinner className="text-white" />}
              {createModule.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddItemModal({
  moduleId,
  classId,
  open,
  onClose,
}: {
  moduleId: string
  classId: string
  open: boolean
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ItemType>('pdf')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [assignmentId, setAssignmentId] = useState('')
  const { data: classAssignments = [] } = useAssignments(classId)
  const addItem = useAddModuleItem()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('type', type)
    if (type === 'assignment') {
      if (!assignmentId) {
        toast.error('Choose an assignment to link')
        return
      }
      formData.append('assignment_id', assignmentId)
    }
    if (type === 'pdf' && file) formData.append('file', file)
    if ((type === 'video' || type === 'link') && url) formData.append('content_url', url)
    if (type === 'text' && text) formData.append('content_text', text)
    formData.append('order_index', '0')
    try {
      await addItem.mutateAsync({ moduleId, classId, formData })
      setTitle(''); setUrl(''); setText(''); setFile(null); setAssignmentId('')
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to add item')
    }
  }

  const sortedAssignments = [...classAssignments].sort((a, b) =>
    a.week_number !== b.week_number
      ? a.week_number - b.week_number
      : a.title.localeCompare(b.title),
  )

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '36px', borderRadius: '8px',
    border: '0.5px solid #E5E5E5', fontSize: '13px',
    padding: '0 10px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium">Add item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">Title</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')} />
          </div>
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-2">Type</label>
            <div className="flex gap-2 flex-wrap">
              {ITEM_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => {
                  setType(t)
                  setAssignmentId('')
                  setFile(null)
                }}
                  className={`h-8 px-3 text-[12px] rounded-lg border transition-colors ${
                    type === t ? 'border-[#8B1A2F] text-[#8B1A2F] bg-[#F5E6EA]' : 'border-[#E5E5E5] text-[#6B7280] hover:bg-[#F8F8F8]'
                  }`}
                >
                  {ITEM_TYPE_BUTTON_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          {type === 'pdf' && (
            <div>
              <label className="block text-[12px] text-[#6B6B6B] mb-1">PDF file</label>
              <input type="file" accept="application/pdf" required onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-[13px] text-[#6B7280]" />
            </div>
          )}
          {(type === 'video' || type === 'link') && (
            <div>
              <label className="block text-[12px] text-[#6B6B6B] mb-1">URL</label>
              <input required value={url} onChange={(e) => setUrl(e.target.value)} style={inputStyle} placeholder="https://"
                onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')} />
            </div>
          )}
          {type === 'text' && (
            <div>
              <label className="block text-[12px] text-[#6B6B6B] mb-1">Content</label>
              <textarea required value={text} onChange={(e) => setText(e.target.value)} rows={4}
                style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'none' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')} />
            </div>
          )}
          {type === 'assignment' && (
            <div>
              <label className="block text-[12px] text-[#6B6B6B] mb-1">Class assignment</label>
              <select
                required
                value={assignmentId}
                onChange={(e) => setAssignmentId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select assignment…</option>
                {sortedAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    Week {a.week_number}: {a.title}
                  </option>
                ))}
              </select>
              {sortedAssignments.length === 0 && (
                <p className="text-[11px] text-[#9CA3AF] mt-1">Create assignments for this class first.</p>
              )}
            </div>
          )}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="h-9 px-4 text-[13px] text-[#6B7280] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors">Cancel</button>
            <button type="submit" disabled={addItem.isPending} className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg disabled:opacity-50 hover:bg-black/90 transition-colors flex items-center gap-2">
              {addItem.isPending && <LoadingSpinner className="text-white" />}
              {addItem.isPending ? 'Uploading...' : 'Add item'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const TYPE_LABELS: Record<string, string> = {
  pdf: 'PDF', video: 'Video', link: 'Link', text: 'Text', assignment: 'Assignment',
}

export default function TutorModulesClient() {
  const router = useRouter()
  const { selectedClass, cohortId } = useTutorClass()
  const classId = selectedClass?.id ?? ''
  const cohortName = selectedClass?.cohort_name ?? 'My Cohort'

  const { data: cohort } = useCohort(cohortId ?? '')
  const canEdit = cohort?.can_edit_modules === true

  const { data: modules = [], isLoading: modulesLoading } = useModules(classId)
  const deleteModule = useDeleteModule()
  const deleteItem = useDeleteModuleItem()

  const [showCreateModule, setShowCreateModule] = useState(false)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null)

  const handleAddItem = (moduleId: string) => {
    setActiveModuleId(moduleId)
    setShowAddItem(true)
  }

  const handleItemClick = (item: ModuleItem) => {
    if (item.type === 'assignment') {
      if (item.assignment_id) {
        router.push('/tutor/assignments')
      }
      return
    }
    if (item.type === 'link' && item.content_url) {
      window.open(item.content_url, '_blank', 'noopener,noreferrer')
      return
    }
    setPreviewItem({ title: item.title, type: item.type, content_url: item.content_url, content_text: item.content_text })
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync({ itemId, classId })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to delete item')
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await deleteModule.mutateAsync({ moduleId, classId })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to delete module')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#9CA3AF] mb-1">{cohortName}</p>
          <h1 className="text-[28px] font-semibold text-[#111111]">Modules</h1>
          <p className="text-[13px] text-[#6B7280] mt-1">
            {canEdit ? 'You can create and manage course content.' : 'Class-wide content visible to all cohorts.'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowCreateModule(true)}
            className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg hover:bg-black/90 transition-colors shrink-0"
          >
            + New module
          </button>
        )}
      </div>

      {modulesLoading ? (
        <SkeletonCard lines={4} />
      ) : modules.length === 0 ? (
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>}
          title="No modules yet"
          description={canEdit ? 'Create your first module to get started.' : "The admin hasn't uploaded any modules yet."}
          actionLabel={canEdit ? 'Create module' : undefined}
          onAction={canEdit ? () => setShowCreateModule(true) : undefined}
        />
      ) : canEdit ? (
        <div className="space-y-4">
          {modules.sort((a, b) => a.order_index - b.order_index).map((mod) => (
            <ModuleCard
              key={mod.id}
              title={mod.title}
              items={mod.items}
              mode="admin"
              onAddItem={() => handleAddItem(mod.id)}
              onDeleteItem={handleDeleteItem}
              onDeleteModule={() => handleDeleteModule(mod.id)}
              onItemClick={handleItemClick}
            />
          ))}
        </div>
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
                    {item.type === 'assignment' && item.assignment_id ? (
                      <button
                        type="button"
                        onClick={() => router.push('/tutor/assignments')}
                        className="text-[12px] text-[#8B1A2F] font-medium hover:underline shrink-0 ml-4"
                      >
                        Assignments
                      </button>
                    ) : item.content_url ? (
                      <a href={item.content_url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#8B1A2F] font-medium hover:underline shrink-0 ml-4">
                        Open
                      </a>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="px-4 py-3 text-[12px] text-[#9CA3AF]">No items in this module.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <>
          <CreateModuleModal
            classId={classId}
            open={showCreateModule}
            onClose={() => setShowCreateModule(false)}
            nextIndex={modules.length}
          />
          {activeModuleId && (
            <AddItemModal
              moduleId={activeModuleId}
              classId={classId}
              open={showAddItem}
              onClose={() => { setShowAddItem(false); setActiveModuleId(null) }}
            />
          )}
        </>
      )}

      <ItemPreviewModal
        item={previewItem}
        open={previewItem !== null}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  )
}
