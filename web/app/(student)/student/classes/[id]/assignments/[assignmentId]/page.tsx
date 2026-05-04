import type { Metadata } from 'next'
import AssignmentDetailPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Submit Assignment · Vine',
}

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>
}) {
  return <AssignmentDetailPageClient params={params} />
}
