import type { Metadata } from 'next'
import TutorModulesClient from './page.client'

export const metadata: Metadata = {
  title: 'Modules · Love Inc',
}

export default function TutorModulesPage() {
  return <TutorModulesClient />
}
