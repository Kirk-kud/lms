import type { Metadata } from 'next'
import CalendarPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Calendar · Love Inc',
}

export default function CalendarPage() {
  return <CalendarPageClient />
}
