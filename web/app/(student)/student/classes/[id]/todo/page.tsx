import type { Metadata } from 'next'
import ClassTodoPageClient from './page.client'

export const metadata: Metadata = {
  title: 'To-do · Vine LMS',
}

export default function ClassTodoPage({ params }: { params: Promise<{ id: string }> }) {
  return <ClassTodoPageClient params={params} />
}
