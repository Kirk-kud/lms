import type { Metadata } from 'next'
import ClassesPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Classes · Love Inc',
}

export default function ClassesPage() {
  return <ClassesPageClient />
}
