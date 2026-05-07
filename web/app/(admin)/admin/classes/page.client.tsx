'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClasses, useCreateClass } from '@/lib/hooks/useClasses'
import { useUser } from '@/lib/hooks/useUser'
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
  const [hovered, setHovered] = useState(false)
  const isDA = title.toLowerCase().includes('discipleship')

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    toast.success('Class code copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const bannerStyle: React.CSSProperties = isDA
    ? {
        height: '160px',
        background: '#F5EEF0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }
    : {
        height: '100px',
        background: `hsl(${(title.charCodeAt(0) * 47) % 360}, 35%, 55%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }

  return (
    <div
      onClick={() => router.push(`/admin/classes/${id}/modules`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: hovered ? '#C9B8B4' : '#E5E5E5',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 120ms ease',
        background: '#FFFFFF',
      }}
    >
      {/* Banner */}
      <div style={bannerStyle}>
        {isDA ? (
          <img
            src="/da-logo.png"
            alt="The Discipleship Academy"
            style={{ width: '120px', height: '120px', objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: '36px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
            {title.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {isDA && (
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#8B1A2F', textTransform: 'uppercase', letterSpacing: '0.10em', margin: 0 }}>
            The Discipleship Academy
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {title}
          </p>
          <span style={{ fontSize: '11px', color: '#9CA3AF', flexShrink: 0 }}>
            {enrolledCount} {enrolledCount === 1 ? 'student' : 'students'}
          </span>
        </div>
        {description && (
          <p style={{ fontSize: '12.5px', color: '#6B7280', margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {description}
          </p>
        )}

        {/* Invite code */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8F8F8', borderRadius: '7px', padding: '7px 10px', marginTop: '4px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Invite</span>
          <span style={{ flex: 1, fontSize: '12.5px', fontFamily: 'monospace', color: '#111', letterSpacing: '0.12em' }}>{inviteCode}</span>
          <button
            onClick={handleCopy}
            style={{ color: copied ? '#1F8B4C' : '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            title="Copy invite code"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>

        <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: hovered ? '#FFFFFF' : '#8B1A2F',
              backgroundColor: hovered ? '#8B1A2F' : 'rgba(139,26,47,0.08)',
              padding: '5px 14px',
              borderRadius: '6px',
              transition: 'background 120ms ease, color 120ms ease',
            }}
          >
            Open →
          </span>
        </div>
      </div>
    </div>
  )
}

function CreateClassModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const createClass = useCreateClass()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      const newClass = await createClass.mutateAsync({ title: title.trim(), description: description.trim() || undefined })
      setTitle('')
      setDescription('')
      onClose()
      onCreated(newClass.id)
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
  const router = useRouter()
  const { user } = useUser()
  const {
    data: classes = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useClasses()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="p-4 sm:p-8">
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

      <CreateClassModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(id) => router.push(`/admin/classes/${id}/modules`)}
      />
    </div>
  )
}
