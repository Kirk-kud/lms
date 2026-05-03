import { redirect } from 'next/navigation'

export default async function ClassIndexPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/admin/classes/${id}/cohorts`)
}
