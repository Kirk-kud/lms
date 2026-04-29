import type { Metadata } from 'next'
import ModulesPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Modules · Love Inc',
}

export default function ModulesPage({ params }: { params: Promise<{ id: string }> }) {
  return <ModulesPageClient params={params} />
}
