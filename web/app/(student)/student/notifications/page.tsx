import type { Metadata } from 'next'
import NotificationsPageClient from './page.client'

export const metadata: Metadata = { title: 'Notifications · Vine' }

export default function NotificationsPage() {
  return <NotificationsPageClient />
}
