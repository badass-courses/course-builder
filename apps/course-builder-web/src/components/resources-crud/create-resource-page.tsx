import * as React from 'react'
import { notFound } from 'next/navigation'
import { getAbility } from '@/ability'
import { CreateResourceCard } from '@/components/resources-crud/create-resource-card'
import { getServerAuthSession } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function CreateResourcePage({ resourceType }: { resourceType: string }) {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })

  if (!ability.can('create', 'Content')) {
    notFound()
  }

  return (
    <div className="flex flex-col">
      <CreateResourceCard resourceType={resourceType} />
    </div>
  )
}
