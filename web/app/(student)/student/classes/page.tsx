import type { Metadata } from 'next'
import ClassesPageClient from './page.client'

export const metadata: Metadata = { title: 'My Classes · Vine' }

export default function ClassesPage() {
  return <ClassesPageClient />
}
