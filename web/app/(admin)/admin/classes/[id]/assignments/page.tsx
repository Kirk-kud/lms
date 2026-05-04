import type { Metadata } from 'next'
import AssignmentsPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Assignments · Love\u00A0Inc',
}

export default function AssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  return <AssignmentsPageClient params={params} />
}
