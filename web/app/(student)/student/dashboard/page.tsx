import type { Metadata } from 'next'
import StudentDashboardPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Dashboard · Love Inc',
}

export default function StudentDashboardPage() {
  return <StudentDashboardPageClient />
}
