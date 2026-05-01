import type { Metadata } from 'next'
import StudentModulesPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Modules · Love\u00A0Inc',
}

export default function StudentModulesPage({ params }: { params: Promise<{ id: string }> }) {
  return <StudentModulesPageClient params={params} />
}
