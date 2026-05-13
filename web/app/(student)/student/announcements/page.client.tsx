'use client'

import { format, formatDistanceToNow } from 'date-fns'
import { useAnnouncements } from '@/lib/hooks/useAnnouncements'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'

export default function AnnouncementsPageClient() {
  const { data: announcements = [], isLoading } = useAnnouncements()

  return (
    <div className="p-4 sm:p-8">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111111', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 6px' }}>
          Announcements
        </h1>
        <p style={{ fontSize: '13.5px', color: '#6B7280', margin: 0 }}>
          Messages from your tutors
        </p>
      </div>

      {isLoading && <SkeletonCard lines={5} />}

      {!isLoading && announcements.length === 0 && (
        <div style={{
          border: '1px dashed #E5E5E5', borderRadius: '12px',
          padding: '64px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            backgroundColor: 'rgba(139,26,47,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#111111', margin: '0 0 6px' }}>No announcements yet</p>
          <p style={{ fontSize: '13.5px', color: '#6B7280', margin: 0 }}>Your tutors haven&apos;t posted anything yet.</p>
        </div>
      )}

      {!isLoading && announcements.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {announcements.map((a) => (
            <div
              key={a.id}
              style={{
                backgroundColor: '#FFFFFF',
                border: '0.5px solid #E5E5E5',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 20px 12px', borderBottom: '0.5px solid #E5E5E5', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{
                    display: 'inline-block', fontSize: '10px', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B1A2F',
                    background: 'rgba(139,26,47,0.07)', padding: '3px 8px',
                    borderRadius: '4px', marginBottom: '8px',
                  }}>
                    {a.target_type === 'all_tutors' ? 'All Tutors' : a.target_type === 'whole_class' ? 'Whole Class' : 'Your Cohort'}
                  </span>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                    From {a.is_anonymous ? 'Admin' : (a.creator?.full_name ?? 'Admin')}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 2px', whiteSpace: 'nowrap' }}>
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </p>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, whiteSpace: 'nowrap' }}>
                    {format(new Date(a.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: '14px', color: '#111111', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {a.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
