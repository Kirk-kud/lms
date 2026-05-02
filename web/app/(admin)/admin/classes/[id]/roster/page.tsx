import type { Metadata } from 'next'
import RosterPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Roster · Love\u00A0Inc',
}

export default function RosterPage({ params }: { params: Promise<{ id: string }> }) {
  return <RosterPageClient params={params} />
}
