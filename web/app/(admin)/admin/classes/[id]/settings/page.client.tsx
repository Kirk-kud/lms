'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClass, useDeleteClass } from '@/lib/hooks/useClasses'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
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

function DeleteClassModal({
  classTitle,
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  classTitle: string
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}) {
  const [typed, setTyped] = useState('')
  const matches = typed.trim() === classTitle.trim()

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '36px', borderRadius: '8px',
    border: '0.5px solid #E5E5E5', fontSize: '13px',
    padding: '0 10px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isPending) { setTyped(''); onClose() } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium text-[#991B1B]">Delete class</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 space-y-1">
            <p className="text-[13px] font-medium text-[#991B1B]">This action cannot be undone.</p>
            <p className="text-[12px] text-[#991B1B]/80">
              All modules, assignments, and attendance records will be permanently deleted.
              Student enrollment history is retained for audit purposes.
            </p>
          </div>
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">
              Type <span className="font-medium text-[#111]">{classTitle}</span> to confirm
            </label>
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#991B1B')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
              placeholder={classTitle}
              disabled={isPending}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => { setTyped(''); onClose() }}
              disabled={isPending}
              className="h-9 px-4 text-[13px] text-[#6B7280] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!matches || isPending}
              className="h-9 px-4 text-[13px] font-medium bg-[#991B1B] text-white rounded-lg disabled:opacity-40 hover:bg-[#7F1D1D] transition-colors flex items-center gap-2"
            >
              {isPending && <LoadingSpinner className="text-white" />}
              {isPending ? 'Deleting...' : 'Delete class'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function SettingsPageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params)
  const router = useRouter()
  const {
    data: classData,
    isLoading,
    isError,
    error,
    refetch,
  } = useClass(classId)
  const deleteClass = useDeleteClass()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteClass.mutateAsync(classId)
      toast.success('Class deleted')
      router.push('/admin/classes')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to delete class')
    }
  }

  return (
    <div className="p-8 max-w-2xl">
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
          {isLoading ? (
            <span className="inline-block w-24 h-3 bg-[#E5E5E5] rounded animate-pulse align-middle" />
          ) : (
            classData?.title ?? '...'
          )}
        </button>
        <span>/</span>
        <span className="text-[#111]">Settings</span>
      </nav>

      <h1 className="text-[20px] font-medium text-[#111] mb-6">Settings</h1>

      {isError && (
        <InlineError
          message={error instanceof ApiError ? error.message : 'Unable to load class'}
          onRetry={refetch}
        />
      )}

      {isLoading && <SkeletonCard lines={3} />}

      {!isLoading && classData && (
        <div className="space-y-6">
          {/* Danger zone */}
          <div className="border border-red-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-red-50 border-b border-red-200">
              <p className="text-[12px] font-medium text-[#991B1B] uppercase tracking-wider">Danger zone</p>
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-[#111]">Delete this class</p>
                <p className="text-[12px] text-[#6B7280] mt-0.5">
                  Permanently removes all modules, assignments, and attendance records. This cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="shrink-0 h-9 px-4 text-[13px] font-medium border border-red-300 text-[#991B1B] rounded-lg hover:bg-red-50 transition-colors"
              >
                Delete class
              </button>
            </div>
          </div>
        </div>
      )}

      {classData && (
        <DeleteClassModal
          classTitle={classData.title}
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isPending={deleteClass.isPending}
        />
      )}
    </div>
  )
}
