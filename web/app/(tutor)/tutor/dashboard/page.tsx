import type { Metadata } from 'next'
import DashboardPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Dashboard · Love\u00A0Inc',
}

export default function DashboardPage() {
  return <DashboardPageClient />
}
