import type { Metadata } from 'next'
import JoinClassPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Join Class · Love\u00A0Inc',
}

export default function JoinClassPage() {
  return <JoinClassPageClient />
}
