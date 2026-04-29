import type { Metadata } from 'next'
import DashboardPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Dashboard · Love Inc',
}

export default function DashboardPage() {
  return <DashboardPageClient />
}
