import type { Metadata } from 'next'
import ClassDetailPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Class · Love Inc',
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ClassDetailPageClient params={params} />
}
