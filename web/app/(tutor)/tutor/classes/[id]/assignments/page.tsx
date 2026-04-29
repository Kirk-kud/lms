import type { Metadata } from 'next'
import AssignmentsPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Assignments · Love Inc',
}

export default function AssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  return <AssignmentsPageClient params={params} />
}
