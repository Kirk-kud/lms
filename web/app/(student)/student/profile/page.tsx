import type { Metadata } from 'next'
import ProfilePageClient from './page.client'

export const metadata: Metadata = {
  title: 'Profile · Love Inc',
}

export default function StudentProfilePage() {
  return <ProfilePageClient />
}
