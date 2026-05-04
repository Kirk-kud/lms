'use client'

import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, AppNotification } from '@/lib/hooks/useNotifications'
import { SkeletonCard } from '@/components/ui/shared/SkeletonCard'

function groupByDate(notifications: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const groups: Map<string, AppNotification[]> = new Map()

  notifications.forEach((n) => {
    const d = new Date(n.created_at)
    let label: string
    if (isToday(d)) label = 'Today'
    else if (isYesterday(d)) label = 'Yesterday'
    else label = format(d, 'EEEE, MMM d')

    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(n)
  })

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }))
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'new_assignment') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    )
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-9.1 4a2 2 0 0 1-1.8 0"/>
    </svg>
  )
}

export default function NotificationsPageClient() {
  const { data: notifications = [], isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const unreadCount = notifications.filter((n) => !n.read).length
  const groups = groupByDate(notifications)

  return (
    <div className="p-4 sm:p-8">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0A0A0B', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span style={{
                fontSize: '12px', fontWeight: 600, color: '#8B1A2F',
                background: 'rgba(139,26,47,0.08)', padding: '3px 10px',
                borderRadius: '999px',
              }}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <p style={{ fontSize: '13.5px', color: '#9C949A', margin: '6px 0 0' }}>
            Updates from your classes
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAll.mutate()}
            style={{
              height: '34px', padding: '0 16px',
              backgroundColor: 'transparent', color: '#8B1A2F',
              border: '1px solid #ECE6E0', borderRadius: '8px',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {isLoading && <SkeletonCard lines={5} />}

      {!isLoading && notifications.length === 0 && (
        <div style={{
          border: '1px dashed #ECE6E0', borderRadius: '12px',
          padding: '64px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            backgroundColor: 'rgba(139,26,47,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B1A2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-9.1 4a2 2 0 0 1-1.8 0"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0B', margin: '0 0 6px' }}>You&apos;re all caught up</p>
          <p style={{ fontSize: '13.5px', color: '#9C949A', margin: 0 }}>No notifications yet.</p>
        </div>
      )}

      {!isLoading && groups.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {groups.map(({ label, items }) => (
            <div key={label}>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9C949A', margin: '0 0 8px' }}>
                {label}
              </p>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECE6E0', borderRadius: '12px', overflow: 'hidden' }}>
                {items.map((n, i) => (
                  <button
                    key={n.id}
                    onClick={() => { if (!n.read) markRead.mutate(n.id) }}
                    style={{
                      width: '100%', textAlign: 'left', border: 'none',
                      borderBottom: i < items.length - 1 ? '1px solid #F3F4F6' : 'none',
                      padding: '16px 20px', cursor: n.read ? 'default' : 'pointer',
                      background: n.read ? 'transparent' : 'rgba(139,26,47,0.025)',
                      display: 'flex', gap: '14px', alignItems: 'flex-start',
                    }}
                    onMouseEnter={(e) => { if (!n.read) e.currentTarget.style.background = 'rgba(139,26,47,0.05)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(139,26,47,0.025)' }}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: 'rgba(139,26,47,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <NotifIcon type={n.type} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <p style={{ fontSize: '13.5px', fontWeight: n.read ? 500 : 700, color: '#0A0A0B', margin: '0 0 4px' }}>
                          {n.title}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {!n.read && (
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#8B1A2F' }} />
                          )}
                          <span style={{ fontSize: '12px', color: '#9C949A', whiteSpace: 'nowrap' }}>
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      {n.body && (
                        <p style={{ fontSize: '13px', color: '#6B6168', margin: 0, lineHeight: 1.5 }}>
                          {n.body}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
