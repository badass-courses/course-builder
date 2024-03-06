import * as React from 'react'
import { notFound, redirect } from 'next/navigation'
import Tree from '@/components/lesson-list/tree'
import ModuleEdit from '@/components/module-edit'
import { getAbility } from '@/lib/ability'
import { getServerAuthSession } from '@/server/auth'
import { api } from '@/trpc/server'

export const dynamic = 'force-dynamic'

export default async function EditTutorialPage({ params }: { params: { module: string } }) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })

  if (!ability.can('update', 'Content')) {
    redirect('/login')
  }

  const tutorial = await api.module.getTutorial.query({ slug: params.module })

  if (!tutorial) {
    notFound()
  }

  return (
    <>
      <ModuleEdit tutorial={tutorial} />
    </>
  )
}
