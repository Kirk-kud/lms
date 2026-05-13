import type { Metadata } from 'next'
import ClassCalendarPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Calendar · Vine LMS',
}

export default function ClassCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  return <ClassCalendarPageClient params={params} />
}
