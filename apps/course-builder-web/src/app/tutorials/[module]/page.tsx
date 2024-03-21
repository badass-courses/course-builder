import * as React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getAbility } from '@/ability'
import { getServerAuthSession } from '@/server/auth'

import { Separator } from '@coursebuilder/ui'

export default async function ModulePage({
  params,
}: {
  params: { module: string }
}) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })

  if (!ability.can('read', 'Content')) {
    redirect('/login')
  }

  const course: any = null

  if (!course) {
    notFound()
  }

  return (
    <div className="hidden h-full flex-col md:flex">
      <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
        <h2 className="text-lg font-semibold">{course.title}</h2>
        <p>{course.description}</p>
        {ability.can('update', 'Content') && (
          <Link href={`/tutorials/${params.module}/edit`}>edit module</Link>
        )}
      </div>
      <Separator />
    </div>
  )
}
