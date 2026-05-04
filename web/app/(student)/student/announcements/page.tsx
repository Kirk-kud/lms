import type { Metadata } from 'next'
import AnnouncementsPageClient from './page.client'

export const metadata: Metadata = { title: 'Announcements · Vine' }

export default function AnnouncementsPage() {
  return <AnnouncementsPageClient />
}
