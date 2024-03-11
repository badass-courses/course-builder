import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import { getAbility } from '@/ability'
import ModuleEdit from '@/components/module-edit'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function EditTutorialPage({ params }: { params: { module: string } }) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })

  if (!ability.can('update', 'Content')) {
    redirect('/login')
  }

  const tutorial = null

  if (!tutorial) {
    notFound()
  }

  return (
    <>
      <ModuleEdit tutorial={tutorial} />
    </>
  )
}
