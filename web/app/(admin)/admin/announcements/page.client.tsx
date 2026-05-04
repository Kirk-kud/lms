'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import { useClasses } from '@/lib/hooks/useClasses'
import {
  useAnnouncements,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  type Announcement,
} from '@/lib/hooks/useAnnouncements'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'

// ── Shared input style ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '8px',
  border: '0.5px solid #E5E5E5',
  fontSize: '13px',
  padding: '8px 10px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  backgroundColor: '#FFFFFF',
  color: '#111111',
}

function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#8B1A2F'
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#E5E5E5'
}

// ── Trash icon ───────────────────────────────────────────────────────────────

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M11.5 3.5l-.7 8a1 1 0 0 1-1 .9H4.2a1 1 0 0 1-1-.9l-.7-8" />
    </svg>
  )
}

// ── Compose form ─────────────────────────────────────────────────────────────

function ComposeForm() {
  const [title, setTitle]             = useState('')
  const [body, setBody]               = useState('')
  const [selectedClass, setSelectedClass] = useState('')

  const { data: classes = [] } = useClasses()
  const create = useCreateAnnouncement()

  const isValid = title.trim().length > 0 && body.trim().length > 0 && selectedClass.length > 0

  const handleSend = async () => {
    if (!isValid) return
    try {
      await create.mutateAsync({
        class_id: selectedClass,
        title: title.trim(),
        body: body.trim(),
      })
      toast.success('Announcement sent')
      setTitle('')
      setBody('')
      setSelectedClass('')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to send')
    }
  }

  return (
    <div style={{
      backgroundColor: '#FAFAFA',
      border: '0.5px solid #E5E5E5',
      borderRadius: '12px',
      padding: '20px',
    }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#111111', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        New Announcement
      </p>

      {/* Class selector */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B6168', marginBottom: '6px' }}>
          Class
        </label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          onFocus={focusInput}
          onBlur={blurInput}
          style={{ ...inputStyle, height: '36px' }}
        >
          <option value="">Select a class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B6168', marginBottom: '6px' }}>
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={focusInput}
          onBlur={blurInput}
          placeholder="Announcement title"
          style={{ ...inputStyle, height: '36px' }}
        />
      </div>

      {/* Body */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6B6168', marginBottom: '6px' }}>
          Message
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={focusInput}
          onBlur={blurInput}
          rows={4}
          placeholder="Type your announcement..."
          style={{ ...inputStyle, resize: 'vertical', minHeight: '90px' }}
        />
      </div>

      <button
        onClick={handleSend}
        disabled={!isValid || create.isPending}
        style={{
          width: '100%',
          height: '36px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: !isValid || create.isPending ? '#D1D5DB' : '#111111',
          color: '#FFFFFF',
          fontSize: '13px',
          fontWeight: 600,
          cursor: !isValid || create.isPending ? 'not-allowed' : 'pointer',
          transition: 'background-color 120ms ease',
        }}
        onMouseEnter={(e) => {
          if (isValid && !create.isPending)
            (e.currentTarget as HTMLElement).style.backgroundColor = '#8B1A2F'
        }}
        onMouseLeave={(e) => {
          if (isValid && !create.isPending)
            (e.currentTarget as HTMLElement).style.backgroundColor = '#111111'
        }}
      >
        {create.isPending ? 'Sending…' : 'Send Announcement'}
      </button>
    </div>
  )
}

// ── Announcement card ────────────────────────────────────────────────────────

function AnnouncementCard({ item }: { item: Announcement }) {
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const remove = useDeleteAnnouncement()

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return }
    try {
      await remove.mutateAsync(item.id)
      toast.success('Announcement deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div style={{
      border: '0.5px solid #E5E5E5',
      borderRadius: '10px',
      padding: '14px 16px',
      backgroundColor: '#FFFFFF',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div>
          <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#111111', margin: 0 }}>{item.title}</p>
          {item.class?.title && (
            <span style={{
              display: 'inline-block', marginTop: '4px',
              padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
              backgroundColor: '#EDE9FE', color: '#5B21B6',
            }}>
              {item.class.title}
            </span>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={remove.isPending}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '0.5px solid',
            borderColor: confirming ? '#DC2626' : '#E5E5E5',
            backgroundColor: confirming ? '#FEF2F2' : 'transparent',
            color: confirming ? '#DC2626' : '#9C949A',
            fontSize: '11.5px',
            fontWeight: 500,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 120ms ease',
          }}
        >
          <TrashIcon />
          {confirming ? 'Confirm?' : 'Delete'}
        </button>
      </div>

      <p style={{
        fontSize: '13.5px',
        color: '#111111',
        margin: '10px 0 0',
        lineHeight: 1.55,
        display: '-webkit-box',
        WebkitLineClamp: expanded ? undefined : 3,
        WebkitBoxOrient: 'vertical',
        overflow: expanded ? 'visible' : 'hidden',
      }}>
        {item.body}
      </p>

      {item.body.length > 160 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none', border: 'none', padding: 0, marginTop: '4px',
            fontSize: '12px', fontWeight: 600, color: '#8B1A2F', cursor: 'pointer',
          }}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      <p style={{ fontSize: '11.5px', color: '#9C949A', margin: '8px 0 0' }}>
        {format(new Date(item.created_at), 'MMM d, yyyy · h:mm a')}
        {item.author?.full_name && ` · ${item.author.full_name}`}
      </p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AnnouncementsPageClient() {
  const { data: announcements = [], isLoading, error } = useAnnouncements()

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111111', margin: 0 }}>
          Announcements
        </h1>
        <p style={{ fontSize: '13px', color: '#6B6168', margin: '4px 0 0' }}>
          Broadcast messages to your class students
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start' }}
           className="grid-announcements">
        {/* Compose */}
        <ComposeForm />

        {/* List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111111', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Sent
            </p>
            {!isLoading && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '20px', height: '20px', padding: '0 6px',
                borderRadius: '999px', backgroundColor: '#F0EDE9',
                fontSize: '11px', fontWeight: 700, color: '#6B6168',
              }}>
                {announcements.length}
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <p style={{ fontSize: '13px', color: '#DC2626' }}>Failed to load announcements</p>
          ) : announcements.length === 0 ? (
            <div style={{
              border: '0.5px solid #E5E5E5', borderRadius: '10px', padding: '40px 20px',
              textAlign: 'center', backgroundColor: '#FAFAFA',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', margin: 0 }}>No announcements yet</p>
              <p style={{ fontSize: '12.5px', color: '#9C949A', margin: '4px 0 0' }}>Send your first announcement using the form</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {announcements.map((a) => (
                <AnnouncementCard key={a.id} item={a} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsive collapse for mobile */}
      <style>{`
        @media (max-width: 768px) {
          .grid-announcements {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
