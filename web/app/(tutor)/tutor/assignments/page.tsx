import type { Metadata } from 'next'
import TutorAssignmentsClient from './page.client'

export const metadata: Metadata = {
  title: 'Assignments · Love Inc',
}

export default function TutorAssignmentsPage() {
  return <TutorAssignmentsClient />
}
