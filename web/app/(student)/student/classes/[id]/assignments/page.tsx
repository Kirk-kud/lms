import type { Metadata } from 'next'
import StudentAssignmentsPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Assignments · Love Inc',
}

export default function StudentAssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  return <StudentAssignmentsPageClient params={params} />
}
