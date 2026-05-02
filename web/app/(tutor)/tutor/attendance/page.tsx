import type { Metadata } from 'next'
import TutorAttendanceClient from './page.client'

export const metadata: Metadata = {
  title: 'Attendance · Love Inc',
}

export default function TutorAttendancePage() {
  return <TutorAttendanceClient />
}
