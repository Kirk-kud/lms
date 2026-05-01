import type { Metadata } from 'next'
import StudentAssignmentsPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Assignments · Love\u00A0Inc',
}

export default function StudentAssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  return <StudentAssignmentsPageClient params={params} />
}
