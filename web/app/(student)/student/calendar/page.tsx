import type { Metadata } from 'next'
import CalendarPageClient from './page.client'

export const metadata: Metadata = { title: 'Calendar · Vine' }

export default function CalendarPage() {
  return <CalendarPageClient />
}
