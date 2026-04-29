import type { Metadata } from 'next'
import AttendancePageClient from './page.client'

export const metadata: Metadata = {
  title: 'Attendance · Love Inc',
}

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  return <AttendancePageClient params={params} />
}
