import type { Metadata } from 'next'
import AnnouncementsPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Announcements · Love Inc',
}

export default function AnnouncementsPage() {
  return <AnnouncementsPageClient />
}
