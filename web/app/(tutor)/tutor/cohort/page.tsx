import type { Metadata } from 'next'
import TutorCohortClient from './page.client'

export const metadata: Metadata = {
  title: 'My Cohort · Love Inc',
}

export default function TutorCohortPage() {
  return <TutorCohortClient />
}
