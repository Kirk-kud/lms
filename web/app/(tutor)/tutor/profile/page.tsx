import type { Metadata } from 'next'
import ProfileView from '@/components/ui/shared/ProfileView'

export const metadata: Metadata = {
  title: 'Profile · Love Inc',
}

export default function TutorProfilePage() {
  return <ProfileView />
}
