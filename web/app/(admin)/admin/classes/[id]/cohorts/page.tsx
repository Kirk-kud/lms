import type { Metadata } from 'next'
import CohortsPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Cohorts · Love Inc',
}

export default function CohortsPage({ params }: { params: Promise<{ id: string }> }) {
  return <CohortsPageClient params={params} />
}
