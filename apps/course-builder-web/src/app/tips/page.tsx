import * as React from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { getAbility } from '@/ability'
import { CreateTip } from '@/app/tips/_components/create-tip'
import { getTipsModule } from '@/lib/tips-query'
import { getServerAuthSession } from '@/server/auth'

import { Card, CardHeader, CardTitle } from '@coursebuilder/ui'

export default async function TipsListPage() {
  return (
    <div className="bg-muted flex h-full flex-grow flex-col-reverse gap-3 p-5 md:flex-row">
      <div className="flex h-full flex-grow flex-col space-y-2 md:order-2">
        <h2 className="text-lg font-bold">Published Tips</h2>
        <TipList />
      </div>
      <Suspense>
        <TipListActions />
      </Suspense>
    </div>
  )
}

async function TipList() {
  const tipsModule = await getTipsModule()

  return (
    <>
      {tipsModule.map((tip) => (
        <Card key={tip._id}>
          <CardHeader>
            <CardTitle>
              <Link href={`/tips/${tip.slug || tip._id}`}>{tip.title}</Link>
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </>
  )
}

async function TipListActions() {
  const session = await getServerAuthSession()
  const ability = getAbility({ user: session?.user })
  return (
    <>
      {ability.can('create', 'Content') ? (
        <div className="order-1 h-full flex-grow md:order-2">
          <h1 className="pb-2 text-lg font-bold">Create Tip</h1>
          <CreateTip />
        </div>
      ) : null}
    </>
  )
}
