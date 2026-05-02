import type { Metadata } from 'next'
import ClassesPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Classes · Love\u00A0Inc',
}

export default function ClassesPage() {
  return <ClassesPageClient />
}
