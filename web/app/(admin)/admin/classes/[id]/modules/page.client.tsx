'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  useModules,
  useCreateModule,
  useUpdateModule,
  useUpdateModuleItem,
  useDeleteModule,
  useDeleteModuleItem,
  useAddModuleItem,
  useReorderItems,
  CourseModule,
  ModuleItem,
} from '@/lib/hooks/useModules'
import { useAssignments } from '@/lib/hooks/useAssignments'
import { useClass } from '@/lib/hooks/useClasses'
import ModuleCard from '@/components/ui/tutor/ModuleCard'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { InlineError } from '@/components/ui/shared/InlineError'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ItemPreviewModal from '@/components/ui/shared/ItemPreviewModal'
import type { PreviewItem } from '@/components/ui/shared/ItemPreviewModal'

const ITEM_TYPES = ['pdf', 'image', 'video', 'link', 'text', 'assignment'] as const
type ItemType = (typeof ITEM_TYPES)[number]

const ITEM_TYPE_BUTTON_LABEL: Record<ItemType, string> = {
  pdf: 'PDF',
  image: 'Image',
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
    if (!classId) { toast.error('Class not loaded — please refresh'); return }
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
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
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
    if ((type === 'pdf' || type === 'image') && file) formData.append('file', file)
    if ((type === 'video' || type === 'link') && url) formData.append('content_url', url)
    if (type === 'text' && text) formData.append('content_text', text)
    formData.append('order_index', '0')
    try {
      await addItem.mutateAsync({ moduleId, classId, formData })
      setTitle('')
      setUrl('')
      setText('')
      setFile(null)
      setAssignmentId('')
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
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t)
                    setFile(null)
                    setAssignmentId('')
                  }}
                  className={`h-8 px-3 text-[12px] rounded-lg border transition-colors ${
                    type === t
                      ? 'border-[#8B1A2F] text-[#8B1A2F] bg-[#F5E6EA]'
                      : 'border-[#E5E5E5] text-[#6B7280] hover:bg-[#F8F8F8]'
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
          {type === 'image' && (
            <div>
              <label className="block text-[12px] text-[#6B6B6B] mb-1">Image file</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-[13px] text-[#6B7280]"
              />
              {file && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="mt-2 w-full max-h-40 object-contain rounded-lg border border-[#E5E5E5]"
                />
              )}
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

function RenameModuleModal({
  module: mod,
  classId,
  open,
  onClose,
}: {
  module: CourseModule
  classId: string
  open: boolean
  onClose: () => void
}) {
  const [title, setTitle] = useState(mod.title)
  const updateModule = useUpdateModule()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || title.trim() === mod.title) { onClose(); return }
    try {
      await updateModule.mutateAsync({ moduleId: mod.id, classId, title: title.trim() })
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to rename module')
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
          <DialogTitle className="text-[15px] font-medium">Rename module</DialogTitle>
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
            <button type="submit" disabled={updateModule.isPending || !title.trim()} className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg disabled:opacity-50 hover:bg-black/90 transition-colors flex items-center gap-2">
              {updateModule.isPending && <LoadingSpinner className="text-white" />}
              {updateModule.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditItemModal({
  item,
  classId,
  open,
  onClose,
}: {
  item: ModuleItem
  classId: string
  open: boolean
  onClose: () => void
}) {
  const [title, setTitle] = useState(item.title)
  const [url, setUrl] = useState(item.content_url ?? '')
  const [text, setText] = useState(item.content_text ?? '')
  const [assignmentId, setAssignmentId] = useState(item.assignment_id ?? '')
  const { data: classAssignments = [] } = useAssignments(classId)
  const updateItem = useUpdateModuleItem()

  const sortedAssignments = [...classAssignments].sort((a, b) =>
    a.week_number !== b.week_number
      ? a.week_number - b.week_number
      : a.title.localeCompare(b.title),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (item.type === 'assignment') {
      if (!assignmentId) {
        toast.error('Choose an assignment')
        return
      }
      try {
        await updateItem.mutateAsync({
          itemId: item.id,
          classId,
          title: title.trim(),
          assignment_id: assignmentId,
        })
        onClose()
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Unable to update item')
      }
      return
    }
    const body: {
      itemId: string
      classId: string
      title?: string
      content_url?: string
      content_text?: string
    } = {
      itemId: item.id,
      classId,
      title: title.trim(),
    }
    if (item.type === 'video' || item.type === 'link') body.content_url = url
    if (item.type === 'text') body.content_text = text
    try {
      await updateItem.mutateAsync(body)
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to update item')
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
          <DialogTitle className="text-[15px] font-medium">Edit item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">Title</label>
            <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')} />
          </div>
          {(item.type === 'video' || item.type === 'link') && (
            <div>
              <label className="block text-[12px] text-[#6B6B6B] mb-1">URL</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} style={inputStyle} placeholder="https://"
                onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')} />
            </div>
          )}
          {item.type === 'text' && (
            <div>
              <label className="block text-[12px] text-[#6B6B6B] mb-1">Content</label>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
                style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'none' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')} />
            </div>
          )}
          {item.type === 'assignment' && (
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
            </div>
          )}
          {item.type === 'pdf' && (
            <p className="text-[12px] text-[#9CA3AF]">To replace the PDF file, delete this item and add a new one.</p>
          )}
          {item.type === 'image' && (
            <p className="text-[12px] text-[#9CA3AF]">To replace the image, delete this item and add a new one.</p>
          )}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="h-9 px-4 text-[13px] text-[#6B7280] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors">Cancel</button>
            <button type="submit" disabled={updateItem.isPending || !title.trim()} className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg disabled:opacity-50 hover:bg-black/90 transition-colors flex items-center gap-2">
              {updateItem.isPending && <LoadingSpinner className="text-white" />}
              {updateItem.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ModulesPageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params)
  const router = useRouter()
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
  const deleteModule = useDeleteModule()
  const deleteItem = useDeleteModuleItem()
  const reorderItems = useReorderItems()

  const [showCreateModule, setShowCreateModule] = useState(false)
  const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null)
  const [renamingModule, setRenamingModule] = useState<CourseModule | null>(null)
  const [editingItem, setEditingItem] = useState<ModuleItem | null>(null)

  const toastIdRef = useRef<string | number | null>(null)
  const didSuccessRef = useRef(false)

  useEffect(() => {
    router.prefetch(`/admin/classes/${classId}/assignments`)
    router.prefetch(`/admin/classes/${classId}/attendance`)
    router.prefetch(`/admin/classes/${classId}/roster`)
  }, [classId, router])

  useEffect(() => {
    const isLoading = isClassLoading || isModulesLoading
    if (isLoading) {
      if (!toastIdRef.current) {
        toastIdRef.current = toast.loading('Loading modules...')
      }
    } else if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
      if (!didSuccessRef.current) {
        didSuccessRef.current = true
        toast.success('Modules loaded')
      }
    }
  }, [isClassLoading, isModulesLoading])
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)

  const handleAddItem = (moduleId: string) => {
    setActiveModuleId(moduleId)
    setShowAddItem(true)
  }

  const handleItemClick = (item: ModuleItem) => {
    if (item.type === 'assignment') {
      if (item.assignment_id) {
        router.push(`/admin/classes/${classId}/assignments`)
      }
      return
    }
    if (item.type === 'link' && item.content_url) {
      window.open(item.content_url, '_blank', 'noopener,noreferrer')
      return
    }
    setPreviewItem({
      title: item.title,
      type: item.type as PreviewItem['type'],
      content_url: item.content_url,
      content_text: item.content_text,
    })
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
    <div className="p-4 sm:p-8">
      <nav className="flex items-center gap-2 text-[12px] text-[#9CA3AF] mb-6">
        <button
          onClick={() => router.push('/admin/classes')}
          onMouseEnter={() => router.prefetch('/admin/classes')}
          className="hover:text-[#111] transition-colors"
        >
          Classes
        </button>
        <span>/</span>
        <button
          onClick={() => router.push(`/admin/classes/${classId}/modules`)}
          onMouseEnter={() => router.prefetch(`/admin/classes/${classId}/modules`)}
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
        <button
          onClick={() => setShowCreateModule(true)}
          className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
        >
          + New module
        </button>
      </div>

      {isClassError || isModulesError ? (
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
      ) : null}

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
          description="Organize your course content into modules"
          actionLabel="Create module"
          onAction={() => setShowCreateModule(true)}
        />
      )}

      {!(isClassLoading || isModulesLoading) && modules.length > 0 && (
        <div className="space-y-4">
          {modules
            .sort((a, b) => a.order_index - b.order_index)
            .map((mod) => (
              <ModuleCard
                key={mod.id}
                title={mod.title}
                items={mod.items}
                mode="admin"
                onAddItem={() => handleAddItem(mod.id)}
                onDeleteItem={handleDeleteItem}
                onEditItem={(item) => setEditingItem(item)}
                onRenameModule={() => setRenamingModule(mod)}
                onDeleteModule={() => handleDeleteModule(mod.id)}
                onItemClick={handleItemClick}
                onReorderItems={(newOrder) =>
                  reorderItems.mutate({ moduleId: mod.id, classId, items: newOrder })
                }
              />
            ))}
        </div>
      )}

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

      {renamingModule && (
        <RenameModuleModal
          module={renamingModule}
          classId={classId}
          open={renamingModule !== null}
          onClose={() => setRenamingModule(null)}
        />
      )}

      {editingItem && (
        <EditItemModal
          item={editingItem}
          classId={classId}
          open={editingItem !== null}
          onClose={() => setEditingItem(null)}
        />
      )}

      <ItemPreviewModal
        item={previewItem}
        open={previewItem !== null}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  )
}
