import type { Metadata } from 'next'
import TodoPageClient from './page.client'

export const metadata: Metadata = { title: 'To-do · Vine' }

export default function TodoPage() {
  return <TodoPageClient />
}
