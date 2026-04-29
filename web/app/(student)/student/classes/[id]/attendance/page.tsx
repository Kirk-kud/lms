import type { Metadata } from 'next'
import StudentAttendancePageClient from './page.client'

export const metadata: Metadata = {
  title: 'Attendance · Love Inc',
}

export default function StudentAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  return <StudentAttendancePageClient params={params} />
}
