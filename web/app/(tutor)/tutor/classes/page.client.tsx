'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClasses, useCreateClass } from '@/lib/hooks/useClasses'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'
import { EmptyState } from '@/components/ui/shared/EmptyState'
import { LoadingSpinner } from '@/components/ui/shared/LoadingSpinner'
import { InlineError } from '@/components/ui/shared/InlineError'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ClassCard({ id, title, description, enrolledCount, inviteCode }: {
  id: string
  title: string
  description: string | null
  enrolledCount: number
  inviteCode: string
}) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    toast.success('Class code copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      onClick={() => router.push(`/tutor/classes/${id}/modules`)}
      className="border border-[#E5E5E5] rounded-xl p-5 cursor-pointer hover:border-[#8B1A2F]/30 hover:bg-[#FAFAFA] transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-medium text-[#111] truncate">{title}</h3>
          {description && (
            <p className="text-[12px] text-[#6B7280] mt-1 line-clamp-2">{description}</p>
          )}
        </div>
        <span className="text-[11px] text-[#9CA3AF] shrink-0">
          {enrolledCount} {enrolledCount === 1 ? 'student' : 'students'}
        </span>
      </div>

      <div
        className="mt-4 flex items-center gap-2 bg-[#F8F8F8] rounded-lg px-3 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[11px] text-[#9CA3AF] uppercase tracking-wider">Invite</span>
        <span className="flex-1 text-[13px] font-mono text-[#111] tracking-widest">
          {inviteCode}
        </span>
        <button
          onClick={handleCopy}
          className="text-[#6B7280] hover:text-[#8B1A2F] transition-colors"
          title="Copy invite code"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  )
}

function CreateClassModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const createClass = useCreateClass()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await createClass.mutateAsync({ title: title.trim(), description: description.trim() || undefined })
      setTitle('')
      setDescription('')
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to create class')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '36px',
    borderRadius: '8px',
    border: '0.5px solid #E5E5E5',
    fontSize: '13px',
    padding: '0 10px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium">New class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">Class name</label>
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
          <div>
            <label className="block text-[12px] text-[#6B6B6B] mb-1">
              Description <span className="text-[#9CA3AF]">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                ...inputStyle,
                height: 'auto',
                padding: '8px 10px',
                resize: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-[13px] text-[#6B7280] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createClass.isPending || !title.trim()}
              className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/90 transition-colors flex items-center gap-2"
            >
              {createClass.isPending && <LoadingSpinner className="text-white" />}
              {createClass.isPending ? 'Creating...' : 'Create class'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ClassesPageClient() {
  const {
    data: classes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useClasses()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-medium text-[#111]">Classes</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
        >
          + New class
        </button>
      </div>

      {isError && (
        <InlineError
          message={error instanceof ApiError ? error.message : 'Unable to load classes'}
          onRetry={() => refetch()}
        />
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      )}

      {!isLoading && classes.length === 0 && (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          }
          title="No classes yet"
          description="Create a class and share the invite code with your students"
          actionLabel="Create class"
          onAction={() => setShowCreate(true)}
        />
      )}

      {!isLoading && classes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((c) => (
            <ClassCard
              key={c.id}
              id={c.id}
              title={c.title}
              description={c.description}
              enrolledCount={c.enrolled_count}
              inviteCode={c.invite_code}
            />
          ))}
        </div>
      )}

      <CreateClassModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
