import type { Metadata } from 'next'
import JoinClassPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Join · Love Inc',
}

export default function JoinClassPage() {
  return <JoinClassPageClient />
}
