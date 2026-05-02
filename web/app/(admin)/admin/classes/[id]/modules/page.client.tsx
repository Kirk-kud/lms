'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  useModules,
  useCreateModule,
  useDeleteModule,
  useDeleteModuleItem,
  useAddModuleItem,
  ModuleItem,
} from '@/lib/hooks/useModules'
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

const ITEM_TYPES = ['pdf', 'video', 'link', 'text'] as const
type ItemType = (typeof ITEM_TYPES)[number]

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
  const addItem = useAddModuleItem()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('title', title.trim())
    formData.append('type', type)
    if (type === 'pdf' && file) formData.append('file', file)
    if ((type === 'video' || type === 'link') && url) formData.append('content_url', url)
    if (type === 'text' && text) formData.append('content_text', text)
    formData.append('order_index', '0')
    try {
      await addItem.mutateAsync({ moduleId, classId, formData })
      setTitle('')
      setUrl('')
      setText('')
      setFile(null)
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to add item')
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
                  onClick={() => setType(t)}
                  className={`h-8 px-3 text-[12px] rounded-lg border transition-colors ${
                    type === t
                      ? 'border-[#8B1A2F] text-[#8B1A2F] bg-[#F5E6EA]'
                      : 'border-[#E5E5E5] text-[#6B7280] hover:bg-[#F8F8F8]'
                  }`}
                >
                  {t.toUpperCase()}
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

  const [showCreateModule, setShowCreateModule] = useState(false)
  const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null)

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
    <div className="p-8 max-w-3xl">
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
                onDeleteModule={() => handleDeleteModule(mod.id)}
                onItemClick={handleItemClick}
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

      <ItemPreviewModal
        item={previewItem}
        open={previewItem !== null}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  )
}
