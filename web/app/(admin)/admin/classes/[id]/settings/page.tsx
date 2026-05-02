import type { Metadata } from 'next'
import SettingsPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Settings · Love Inc',
}

export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  return <SettingsPageClient params={params} />
}
