import type { Metadata } from 'next'
import TutorDashboardClient from './page.client'

export const metadata: Metadata = {
  title: 'Dashboard · Love Inc',
}

export default function TutorDashboardPage() {
  return <TutorDashboardClient />
}
