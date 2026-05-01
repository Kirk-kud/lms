import type { Metadata } from 'next'
import LoginPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Login · Love\u00A0Inc',
}

export default function LoginPage() {
  return <LoginPageClient />
}
