'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useClasses, useCreateClass, type ClassRecord } from '@/lib/hooks/useClasses'
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

type SortKey = 'newest' | 'oldest' | 'most-students' | 'fewest-students'

// ── Icons ────────────────────────────────────────────────────────────────────

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

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10 10l3 3" />
    </svg>
  )
}

// ── Class card ───────────────────────────────────────────────────────────────

function ClassCard({ cls }: { cls: ClassRecord }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(cls.invite_code)
    setCopied(true)
    toast.success('Class code copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      onClick={() => router.push(`/admin/classes/${cls.id}/cohorts`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `0.5px solid ${hovered ? '#8B1A2F44' : '#E5E5E5'}`,
        borderRadius: '12px',
        padding: '18px',
        cursor: 'pointer',
        backgroundColor: hovered ? '#FAFAFA' : '#FFFFFF',
        transition: 'border-color 150ms ease, background-color 150ms ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cls.title}
          </h3>
          {cls.description && (
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {cls.description}
            </p>
          )}
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '2px', color: hovered ? '#8B1A2F' : '#D1D5DB', transition: 'color 150ms ease' }}>
          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: '#6B7280' }}>
          <strong style={{ color: '#111', fontWeight: 600 }}>{cls.enrolled_count}</strong> {cls.enrolled_count === 1 ? 'student' : 'students'}
        </span>
        {cls.cohort_count !== undefined && (
          <span style={{ fontSize: '12px', color: '#6B7280' }}>
            <strong style={{ color: '#111', fontWeight: 600 }}>{cls.cohort_count}</strong> {cls.cohort_count === 1 ? 'cohort' : 'cohorts'}
          </span>
        )}
        {cls.tutor && (
          <span style={{ fontSize: '12px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            by <span style={{ color: '#111', fontWeight: 500 }}>{cls.tutor.full_name}</span>
          </span>
        )}
      </div>

      {/* Invite code */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8F8F8', borderRadius: '8px', padding: '8px 12px' }}
      >
        <span style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Invite</span>
        <span style={{ flex: 1, fontSize: '13px', fontFamily: 'monospace', color: '#111', letterSpacing: '0.15em' }}>{cls.invite_code}</span>
        <button
          onClick={handleCopy}
          style={{ color: copied ? '#8B1A2F' : '#6B7280', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px', transition: 'color 150ms ease' }}
          title="Copy invite code"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  )
}

// ── Create class modal ───────────────────────────────────────────────────────

function CreateClassModal({ open, onClose, onCreated }: {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const [title, setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const createClass = useCreateClass()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      const newClass = await createClass.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
      })
      setTitle('')
      setDescription('')
      onClose()
      onCreated(newClass.id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to create class')
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
              onBlur={(e)  => (e.currentTarget.style.borderColor = '#E5E5E5')}
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
              style={{ ...inputStyle, height: 'auto', padding: '8px 10px', resize: 'none' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = '#E5E5E5')}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="h-9 px-4 text-[13px] text-[#6B7280] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={createClass.isPending || !title.trim()}
              className="h-9 px-4 text-[13px] font-medium bg-black text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/90 transition-colors flex items-center gap-2">
              {createClass.isPending && <LoadingSpinner className="text-white" />}
              {createClass.isPending ? 'Creating...' : 'Create class'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ClassesPageClient() {
  const router = useRouter()
  const { data: classes = [], isLoading, isError, error, refetch } = useClasses()

  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch]         = useState('')
  const [sortKey, setSortKey]       = useState<SortKey>('newest')

  const filtered = useMemo(() => {
    let list = [...classes]

    // Search by title
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.title.toLowerCase().includes(q))
    }

    // Sort
    switch (sortKey) {
      case 'oldest':
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'most-students':
        list.sort((a, b) => b.enrolled_count - a.enrolled_count)
        break
      case 'fewest-students':
        list.sort((a, b) => a.enrolled_count - b.enrolled_count)
        break
      default: // newest
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return list
  }, [classes, search, sortKey])

  return (
    <div className="w-full p-6 md:p-8">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111', margin: 0 }}>Courses</h1>
          {!isLoading && (
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '3px 0 0' }}>
              {classes.length} {classes.length === 1 ? 'class' : 'classes'} in the system
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            height: '36px', padding: '0 16px', fontSize: '13px', fontWeight: 600,
            backgroundColor: '#111111', color: '#FFFFFF', border: 'none',
            borderRadius: '8px', cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#8B1A2F')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#111111')}
        >
          + New class
        </button>
      </div>

      {/* Search + Sort toolbar */}
      {!isLoading && classes.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search classes…"
              style={{
                width: '100%', height: '34px', paddingLeft: '32px', paddingRight: '10px',
                borderRadius: '8px', border: '0.5px solid #E5E5E5', fontSize: '13px',
                outline: 'none', boxSizing: 'border-box', backgroundColor: '#FAFAFA',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#8B1A2F')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = '#E5E5E5')}
            />
          </div>

          {/* Sort */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            style={{
              height: '34px', padding: '0 10px', borderRadius: '8px',
              border: '0.5px solid #E5E5E5', fontSize: '12.5px', color: '#374151',
              backgroundColor: '#FAFAFA', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="most-students">Most students</option>
            <option value="fewest-students">Fewest students</option>
          </select>

          {/* Result count when searching */}
          {search.trim() && (
            <span style={{ fontSize: '12px', color: '#9CA3AF', flexShrink: 0 }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {isError && (
        <InlineError
          message={error instanceof ApiError ? error.message : 'Unable to load classes'}
          onRetry={() => refetch()}
        />
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      )}

      {/* Empty state — no classes at all */}
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

      {/* Empty search result */}
      {!isLoading && classes.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>No classes match &quot;{search}&quot;</p>
          <button
            onClick={() => setSearch('')}
            style={{ fontSize: '13px', color: '#8B1A2F', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Clear search
          </button>
        </div>
      )}

      {/* Class grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cls) => (
            <ClassCard key={cls.id} cls={cls} />
          ))}
        </div>
      )}

      <CreateClassModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(id) => router.push(`/admin/classes/${id}/cohorts`)}
      />
    </div>
  )
}
