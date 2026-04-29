import type { Metadata } from 'next'
import RegisterPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Register · Love Inc',
}

export default function RegisterPage() {
  return <RegisterPageClient />
}
